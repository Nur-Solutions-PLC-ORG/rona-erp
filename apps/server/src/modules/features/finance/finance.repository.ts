import { and, desc, eq, sql, type SQL } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db, pooledDb } from '@/db';
import { organizations } from '@/db/schemas/admin';
import {
  costs,
  costCenters,
  invoiceLines,
  invoices,
  paymentAllocations,
  payments,
} from '@/db/schemas/finance';
import { customers, salesOrderLines, salesOrders } from '@/db/schemas/sales';
import { TenantScopedRepository } from '@/modules/tenancy/tenant-scoped.repository';
import type { Executor } from '@/db/executor';
import type {
  CostCreateInput,
  CostListParams,
  CostUpdateInput,
  InvoiceCreateInput,
  InvoiceListParams,
  PaymentCreateInput,
} from '@rona/types/finance';

import { PAYMENT_TERMS_DUE_DAYS } from '@rona/config/sales';

@Injectable()
export class FinanceRepository extends TenantScopedRepository {

  async createInvoiceFromOrder(
    data: InvoiceCreateInput,
    order: typeof salesOrders.$inferSelect,
    orderLines: (typeof salesOrderLines.$inferSelect)[],
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;

    const issueDate = data.issueDate ?? new Date();
    const dueDate =
      data.dueDate ??
      ((data.paymentTerms ?? order.paymentTerms)
        ? addTermDays(
            issueDate,
            data.paymentTerms ?? order.paymentTerms ?? 'NET_30',
          )
        : addDays(issueDate, 30));

    const subtotal = orderLines.reduce(
      (sum, line) => sum + Number(line.lineNet),
      0,
    );
    const discountTotal = orderLines.reduce((sum, line) => {
      const gross = Number(line.quantity) * Number(line.unitPrice);
      return sum + (gross - Number(line.lineNet));
    }, 0);
    const vatTotal = orderLines.reduce(
      (sum, line) => sum + Number(line.lineVat),
      0,
    );
    const total = orderLines.reduce(
      (sum, line) => sum + Number(line.lineTotal),
      0,
    );

    const [invoice] = await executor
      .insert(invoices)
      .values({
        organizationId: this.organizationId,
        invoiceNumber: await this.nextInvoiceNumber(executor),
        companyId: this.organizationId,
        customerId: order.customerId,
        issueDate,
        dueDate,
        subtotal: subtotal.toFixed(2),
        discountTotal: discountTotal.toFixed(2),
        vatTotal: vatTotal.toFixed(2),
        total: total.toFixed(2),
        paymentTerms: data.paymentTerms ?? order.paymentTerms,
        status: 'DRAFT',
        notes: data.notes ?? null,
      })
      .returning();

    for (const line of orderLines) {
      await executor.insert(invoiceLines).values({
        organizationId: this.organizationId,
        invoiceId: invoice.id,
        salesOrderLineId: line.id,
        description: line.itemId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountPercent: line.discountPercent,
        vatPercent: line.vatPercent,
        lineNet: line.lineNet,
        lineVat: line.lineVat,
        lineTotal: line.lineTotal,
      });
    }

    return invoice;
  }

  async findInvoice(id: string) {
    const [row] = await db
      .select({
        invoice: invoices,
        customerName: customers.name,
        customerVatNumber: customers.vatNumber,
      })
      .from(invoices)
      .leftJoin(
        customers,
        and(
          eq(customers.id, invoices.customerId),
          eq(customers.organizationId, invoices.organizationId),
        ),
      )
      .where(this.tenantScope(invoices, eq(invoices.id, id)))
      .limit(1);

    if (!row) return null;

    const [lines, paidTotal] = await Promise.all([
      this.findInvoiceLines(id),
      this.invoicePaidTotal(id),
    ]);

    const total = Number(row.invoice.total);
    const paid = paidTotal;
    return {
      ...row.invoice,
      customerName: row.customerName,
      customerVatNumber: row.customerVatNumber,
      paidTotal: paid.toFixed(2),
      remainingBalance: Math.max(total - paid, 0).toFixed(2),
      lines,
    };
  }

  async findInvoiceForUpdate(id: string, tx: Executor) {
    const [row] = await tx
      .select()
      .from(invoices)
      .where(this.tenantScope(invoices, eq(invoices.id, id)))
      .limit(1)
      .for('update');

    if (!row) return null;

    const paid = await tx
      .select({
        paid: sql<string>`coalesce(sum(${paymentAllocations.amount}), 0)`,
      })
      .from(paymentAllocations)
      .where(
        this.tenantScope(
          paymentAllocations,
          eq(paymentAllocations.invoiceId, id),
        ),
      );

    const total = Number(row.total);
    const paidTotal = Number(paid[0]?.paid ?? 0);
    return {
      ...row,
      paidTotal: paidTotal.toFixed(2),
      remainingBalance: Math.max(total - paidTotal, 0).toFixed(2),
    };
  }

