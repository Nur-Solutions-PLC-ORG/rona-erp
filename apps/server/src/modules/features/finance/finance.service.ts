import { Injectable } from '@nestjs/common';
import { pooledDb } from '@/db';
import { FinanceRepository } from './finance.repository';
import {
  CostNotFoundException,
  InvoiceNotFoundException,
  InvoiceStateException,
  PaymentNotFoundException,
  PaymentOverpayException,
  SalesOrderNotFoundException,
  SalesOrderStateException,
} from './finance.exception';
import { AuditService } from '@/modules/audit/audit.service';
import { SalesOrderRepository } from '@/modules/features/sales/orders/orders.repository';
import type {
  CostCreateInput,
  CostListParams,
  CostUpdateInput,
  InvoiceCreateInput,
  InvoiceListParams,
  PaymentCreateInput,
  PaymentUpdateInput,
} from '@rona/types/finance';

@Injectable()
export class FinanceService {
  constructor(
    private readonly repo: FinanceRepository,
    private readonly ordersRepo: SalesOrderRepository,
    private readonly audit: AuditService,
  ) {}

  async createInvoice(data: InvoiceCreateInput) {
    const order = await this.ordersRepo.findById(data.salesOrderId);
    if (!order) throw new SalesOrderNotFoundException();
    if (order.status === 'DRAFT') {
      throw new SalesOrderStateException(
        'Confirm the sales order before invoicing it',
      );
    }
    if (order.status === 'CANCELLED') {
      throw new SalesOrderStateException(
        'Cancelled sales orders cannot be invoiced',
      );
    }

    const lines = await this.ordersRepo.findLines(order.id);
    const invoice = await pooledDb.transaction(async (tx) =>
      this.repo.createInvoiceFromOrder(data, order, lines, tx),
    );
    await this.audit.record({
      organizationId: invoice.organizationId,
      action: 'FINANCE_INVOICE_CREATE',
      entityType: 'Invoice',
      entityId: invoice.id,
      after: invoice,
    });
    return invoice;
  }

  async issueInvoice(id: string) {
    const issued = await pooledDb.transaction(async (tx) => {
      const invoice = await this.repo.findInvoiceForUpdate(id, tx);
      if (!invoice) throw new InvoiceNotFoundException();
      if (invoice.status !== 'DRAFT') {
        throw new InvoiceStateException('Only draft invoices can be issued');
      }

      return this.repo.updateInvoiceStatus(
        id,
        'ISSUED',
        {
          issueDate: new Date(),
        },
        tx,
      );
    });
    await this.audit.record({
      organizationId: issued.organizationId,
      action: 'FINANCE_INVOICE_ISSUE',
      entityType: 'Invoice',
      entityId: id,
      after: issued,
    });
    return issued;
  }

  async voidInvoice(id: string) {
    const voided = await pooledDb.transaction(async (tx) => {
      const invoice = await this.repo.findInvoiceForUpdate(id, tx);
      if (!invoice) throw new InvoiceNotFoundException();
      if (invoice.status === 'PAID') {
        throw new InvoiceStateException('Paid invoices cannot be voided');
      }
      if (Number(invoice.paidTotal) > 0) {
        throw new InvoiceStateException(
          'Invoices with recorded payments cannot be voided',
        );
      }

      const updated = await this.repo.transitionInvoiceStatus(
        id,
        invoice.status,
        'VOID',
        undefined,
        tx,
      );
      if (!updated) {
        throw new InvoiceStateException('Invoice status changed while voiding');
      }
      return updated;
    });
    await this.audit.record({
      organizationId: voided.organizationId,
      action: 'FINANCE_INVOICE_VOID',
      entityType: 'Invoice',
      entityId: id,
      after: voided,
    });
    return voided;
  }

  async findInvoice(id: string) {
    const invoice = await this.repo.findInvoice(id);
    if (!invoice) throw new InvoiceNotFoundException();
    return invoice;
  }

  async listInvoices(params: InvoiceListParams) {
    return this.repo.listInvoices(params);
  }

