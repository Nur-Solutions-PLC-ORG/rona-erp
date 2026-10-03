import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db } from '@/db';
import type { Executor } from '@/db/executor';
import {
  batchLots,
  items,
  warehouseLocations,
  warehouses,
} from '@/db/schemas/inventory/master-data';
import { alias } from 'drizzle-orm/pg-core';
import {
  inventoryMovements,
  stockBalances,
} from '@/db/schemas/inventory/ledger';
import { TenantScopedRepository } from '@/modules/tenancy/tenant-scoped.repository';
import type {
  MovementListSearchParams,
  StockQueryParams,
} from '@rona/types/inventory';

export interface LockedStockRow {
  itemId: string;
  lotId: string;
  locationId: string;
  quantity: string;
  reservedQuantity: string;
}

export interface LotStockRow {
  lotId: string;
  locationId: string;
  quantity: string;
  expiryDate: Date | null;
  qualityStatus: string;
  receiptDate: Date | null;
}

@Injectable()
export class StockRepository extends TenantScopedRepository {
  async findLockedBalance(
    itemId: string,
    lotId: string,
    locationId: string,
    tx: Executor,
  ): Promise<LockedStockRow | undefined> {
    const [row] = await tx
      .select({
        itemId: stockBalances.itemId,
        lotId: stockBalances.lotId,
        locationId: stockBalances.locationId,
        quantity: stockBalances.quantity,
        reservedQuantity: stockBalances.reservedQuantity,
      })
      .from(stockBalances)
      .where(
        this.tenantScope(
          stockBalances,
          eq(stockBalances.itemId, itemId),
          eq(stockBalances.lotId, lotId),
          eq(stockBalances.locationId, locationId),
        ),
      )
      .limit(1)
      .for('update');
    return row;
  }

  async upsertBalance(
    data: {
      itemId: string;
      lotId: string;
      locationId: string;
      quantity: string;
    },
    tx: Executor,
  ) {
    const [row] = await tx
      .insert(stockBalances)
      .values({
        organizationId: this.organizationId,
        ...data,
      })
      .onConflictDoUpdate({
        target: [
          stockBalances.itemId,
          stockBalances.lotId,
          stockBalances.locationId,
        ],
        set: { quantity: data.quantity },
      })
      .returning();
    return row;
  }

  async adjustBalance(
    itemId: string,
    lotId: string,
    locationId: string,
    delta: string,
    tx: Executor,
  ) {
    const [row] = await tx
      .update(stockBalances)
      .set({
        quantity: sql`${stockBalances.quantity} + ${delta}`,
      })
      .where(
        this.tenantScope(
          stockBalances,
          eq(stockBalances.itemId, itemId),
          eq(stockBalances.lotId, lotId),
          eq(stockBalances.locationId, locationId),
        ),
      )
      .returning();
    return row;
  }

  async insertMovement(
    data: {
      type: 'RECEIPT' | 'ISSUE' | 'TRANSFER' | 'RETURN' | 'ADJUSTMENT';
      itemId: string;
      lotId?: string | null;
      fromLocationId?: string | null;
      toLocationId?: string | null;
      quantity: string;
      unitCost?: string | null;
      reference?: string | null;
      notes?: string | null;
    },
    tx: Executor,
  ) {
    const [row] = await tx
      .insert(inventoryMovements)
      .values({
        organizationId: this.organizationId,
        performedBy: this.tenantContext.userId,
        ...data,
      })
      .returning();
    return row;
  }

  async listAllocatableLotStock(
    itemId: string,
    warehouseId: string,
    strategy: 'FIFO' | 'FEFO',
    tx?: Executor,
  ): Promise<LotStockRow[]> {
    const executor = tx ?? db;
    const orderByDate =
      strategy === 'FEFO'
        ? asc(batchLots.expiryDate)
        : asc(batchLots.receiptDate);

    const rows = await executor
      .select({
        lotId: stockBalances.lotId,
        locationId: stockBalances.locationId,
        quantity: sql<string>`${stockBalances.quantity} - ${stockBalances.reservedQuantity}`,
        expiryDate: batchLots.expiryDate,
        qualityStatus: batchLots.qualityStatus,
        receiptDate: batchLots.receiptDate,
      })
      .from(stockBalances)
      .innerJoin(batchLots, eq(batchLots.id, stockBalances.lotId))
      .innerJoin(
        warehouseLocations,
        eq(warehouseLocations.id, stockBalances.locationId),
      )
      .where(
        this.tenantScope(
          stockBalances,
          eq(stockBalances.itemId, itemId),
          eq(warehouseLocations.warehouseId, warehouseId),
          sql`${stockBalances.quantity} - coalesce(${stockBalances.reservedQuantity}, 0) > 0`,
          sql`${batchLots.expiryDate} is null or ${batchLots.expiryDate} > now()`,
          sql`${batchLots.qualityStatus} = 'APPROVED' or ${batchLots.qualityStatus} = 'RELEASED'`,
        ),
      )
      .orderBy(orderByDate, asc(stockBalances.lotId))
      .limit(1000);
    return rows;
  }