  async findInvoiceLines(invoiceId: string) {
    return db
      .select()
      .from(invoiceLines)
      .where(
        this.tenantScope(invoiceLines, eq(invoiceLines.invoiceId, invoiceId)),
      );
  }

  async listInvoices(params: InvoiceListParams) {
    const conditions: SQL[] = [];

    if (params.status) {
      conditions.push(eq(invoices.status, params.status));
    }
    if (params.customerId) {
      conditions.push(eq(invoices.customerId, params.customerId));
    }
    if (params.searchQuery) {
      conditions.push(
        sql`${invoices.invoiceNumber} ilike ${`%${params.searchQuery}%`}`,
      );
    }

    const where = this.tenantScope(invoices, ...conditions);
    const offset = (params.page - 1) * params.limit;

    const rows = await db
      .select({
        invoice: invoices,
        customerName: customers.name,
      })
      .from(invoices)
      .leftJoin(
        customers,
        and(
          eq(customers.id, invoices.customerId),
          eq(customers.organizationId, invoices.organizationId),
        ),
      )
      .where(where)
      .orderBy(desc(invoices.issueDate))
      .limit(params.limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(invoices)
      .where(where);

    const ids = rows.map((row) => row.invoice.id);
    const paidTotals = ids.length
      ? await db
          .select({
            invoiceId: paymentAllocations.invoiceId,
            paid: sql<string>`coalesce(sum(${paymentAllocations.amount}), 0)`,
          })
          .from(paymentAllocations)
          .where(
            this.tenantScope(
              paymentAllocations,
              sql`${paymentAllocations.invoiceId} in ${ids}`,
            ),
          )
          .groupBy(paymentAllocations.invoiceId)
      : [];

    const paidByInvoice = new Map(
      paidTotals.map((row) => [row.invoiceId, Number(row.paid)]),
    );

    return {
      rows: rows.map((row) => {
        const totalValue = Number(row.invoice.total);
        const paid = paidByInvoice.get(row.invoice.id) ?? 0;
        return {
          ...row.invoice,
          customerName: row.customerName,
          paidTotal: paid.toFixed(2),
          remainingBalance: Math.max(totalValue - paid, 0).toFixed(2),
        };
      }),
      total: Number(total),
    };
  }

  async invoicePaidTotal(invoiceId: string): Promise<number> {
    const [row] = await db
      .select({
        paid: sql<string>`coalesce(sum(${paymentAllocations.amount}), 0)`,
      })
      .from(paymentAllocations)
      .where(
        this.tenantScope(
          paymentAllocations,
          eq(paymentAllocations.invoiceId, invoiceId),
        ),
      );
    return Number(row?.paid ?? 0);
  }

  async updateInvoiceStatus(
    id: string,
    status: 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'VOID',
    extra?: Partial<typeof invoices.$inferInsert>,
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .update(invoices)
      .set({ status, ...extra })
      .where(this.tenantScope(invoices, eq(invoices.id, id)))
      .returning();

    return row;
  }

  async transitionInvoiceStatus(
    id: string,
    expectedStatus: 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'VOID',
    status: 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'VOID',
    extra?: Partial<typeof invoices.$inferInsert>,
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .update(invoices)
      .set({ status, ...extra })
      .where(
        this.tenantScope(
          invoices,
          eq(invoices.id, id),
          eq(invoices.status, expectedStatus),
        ),
      )
      .returning();

    return row;
  }

  private async nextInvoiceNumber(executor: Executor): Promise<string> {
    await executor
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.id, this.organizationId))
      .for('update');

