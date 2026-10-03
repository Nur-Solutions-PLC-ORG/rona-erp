import { Injectable } from '@nestjs/common';
import { pooledDb } from '@/db';
import type { Executor } from '@/db/executor';
import { inventoryReservations } from '@/db/schemas/inventory/ledger';
import { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import type {
  LotAllocation,
  PaginatedResult,
  ReservationCreateSchema,
  ReservationListParams,
  ReservationListSearchParamsSchema,
} from '@rona/types/inventory';
import {
  INVENTORY_DEFAULT_PAGE,
  INVENTORY_DEFAULT_PAGE_SIZE,
} from '@rona/config/inventory';
import {
  InsufficientStockException,
  ReservationNotActiveException,
  ReservationNotFoundException,
} from './inventory.exception';
import { AllocationService } from './allocation.service';
import { ReservationsRepository } from './reservations.repository';
import { StockLedgerService } from './stock-ledger.service';
import { StockRepository } from './stock.repository';

export type ReservationRow = typeof inventoryReservations.$inferSelect;
export interface ReservationResult {
  reservation: ReservationRow;
  allocations: LotAllocation[];
}

@Injectable()
export class ReservationsService {
  constructor(
    private readonly reservationsRepository: ReservationsRepository,
    private readonly allocationService: AllocationService,
    private readonly stockLedger: StockLedgerService,
    private readonly stockRepository: StockRepository,
    private readonly auditService: AuditService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async createReservation(
    input: ReservationCreateSchema,
    tx?: Executor,
  ): Promise<ReservationResult> {
    if (tx) return this.createReservationInTx(input, tx);
    return pooledDb.transaction((newTx) =>
      this.createReservationInTx(input, newTx),
    );
  }

  private async createReservationInTx(
    input: ReservationCreateSchema,
    tx: Executor,
  ): Promise<ReservationResult> {
    await this.stockLedger.loadItemForUpdate(input.itemId, tx);
    await this.stockLedger.loadActiveWarehouse(input.warehouseId);

    const strategy = input.strategy ?? 'FIFO';
    const allocations = await this.allocationService.allocateFromWarehouse(
      input.itemId,
      input.warehouseId,
      input.quantity,
      strategy,
      tx,
    );

    const locked = await this.stockRepository.lockBalancesForReservation(
      allocations,
      input.itemId,
      tx,
    );

    for (const allocation of allocations) {
      const lockedRow = locked.find(
        (row) =>
          row.lotId === allocation.lotId &&
          row.locationId === allocation.locationId,
      );
      if (!lockedRow) {
        throw new ReservationNotFoundException();
      }
      const onHand = Number(lockedRow.quantity);
      const reserved = Number(lockedRow.reservedQuantity);
      const available = onHand - reserved;
      if (available < Number(allocation.quantity)) {
        throw new InsufficientStockException(
          available.toFixed(4),
          allocation.quantity,
        );
      }
    }

    const reservation = await this.reservationsRepository.create(
      {
        itemId: input.itemId,
        warehouseId: input.warehouseId,
        quantity: input.quantity,
        allocatedLots: allocations,
        reference: input.reference ?? null,
        notes: input.notes ?? null,
      },
      tx,
    );

    for (const allocation of allocations) {
      await this.stockRepository.adjustReserved(
        allocation.lotId,
        allocation.locationId,
        allocation.quantity,
        tx,
      );
    }

    await this.auditService.record(
      {
        organizationId: this.tenantContext.organizationId,
        action: 'inventory.reservation.create',
        entityType: 'reservation',
        entityId: reservation.id,
        after: {
          itemId: input.itemId,
          warehouseId: input.warehouseId,
          quantity: input.quantity,
          allocations: allocations.length,
        },
      },
      tx,
    );

    return { reservation, allocations };
  }

  async consumeReservationFromLot(
    reservationId: string,
    lotId: string,
    locationId: string,
    quantity: string,
    tx: Executor,
  ): Promise<string> {
    const reservation = await this.reservationsRepository.findByIdForUpdate(
      reservationId,
      tx,
    );
    if (!reservation) throw new ReservationNotFoundException();
    if (reservation.status !== 'ACTIVE') return '0';

    const allocation = (reservation.allocatedLots ?? []).find(
      (a) => a.lotId === lotId && a.locationId === locationId,
    );
    if (!allocation) return '0';

    const take = Math.min(Number(quantity), Number(allocation.quantity));
    if (take <= 0) return '0';

    await this.stockRepository.adjustReserved(
      lotId,
      locationId,
      `-${take.toFixed(4)}`,
      tx,
    );

    const updatedLots = (reservation.allocatedLots ?? []).map((a) =>
      a.lotId === lotId && a.locationId === locationId
        ? { ...a, quantity: (Number(a.quantity) - take).toFixed(4) }
        : a,
    );
    const remaining =
      Math.round((Number(reservation.quantity) - take) * 1e4) / 1e4;

    await this.reservationsRepository.update(
      reservationId,
      {
        quantity: remaining.toFixed(4),
        allocatedLots: updatedLots,
        ...(remaining <= 0 ? { status: 'CONSUMED' as const } : {}),
      },
      tx,
    );

    return take.toFixed(4);
  }

  async releaseReservation(reservationId: string, tx?: Executor) {
    if (tx) return this.releaseReservationInTx(reservationId, tx);
    return pooledDb.transaction((newTx) =>
      this.releaseReservationInTx(reservationId, newTx),
    );
  }

  private async releaseReservationInTx(reservationId: string, tx: Executor) {
    const reservation = await this.reservationsRepository.findByIdForUpdate(
      reservationId,
      tx,
    );
    if (!reservation) throw new ReservationNotFoundException();
    if (reservation.status !== 'ACTIVE') {
      throw new ReservationNotActiveException();
    }

    const released = await this.reservationsRepository.update(
      reservationId,
      { status: 'RELEASED' },
      tx,
    );

    for (const allocation of reservation.allocatedLots ?? []) {
      await this.stockRepository.adjustReserved(
        allocation.lotId,
        allocation.locationId,
        `-${allocation.quantity}`,
        tx,
      );
    }

    await this.auditService.record(
      {
        organizationId: this.tenantContext.organizationId,
        action: 'inventory.reservation.release',
        entityType: 'reservation',
        entityId: reservationId,
        before: { status: reservation.status },
        after: { status: 'RELEASED' },
      },
      tx,
    );

    return released;
  }

  async consumeReservation(reservationId: string) {
    return pooledDb.transaction(async (tx) => {
      const reservation = await this.reservationsRepository.findByIdForUpdate(
        reservationId,
        tx,
      );
      if (!reservation) throw new ReservationNotFoundException();
      if (reservation.status !== 'ACTIVE') {
        throw new ReservationNotActiveException();
      }

      for (const allocation of reservation.allocatedLots ?? []) {
        await this.stockRepository.adjustReserved(
          allocation.lotId,
          allocation.locationId,
          `-${allocation.quantity}`,
          tx,
        );
      }

      const movements = await this.stockLedger.consumeAllocations(
        {
          type: 'ISSUE',
          itemId: reservation.itemId,
          reference: reservation.reference,
          notes: `Consumed reservation ${reservationId}`,
        },
        reservation.allocatedLots ?? [],
        tx,
      );

      const consumed = await this.reservationsRepository.update(
        reservationId,
        { status: 'CONSUMED' },
        tx,
      );

      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'inventory.reservation.consume',
          entityType: 'reservation',
          entityId: reservationId,
          before: { status: reservation.status },
          after: { status: 'CONSUMED' },
        },
        tx,
      );

      return { reservation: consumed, movements };
    });
  }

  async listReservations(
    params: ReservationListSearchParamsSchema,
  ): Promise<PaginatedResult<unknown>> {
    const resolved: ReservationListParams = {
      ...params,
      page: params.page ?? INVENTORY_DEFAULT_PAGE,
      limit: params.limit ?? INVENTORY_DEFAULT_PAGE_SIZE,
    };
    const { rows, total } = await this.reservationsRepository.list(resolved);
    return {
      data: rows,
      pagination: {
        page: resolved.page,
        limit: resolved.limit,
        totalItems: total,
        totalPages: Math.ceil(total / resolved.limit),
      },
    };
  }

  async getReservation(reservationId: string) {
    const reservation =
      await this.reservationsRepository.findById(reservationId);
    if (!reservation) throw new ReservationNotFoundException();
    return reservation;
  }
}
