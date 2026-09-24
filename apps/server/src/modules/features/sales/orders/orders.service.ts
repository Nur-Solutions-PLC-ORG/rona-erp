import { Injectable } from '@nestjs/common';
import { pooledDb } from '@/db';
import type { Executor } from '@/db/executor';
import { SalesOrderRepository } from './orders.repository';
import {
  SalesOrderNotFoundException,
  SalesOrderStateException,
} from './orders.exception';
import { AuditService } from '@/modules/audit/audit.service';
import { ReservationsService } from '@/modules/features/inventory/reservations.service';
import { ReservationsRepository } from '@/modules/features/inventory/reservations.repository';
import { StockRepository } from '@/modules/features/inventory/stock.repository';
import { StockLedgerService } from '@/modules/features/inventory/stock-ledger.service';
import { DEFAULT_VAT_PERCENT } from '@rona/config/sales';
import type {
  SalesOrderCreateInput,
  SalesOrderListParams,
  StockAvailabilityParams,
} from '@rona/types/sales';

@Injectable()
export class SalesOrderService {
  constructor(
    private readonly repo: SalesOrderRepository,
    private readonly audit: AuditService,
    private readonly reservationsService: ReservationsService,
    private readonly reservationsRepository: ReservationsRepository,
    private readonly stockRepo: StockRepository,
    private readonly stockLedger: StockLedgerService,
  ) {}
  async create(data: SalesOrderCreateInput) {
    const order = await pooledDb.transaction(async (tx) => {
      const created = await this.repo.create(data, tx);

      let subtotal = 0;
      let discountTotal = 0;
      let vatTotal = 0;

      for (const line of data.lines) {
        const quantity = Number(line.quantity);
        const unitPrice = Number(line.unitPrice);
        const discountPercent = Number(line.discountPercent ?? 0);
        const vatPercent = line.vatPercent ?? DEFAULT_VAT_PERCENT;

        const gross = quantity * unitPrice;
        const discount = (gross * discountPercent) / 100;
        const net = gross - discount;
        const vat = (net * Number(vatPercent)) / 100;

        subtotal += gross;
        discountTotal += discount;
        vatTotal += vat;

        await this.repo.addLine(
          {
            orderId: created.id,
            itemId: line.itemId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            discountPercent: line.discountPercent ?? '0',
            vatPercent,
            lineNet: net.toFixed(2),
            lineVat: vat.toFixed(2),
            lineTotal: (net + vat).toFixed(2),
          },
          tx,
        );
      }

      const total = subtotal - discountTotal + vatTotal;
      return this.repo.updateTotals(
        created.id,
        {
          subtotal: subtotal.toFixed(2),
          discountTotal: discountTotal.toFixed(2),
          vatTotal: vatTotal.toFixed(2),
          total: total.toFixed(2),
        },
        tx,
      );
    });

    await this.audit.record({
      organizationId: order.organizationId,
      action: 'SALES_ORDER_CREATE',
      entityType: 'SalesOrder',
      entityId: order.id,
      after: order,
    });
    return order;
  }
  async findById(id: string) {
    const order = await this.repo.findById(id);
    if (!order) return null;
    const lines = await this.repo.findLines(id);
    return { ...order, lines };
  }
  async list(params: SalesOrderListParams) {
    return this.repo.list(params);
  }
  async confirm(id: string) {
    return pooledDb.transaction(async (tx) => {
      const order = await this.repo.findByIdForUpdate(id, tx);
      if (!order) throw new SalesOrderNotFoundException();
      if (order.status !== 'DRAFT') {
        throw new SalesOrderStateException(
          `Only DRAFT orders can be confirmed (current: ${order.status})`,
        );
      }

      const lines = await this.repo.findLines(id);
      for (const line of lines) {
        await this.reservationsService.createReservation(
          {
            itemId: line.itemId,
            warehouseId: order.warehouseId,
            quantity: line.quantity,
            reference: order.orderNumber,
            notes: `Reserved for order ${order.orderNumber}`,
          },
          tx,
        );
        await this.audit.record(
          {
            organizationId: order.organizationId,
            action: 'SALES_ORDER_FIFO_ALLOCATE',
            entityType: 'SalesOrderLine',
            entityId: line.id,
            after: {
              lotAllocated: line.lotId ?? 'FIFO',
              quantity: line.quantity,
            },
          },
          tx,
        );
      }

      const updated = await this.repo.transitionStatus(
        id,
        'DRAFT',
        'CONFIRMED',
        { confirmedAt: new Date() },
        tx,
      );
      if (!updated) {
        throw new SalesOrderStateException(
          'Order status changed during confirmation',
        );
      }
      await this.audit.record(
        {
          organizationId: updated.organizationId,
          action: 'SALES_ORDER_CONFIRM',
          entityType: 'SalesOrder',
          entityId: id,
          after: updated,
        },
        tx,
      );
      return updated;
    });
  }
  async cancel(id: string) {
    return pooledDb.transaction(async (tx) => {
      const order = await this.repo.findByIdForUpdate(id, tx);
      if (!order) throw new SalesOrderNotFoundException();
      if (order.status === 'FULFILLED' || order.status === 'CANCELLED') {
        throw new SalesOrderStateException(
          `Cannot cancel an order in status ${order.status}`,
        );
      }

      const orderReservations = await this.findActiveReservationsForOrder(
        order,
        tx,
      );
      for (const reservation of orderReservations) {
        await this.reservationsRepository.update(
          reservation.id,
          { status: 'RELEASED' },
          tx,
        );
        for (const allocation of reservation.allocatedLots ?? []) {
          await this.stockRepo.adjustReserved(
            allocation.lotId,
            allocation.locationId,
            `-${allocation.quantity}`,
            tx,
          );
        }
        await this.audit.record(
          {
            organizationId: order.organizationId,
            action: 'inventory.reservation.release',
            entityType: 'reservation',
            entityId: reservation.id,
            before: { status: reservation.status },
            after: { status: 'RELEASED' },
          },
          tx,
        );
      }

      const updated = await this.repo.updateStatus(
        id,
        'CANCELLED',
        { cancelledAt: new Date() },
        tx,
      );
      await this.audit.record(
        {
          organizationId: updated.organizationId,
          action: 'SALES_ORDER_CANCEL',
          entityType: 'SalesOrder',
          entityId: id,
          after: updated,
        },
        tx,
      );
      return updated;
    });
  }
  async fulfill(id: string) {
    return pooledDb.transaction(async (tx) => {
      const order = await this.repo.findByIdForUpdate(id, tx);
      if (!order) throw new SalesOrderNotFoundException();
      if (order.status !== 'CONFIRMED') {
        throw new SalesOrderStateException(
          `Only CONFIRMED orders can be fulfilled (current: ${order.status})`,
        );
      }

      const orderReservations = await this.findActiveReservationsForOrder(
        order,
        tx,
      );
      for (const reservation of orderReservations) {
        for (const allocation of reservation.allocatedLots ?? []) {
          await this.stockRepo.adjustReserved(
            allocation.lotId,
            allocation.locationId,
            `-${allocation.quantity}`,
            tx,
          );
        }
        await this.stockLedger.consumeAllocations(
          {
            type: 'ISSUE',
            itemId: reservation.itemId,
            reference: reservation.reference,
            notes: `Fulfilled order ${id}`,
          },
          reservation.allocatedLots ?? [],
          tx,
        );
        await this.reservationsRepository.update(
          reservation.id,
          { status: 'CONSUMED' },
          tx,
        );
        await this.audit.record(
          {
            organizationId: order.organizationId,
            action: 'inventory.reservation.consume',
            entityType: 'reservation',
            entityId: reservation.id,
            before: { status: reservation.status },
            after: { status: 'CONSUMED' },
          },
          tx,
        );
      }

      const updated = await this.repo.transitionStatus(
        id,
        'CONFIRMED',
        'FULFILLED',
        { fulfilledAt: new Date() },
        tx,
      );
      if (!updated) {
        throw new SalesOrderStateException(
          'Order status changed during fulfillment',
        );
      }
      await this.audit.record(
        {
          organizationId: updated.organizationId,
          action: 'SALES_ORDER_FULFILL',
          entityType: 'SalesOrder',
          entityId: id,
          after: updated,
        },
        tx,
      );
      return updated;
    });
  }
  async getAvailability(params: StockAvailabilityParams) {
    const lots = await this.stockRepo.listSellableLots(
      params.itemId,
      params.warehouseId,
    );
    const totalAvailable = lots.reduce(
      (sum, lot) => sum + Number(lot.available),
      0,
    );
    return {
      itemId: params.itemId,
      warehouseId: params.warehouseId,
      lots,
      totalAvailable: totalAvailable.toFixed(4),
    };
  }

  private async findActiveReservationsForOrder(
    order: { id: string; orderNumber: string },
    tx: Executor,
  ) {
    const byOrderNumber =
      await this.reservationsRepository.findActiveByReference(
        order.orderNumber,
        tx,
      );
    if (byOrderNumber.length > 0) return byOrderNumber;
    // Reservations created before the orderNumber reference convention
    // carried the raw order id instead.
    return this.reservationsRepository.findActiveByReference(
      `SO-${order.id}`,
      tx,
    );
  }
}