    const [row] = await executor
      .select({ total: sql<number>`count(*)` })
      .from(invoices)
      .where(eq(invoices.organizationId, this.organizationId));
    const year = new Date().getFullYear();
    return `INV-${year}-${String(Number(row?.total ?? 0) + 1).padStart(4, '0')}`;
  }

  async createPayment(data: PaymentCreateInput, tx?: Executor) {
    const executor = tx ?? pooledDb;
    const amount = data.allocations.reduce(
      (sum, allocation) => sum + Number(allocation.amount),
      0,
    );

    const [payment] = await executor
      .insert(payments)
      .values({
        organizationId: this.organizationId,
        invoiceId: data.allocations[0].invoiceId,
        method: data.method,
        amount: amount.toFixed(2),
        reference: data.reference,
        date: data.paidAt ?? new Date(),
        notes: data.notes ?? null,
      })
      .returning();

    return payment;
  }

  async createAllocation(
    data: { paymentId: string; invoiceId: string; amount: string },
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [allocation] = await executor
      .insert(paymentAllocations)
      .values({ ...data, organizationId: this.organizationId })
      .returning();

    return allocation;
  }

  async listPayments(invoiceId: string) {
    return db
      .select()
      .from(payments)
      .where(this.tenantScope(payments, eq(payments.invoiceId, invoiceId)));
  }

  async listAllPayments(params: { page: number; limit: number }) {
    const where = this.tenantScope(payments);
    const offset = (params.page - 1) * params.limit;

    const rows = await db
      .select()
      .from(payments)
      .where(where)
      .orderBy(desc(payments.date))
      .limit(params.limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(payments)
      .where(where);

    return { rows, total: Number(total) };
  }

  async createCost(data: CostCreateInput, tx?: Executor) {
    const executor = tx ?? pooledDb;
    const [cost] = await executor
      .insert(costs)
      .values({
        organizationId: this.organizationId,
        costCenterId: data.costCenterId ?? null,
        category: data.type,
        amount: data.amount,
        date: data.costDate,
        description: data.description,
      })
      .returning();

    return cost;
  }

  async findCost(id: string) {
    const [row] = await db
      .select({
        cost: costs,
        costCenterName: costCenters.name,
        costCenterCode: costCenters.code,
      })
      .from(costs)
      .leftJoin(
        costCenters,
        and(
          eq(costCenters.id, costs.costCenterId),
          eq(costCenters.organizationId, costs.organizationId),
        ),
      )
      .where(this.tenantScope(costs, eq(costs.id, id)))
      .limit(1);

    if (!row) return null;
    return {
      ...row.cost,
      type: row.cost.category,
      costCenterName: row.costCenterName,
      costCenterCode: row.costCenterCode,
      costDate: row.cost.date,
    };
  }

  async listCosts(params: CostListParams) {
    const conditions: SQL[] = [];

    if (params.type) {
      conditions.push(eq(costs.category, params.type));
    }
    if (params.costCenterId) {
      conditions.push(eq(costs.costCenterId, params.costCenterId));
    }
    if (params.searchQuery) {
      conditions.push(
        sql`${costs.description} ilike ${`%${params.searchQuery}%`}`,
      );
    }

    const where = this.tenantScope(costs, ...conditions);
    const offset = (params.page - 1) * params.limit;

    const rows = await db
      .select({
        cost: costs,
        costCenterName: costCenters.name,
        costCenterCode: costCenters.code,
      })
      .from(costs)
      .leftJoin(
        costCenters,
        and(
          eq(costCenters.id, costs.costCenterId),
          eq(costCenters.organizationId, costs.organizationId),
        ),
      )
      .where(where)
      .orderBy(desc(costs.date))
      .limit(params.limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(costs)
      .where(where);

    return {
      rows: rows.map((row) => ({
        ...row.cost,
        type: row.cost.category,
        costCenterName: row.costCenterName,
        costCenterCode: row.costCenterCode,
        costDate: row.cost.date,
      })),
      total: Number(total),
    };
  }

  async updateCost(id: string, data: CostUpdateInput) {
    const [row] = await pooledDb
      .update(costs)
      .set({
        ...(data.type !== undefined ? { category: data.type } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.amount !== undefined ? { amount: data.amount } : {}),
        ...(data.costDate !== undefined ? { date: data.costDate } : {}),
        ...(data.costCenterId !== undefined
          ? { costCenterId: data.costCenterId ?? null }
          : {}),
      })
      .where(this.tenantScope(costs, eq(costs.id, id)))
      .returning();

    return row;
  }

  async createCostCenter(data: {
    code: string;
    name: string;
    description?: string | null;
    isActive?: boolean;
  }) {
    const [center] = await pooledDb
      .insert(costCenters)
      .values({ ...data, organizationId: this.organizationId })
      .returning();

    return center;
  }
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

function addTermDays(
  date: Date,
  terms: keyof typeof PAYMENT_TERMS_DUE_DAYS,
): Date {
  const days = PAYMENT_TERMS_DUE_DAYS[terms];
  if (days == null) {
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return end;
  }
  return addDays(date, days);
}