  async listSellableLots(itemId: string, warehouseId: string) {
    const rows = await db
      .select({
        lotId: stockBalances.lotId,
        lotNumber: batchLots.lotNumber,
        expiryDate: batchLots.expiryDate,
        receiptDate: batchLots.receiptDate,
        onHand: sql<string>`sum(${stockBalances.quantity})`,
        reserved: sql<string>`sum(${stockBalances.reservedQuantity})`,
      })
      .from(stockBalances)
      .innerJoin(batchLots, eq(batchLots.id, stockBalances.lotId))
      .innerJoin(
        warehouseLocations,
        eq(warehouseLocations.id, stockBalances.locationId),
      )
      .where(
        this.tenantScope(
          stockBalances,
          eq(stockBalances.itemId, itemId),
          eq(warehouseLocations.warehouseId, warehouseId),
          sql`${stockBalances.quantity} > 0`,
          sql`${batchLots.expiryDate} is null or ${batchLots.expiryDate} > now()`,
          sql`${batchLots.qualityStatus} = 'APPROVED' or ${batchLots.qualityStatus} = 'RELEASED'`,
        ),
      )
      .groupBy(
        stockBalances.lotId,
        batchLots.lotNumber,
        batchLots.expiryDate,
        batchLots.receiptDate,
      )
      .orderBy(asc(batchLots.receiptDate));

    return rows.map((row) => ({
      lotId: row.lotId,
      lotNumber: row.lotNumber,
      expiryDate: row.expiryDate,
      onHand: row.onHand ?? '0',
      reserved: row.reserved ?? '0',
      available: (Number(row.onHand ?? 0) - Number(row.reserved ?? 0)).toFixed(
        4,
      ),
    }));
  }

