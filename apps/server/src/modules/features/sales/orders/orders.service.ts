import { Injectable } from '@nestjs/common';
import { pooledDb } from '@/db';
import { SalesOrderRepository } from './orders.repository';
import {
  SalesOrderNotFoundException,
  SalesOrderStateException,
} from './orders.exception';
import { AuditService } from '@/modules/audit/audit.service';
import { ReservationsService } from '@/modules/features/inventory/reservations.service';
import { ReservationsRepository } from '@/modules/features/inventory/reservations.repository';
import { StockRepository } from '@/modules/features/inventory/stock.repository';
import type {
  SalesOrderCreateInput,
  SalesOrderListParams,
} from '@rona/types/sales';

@Injectable()
export class SalesOrderService {
  constructor(
    private readonly repo: SalesOrderRepository,
    private readonly audit: AuditService,
    private readonly reservationsService: ReservationsService,
    private readonly reservationsRepository: ReservationsRepository,
    private readonly stockRepo: StockRepository,
  ) {}
  async create(data: SalesOrderCreateInput) {
    const order = await this.repo.create(data);
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
            reference: `SO-${id}`,
            notes: `Reserved for order ${id}`,
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

      const orderReservations =
        await this.reservationsRepository.findActiveByReference(`SO-${id}`, tx);
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
}