  async createPayment(data: PaymentCreateInput) {
    return pooledDb.transaction(async (tx) => {
      const payment = await this.repo.createPayment(data, tx);

      for (const allocation of data.allocations) {
        const invoice = await this.repo.findInvoiceForUpdate(
          allocation.invoiceId,
          tx,
        );
        if (!invoice) throw new InvoiceNotFoundException();

        const outstanding = Number(invoice.remainingBalance);
        if (Number(allocation.amount) > outstanding + 0.001) {
          throw new PaymentOverpayException();
        }

        await this.repo.createAllocation(
          {
            paymentId: payment.id,
            invoiceId: allocation.invoiceId,
            amount: allocation.amount,
          },
          tx,
        );

        const paidTotal = Number(invoice.paidTotal) + Number(allocation.amount);
        const total = Number(invoice.total);
        const nextStatus =
          paidTotal >= total - 0.001 ? 'PAID' : 'PARTIALLY_PAID';
        await this.repo.updateInvoiceStatus(
          allocation.invoiceId,
          nextStatus,
          undefined,
          tx,
        );
      }

      await this.audit.record(
        {
          organizationId: payment.organizationId,
          action: 'FINANCE_PAYMENT_CREATE',
          entityType: 'Payment',
          entityId: payment.id,
          after: payment,
        },
        tx,
      );
      return payment;
    });
  }

  async listInvoicePayments(invoiceId: string) {
    const invoice = await this.repo.findInvoice(invoiceId);
    if (!invoice) throw new InvoiceNotFoundException();
    return this.repo.listPayments(invoiceId);
  }

  async listAllPayments(params: { page: number; limit: number }) {
    return this.repo.listAllPayments(params);
  }

  async updatePayment(id: string, data: PaymentUpdateInput) {
    const updated = await pooledDb.transaction(async (tx) => {
      const payment = await this.repo.findPaymentForUpdate(id, tx);
      if (!payment) throw new PaymentNotFoundException();
      return this.repo.updatePayment(id, data, tx);
    });

    if (!updated) throw new PaymentNotFoundException();

    await this.audit.record({
      organizationId: updated.organizationId,
      action: 'FINANCE_PAYMENT_UPDATE',
      entityType: 'Payment',
      entityId: id,
      after: updated,
    });
    return updated;
  }

  async deletePayment(id: string) {
    return pooledDb.transaction(async (tx) => {
      const payment = await this.repo.findPaymentForUpdate(id, tx);
      if (!payment) throw new PaymentNotFoundException();

      const allocations = await this.repo.findAllocationsByPayment(id, tx);
      await this.repo.deleteAllocationsByPayment(id, tx);
      await this.repo.deletePayment(id, tx);

      const invoiceIds = [...new Set(allocations.map((a) => a.invoiceId))];
      for (const invoiceId of invoiceIds) {
        const invoice = await this.repo.findInvoiceForUpdate(invoiceId, tx);
        if (!invoice) continue;

        const paid = Number(invoice.paidTotal);
        const total = Number(invoice.total);
        const nextStatus =
          paid <= 0.001
            ? 'ISSUED'
            : paid >= total - 0.001
              ? 'PAID'
              : 'PARTIALLY_PAID';
        await this.repo.updateInvoiceStatus(
          invoiceId,
          nextStatus,
          undefined,
          tx,
        );
      }

      await this.audit.record({
        organizationId: payment.organizationId,
        action: 'FINANCE_PAYMENT_DELETE',
        entityType: 'Payment',
        entityId: id,
        before: payment,
      });
      return payment;
    });
  }

  async createCost(data: CostCreateInput) {
    const cost = await this.repo.createCost(data);
    await this.audit.record({
      organizationId: cost.organizationId,
      action: 'FINANCE_COST_CREATE',
      entityType: 'Cost',
      entityId: cost.id,
      after: cost,
    });
    return cost;
  }

  async updateCost(id: string, data: CostUpdateInput) {
    const updated = await this.repo.updateCost(id, data);
    if (!updated) throw new CostNotFoundException();
    await this.audit.record({
      organizationId: updated.organizationId,
      action: 'FINANCE_COST_UPDATE',
      entityType: 'Cost',
      entityId: id,
      after: updated,
    });
    return updated;
  }

  async listCosts(params: CostListParams) {
    return this.repo.listCosts(params);
  }

  async findCost(id: string) {
    const cost = await this.repo.findCost(id);
    if (!cost) throw new CostNotFoundException();
    return cost;
  }
}