  async listBalances(params: StockQueryParams) {
    const conditions: SQL[] = [];
    if (params.itemId) {
      conditions.push(eq(stockBalances.itemId, params.itemId));
    }
    if (params.warehouseId) {
      conditions.push(eq(warehouseLocations.warehouseId, params.warehouseId));
    }
    if (params.searchQuery) {
      const pattern = `%${params.searchQuery}%`;
      const searchCondition = or(
        ilike(batchLots.lotNumber, pattern),
        inArray(
          stockBalances.itemId,
          db
            .select({ id: items.id })
            .from(items)
            .where(
              and(
                eq(items.organizationId, this.organizationId),
                or(ilike(items.code, pattern), ilike(items.name, pattern)),
              ),
            ),
        ),
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    const where = this.tenantScope(stockBalances, ...conditions);
    const offset = (params.page - 1) * params.limit;

    const rows = await db
      .select({
        id: stockBalances.id,
        organizationId: stockBalances.organizationId,
        itemId: stockBalances.itemId,
        lotId: stockBalances.lotId,
        locationId: stockBalances.locationId,
        quantity: stockBalances.quantity,
        reservedQuantity: stockBalances.reservedQuantity,
        updatedAt: stockBalances.updatedAt,
        warehouseId: warehouseLocations.warehouseId,
        itemName: items.name,
        lotNumber: batchLots.lotNumber,
        locationName: warehouseLocations.name,
        warehouseName: warehouses.name,
        lotQualityStatus: batchLots.qualityStatus,
        lotExpiryDate: batchLots.expiryDate,
      })
      .from(stockBalances)
      .innerJoin(
        warehouseLocations,
        eq(warehouseLocations.id, stockBalances.locationId),
      )
      .innerJoin(batchLots, eq(batchLots.id, stockBalances.lotId))
      .innerJoin(warehouses, eq(warehouses.id, warehouseLocations.warehouseId))
      .innerJoin(items, eq(items.id, stockBalances.itemId))
      .where(where)
      .orderBy(asc(stockBalances.itemId))
      .limit(params.limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(stockBalances)
      .innerJoin(
        warehouseLocations,
        eq(warehouseLocations.id, stockBalances.locationId),
      )
      .where(where);

    return { rows, total: Number(total) };
  }

  async listMovements(params: MovementListSearchParams) {
    const conditions: SQL[] = [];
    if (params.itemId) {
      conditions.push(eq(inventoryMovements.itemId, params.itemId));
    }
    if (params.type) {
      conditions.push(eq(inventoryMovements.type, params.type));
    }
    if (params.lotId) {
      conditions.push(eq(inventoryMovements.lotId, params.lotId));
    }
    if (params.warehouseId) {
      conditions.push(
        sql`(${inventoryMovements.fromLocationId} in (
              select id from warehouse_locations where warehouse_id = ${params.warehouseId}
            )) or (${inventoryMovements.toLocationId} in (
              select id from warehouse_locations where warehouse_id = ${params.warehouseId}
            ))`,
      );
    }
    if (params.searchQuery) {
      const pattern = `%${params.searchQuery}%`;
      const searchCondition = or(
        ilike(inventoryMovements.reference, pattern),
        inArray(
          inventoryMovements.itemId,
          db
            .select({ id: items.id })
            .from(items)
            .where(
              and(
                eq(items.organizationId, this.organizationId),
                or(ilike(items.code, pattern), ilike(items.name, pattern)),
              ),
            ),
        ),
        inArray(
          inventoryMovements.lotId,
          db
            .select({ id: batchLots.id })
            .from(batchLots)
            .where(
              and(
                eq(batchLots.organizationId, this.organizationId),
                ilike(batchLots.lotNumber, pattern),
              ),
            ),
        ),
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    const where = this.tenantScope(inventoryMovements, ...conditions);
    const offset = (params.page - 1) * params.limit;

    const locationsFrom = alias(warehouseLocations, 'from_location');
    const locationsTo = alias(warehouseLocations, 'to_location');

    const rows = await db
      .select({
        id: inventoryMovements.id,
        organizationId: inventoryMovements.organizationId,
        type: inventoryMovements.type,
        itemId: inventoryMovements.itemId,
        lotId: inventoryMovements.lotId,
        fromLocationId: inventoryMovements.fromLocationId,
        toLocationId: inventoryMovements.toLocationId,
        quantity: inventoryMovements.quantity,
        unitCost: inventoryMovements.unitCost,
        reference: inventoryMovements.reference,
        notes: inventoryMovements.notes,
        performedBy: inventoryMovements.performedBy,
        createdAt: inventoryMovements.createdAt,
        itemName: items.name,
        lotNumber: batchLots.lotNumber,
        fromLocationName: locationsFrom.name,
        toLocationName: locationsTo.name,
      })
      .from(inventoryMovements)
      .innerJoin(items, eq(items.id, inventoryMovements.itemId))
      .leftJoin(batchLots, eq(batchLots.id, inventoryMovements.lotId))
      .leftJoin(
        locationsFrom,
        eq(locationsFrom.id, inventoryMovements.fromLocationId),
      )
      .leftJoin(
        locationsTo,
        eq(locationsTo.id, inventoryMovements.toLocationId),
      )
      .where(where)
      .orderBy(desc(inventoryMovements.createdAt))
      .limit(params.limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(inventoryMovements)
      .where(where);

    return { rows, total: Number(total) };
  }

  async sumOnHandByItem(itemId: string, warehouseId?: string) {
    const conditions: SQL[] = [eq(stockBalances.itemId, itemId)];
    if (warehouseId) {
      conditions.push(eq(warehouseLocations.warehouseId, warehouseId));
    }
    const [row] = await db
      .select({
        total: sql<string>`coalesce(sum(${stockBalances.quantity}), 0)`,
      })
      .from(stockBalances)
      .innerJoin(
        warehouseLocations,
        eq(warehouseLocations.id, stockBalances.locationId),
      )
      .where(this.tenantScope(stockBalances, ...conditions));
    return row?.total ?? '0';
  }

  async lockBalancesForReservation(
    allocations: Array<{ lotId: string; locationId: string }>,
    itemId: string,
    tx: Executor,
  ): Promise<LockedStockRow[]> {
    if (allocations.length === 0) return [];
    const rows = await tx
      .select({
        itemId: stockBalances.itemId,
        lotId: stockBalances.lotId,
        locationId: stockBalances.locationId,
        quantity: stockBalances.quantity,
        reservedQuantity: stockBalances.reservedQuantity,
      })
      .from(stockBalances)
      .where(
        this.tenantScope(
          stockBalances,
          eq(stockBalances.itemId, itemId),
          inArray(
            sql`(${stockBalances.lotId}, ${stockBalances.locationId})`,
            allocations.map((a) => sql`(${a.lotId}, ${a.locationId})`),
          ),
        ),
      )
      .for('update');
    return rows;
  }

  async adjustReserved(
    lotId: string,
    locationId: string,
    delta: string,
    tx: Executor,
  ) {
    const [row] = await tx
      .update(stockBalances)
      .set({
        reservedQuantity: sql`${stockBalances.reservedQuantity} + ${delta}`,
      })
      .where(
        this.tenantScope(
          stockBalances,
          eq(stockBalances.lotId, lotId),
          eq(stockBalances.locationId, locationId),
        ),
      )
      .returning();
    return row;
  }
}
