import { and, eq, inArray, lte, sql } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db } from '@/db';
import {
  batchLots,
  inventoryMovements,
  inventoryReservations,
  items,
  stockBalances,
  unitsOfMeasure,
  warehouses,
} from '@/db/schemas/inventory';
import { TenantScopedRepository } from '@/modules/tenancy/tenant-scoped.repository';
import type {
  InventoryContext,
  PeriodSpec,
  StockReservationRecord,
  TrendComparison,
} from '../types/ai-contexts.types.js';
import { AiTenantRepository } from './ai-tenant.repository.js';

const SLOW_MOVING_DAYS = 90;

@Injectable()
export class AiInventoryRepository extends TenantScopedRepository {
  constructor(private readonly tenantRepo: AiTenantRepository) {
    super();
  }

  async fetchInventory(period: PeriodSpec): Promise<InventoryContext> {
    const currency = await this.tenantRepo.fetchCurrency();

    const [balances, receipts, openReservations, lastMovements, rows, uoms] =
      await Promise.all([
        this.loadBalances(),
        this.loadReceiptCosts(),
        this.loadOpenReservations(),
        this.loadLastMovements(),
        this.loadItems(),
        this.loadUoms(),
      ]);

    const [quarantinedCount, reservationRows] = await Promise.all([
      this.countQuarantinedLots(),
      this.loadReservationDetails(),
    ]);

    const onHand = new Map(balances.map((b) => [b.itemId, Number(b.quantity)]));
    const unitCosts = new Map(
      receipts
        .filter((r) => r.unitCost != null)
        .map((r) => [r.itemId, Number(r.unitCost)]),
    );
    const onOrder = new Map<string, number>();
    for (const row of openReservations) {
      onOrder.set(
        row.itemId,
        (onOrder.get(row.itemId) ?? 0) + Number(row.quantity),
      );
    }
    const uomCodes = new Map(uoms.map((u) => [u.id, u.code]));
    const lastMovementDates = new Map(
      lastMovements
        .filter((m) => m.lastMovement != null)
        .map((m) => [
          m.itemId,
          new Date(m.lastMovement!).toISOString().slice(0, 10),
        ]),
    );

    const now = Date.now();
    const itemRecords = rows.map((row) => {
      const quantityOnHand = onHand.get(row.id) ?? 0;
      const reorderLevel = Number(row.reorderPoint ?? 0);
      const unitCost = unitCosts.get(row.id) ?? 0;
      const lastMovement = lastMovementDates.get(row.id) ?? null;
      const daysSinceMovement = lastMovement
        ? Math.floor((now - new Date(lastMovement).getTime()) / 86_400_000)
        : null;

      const stockStatus: InventoryContext['items'][number]['stockStatus'] =
        quantityOnHand <= 0
          ? 'out_of_stock'
          : quantityOnHand <= reorderLevel
            ? 'low'
            : daysSinceMovement != null && daysSinceMovement > SLOW_MOVING_DAYS
              ? 'slow_moving'
              : 'healthy';

      return {
        itemId: row.id,
        sku: row.code,
        name: row.name,
        category: row.type,
        unitOfMeasure: uomCodes.get(row.uomId) ?? 'pcs',
        quantityOnHand: round3(quantityOnHand),
        reorderLevel,
        quantityOnOrder: onOrder.get(row.id) ?? 0,
        unitCost: round2(unitCost),
        totalValue: round2(quantityOnHand * unitCost),
        monthlyConsumption: 0,
        daysOfCover: null,
        lastMovementDate: lastMovement,
        warehouseLocation: null,
        stockStatus,
        needsReorder: stockStatus === 'low' || stockStatus === 'out_of_stock',
      };
    });

    const totalValue = round2(sum(itemRecords, (i) => i.totalValue));

    const trends: TrendComparison[] = [];
    if (period.previousEnd) {
      const previous = await this.ledgerValueFor(period.previousEnd);
      if (previous != null && previous > 0) {
        const changePct = round1(((totalValue - previous) / previous) * 100);
        trends.push({
          metricLabel: 'Inventory Value',
          currentValue: totalValue,
          previousValue: previous,
          changePct,
          direction: changePct > 0 ? 'up' : changePct < 0 ? 'down' : 'flat',
          previousPeriodLabel: period.previousLabel ?? 'previous period',
        });
      }
    }

    const byStatus = (status: string) =>
      itemRecords.filter((i) => i.stockStatus === status);

    const slowMoving = byStatus('slow_moving');

    const reservations: StockReservationRecord[] = reservationRows.map((r) => ({
      reservationId: r.id,
      itemSku: r.itemCode ?? r.itemId,
      itemName: r.itemName ?? 'Unknown item',
      warehouse: r.warehouseName ?? 'Unknown warehouse',
      quantity: round3(Number(r.quantity)),
      status: r.status,
      reference: r.reference,
      createdAt: r.createdAt
        ? new Date(r.createdAt).toISOString().slice(0, 10)
        : '',
    }));

    return {
      tenantId: this.organizationId,
      domain: 'inventory',
      periodLabel: period.label,
      periodStart: period.start,
      periodEnd: period.end,
      generatedAt: new Date(),
      sourceSystem: 'rona-erp',
      recordCountTruncated: false,
      currency,
      totalSkuCount: itemRecords.length,
      totalInventoryValue: totalValue,
      lowStockCount: byStatus('low').length,
      outOfStockCount: byStatus('out_of_stock').length,
      overstockedCount: 0,
      slowMovingCount: slowMoving.length,
      slowMovingValue: round2(sum(slowMoving, (i) => i.totalValue)),
      quarantinedLotCount: quarantinedCount,
      items: itemRecords,
      reservations,
      reorderRecommendations: itemRecords
        .filter((i) => i.needsReorder)
        .map((i) => i.itemId),
      trends,
    };
  }

  private loadBalances() {
    return db
      .select({
        itemId: stockBalances.itemId,
        quantity: sql<number>`coalesce(sum(${stockBalances.quantity}), 0)`,
      })
      .from(stockBalances)
      .where(eq(stockBalances.organizationId, this.organizationId))
      .groupBy(stockBalances.itemId);
  }

  private loadReceiptCosts() {
    return db
      .select({
        itemId: inventoryMovements.itemId,
        unitCost: sql<number>`max(${inventoryMovements.unitCost})`,
      })
      .from(inventoryMovements)
      .where(
        and(
          eq(inventoryMovements.organizationId, this.organizationId),
          eq(inventoryMovements.type, 'RECEIPT'),
        ),
      )
      .groupBy(inventoryMovements.itemId);
  }

  private loadOpenReservations() {
    return db
      .select({
        itemId: inventoryReservations.itemId,
        quantity: inventoryReservations.quantity,
      })
      .from(inventoryReservations)
      .where(
        and(
          eq(inventoryReservations.organizationId, this.organizationId),
          eq(inventoryReservations.status, 'ACTIVE'),
        ),
      );
  }

  private loadLastMovements() {
    return db
      .select({
        itemId: inventoryMovements.itemId,
        lastMovement: sql<Date | null>`max(${inventoryMovements.createdAt})`,
      })
      .from(inventoryMovements)
      .where(eq(inventoryMovements.organizationId, this.organizationId))
      .groupBy(inventoryMovements.itemId);
  }

  private async countQuarantinedLots(): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`coalesce(count(*), 0)::int` })
      .from(batchLots)
      .where(
        and(
          eq(batchLots.organizationId, this.organizationId),
          eq(batchLots.qualityStatus, 'QUARANTINED'),
        ),
      );
    return Number(row?.count ?? 0);
  }

  private loadReservationDetails() {
    return db
      .select({
        id: inventoryReservations.id,
        itemId: inventoryReservations.itemId,
        itemCode: items.code,
        itemName: items.name,
        warehouseName: warehouses.name,
        status: inventoryReservations.status,
        quantity: inventoryReservations.quantity,
        reference: inventoryReservations.reference,
        createdAt: inventoryReservations.createdAt,
      })
      .from(inventoryReservations)
      .leftJoin(
        items,
        and(
          eq(items.id, inventoryReservations.itemId),
          eq(items.organizationId, this.organizationId),
        ),
      )
      .leftJoin(
        warehouses,
        and(
          eq(warehouses.id, inventoryReservations.warehouseId),
          eq(warehouses.organizationId, this.organizationId),
        ),
      )
      .where(
        and(
          eq(inventoryReservations.organizationId, this.organizationId),
          eq(inventoryReservations.status, 'ACTIVE'),
        ),
      )
      .orderBy(sql`${inventoryReservations.createdAt} desc`);
  }

  private loadItems() {
    return db
      .select({
        id: items.id,
        code: items.code,
        name: items.name,
        type: items.type,
        uomId: items.unitOfMeasureId,
        reorderPoint: items.reorderPoint,
      })
      .from(items)
      .where(
        and(
          eq(items.organizationId, this.organizationId),
          eq(items.isArchived, false),
        ),
      );
  }

  private loadUoms() {
    return db
      .select({ id: unitsOfMeasure.id, code: unitsOfMeasure.code })
      .from(unitsOfMeasure)
      .where(eq(unitsOfMeasure.organizationId, this.organizationId));
  }

  private async ledgerValueFor(asOfIso: string): Promise<number | null> {
    const asOf = new Date(`${asOfIso}T23:59:59.999Z`);

    const [inbound, outbound, costs] = await Promise.all([
      this.movementSums(['RECEIPT', 'RETURN'], asOf),
      this.movementSums(['ISSUE', 'ADJUSTMENT'], asOf),
      this.loadReceiptCosts(),
    ]);

    const net = new Map<string, number>();
    for (const row of inbound) net.set(row.itemId, Number(row.quantity));
    for (const row of outbound) {
      net.set(row.itemId, (net.get(row.itemId) ?? 0) - Number(row.quantity));
    }
    const costMap = new Map(
      costs.map((c) => [c.itemId, Number(c.unitCost ?? 0)]),
    );

    let total = 0;
    for (const [itemId, quantity] of net) {
      if (quantity > 0) total += quantity * (costMap.get(itemId) ?? 0);
    }
    return round2(total);
  }

  private movementSums(
    types: Array<(typeof inventoryMovements.type.enumValues)[number]>,
    asOf: Date,
  ) {
    return db
      .select({
        itemId: inventoryMovements.itemId,
        quantity: sql<number>`coalesce(sum(${inventoryMovements.quantity}), 0)`,
      })
      .from(inventoryMovements)
      .where(
        and(
          eq(inventoryMovements.organizationId, this.organizationId),
          lte(inventoryMovements.createdAt, asOf),
          inArray(inventoryMovements.type, types),
        ),
      )
      .groupBy(inventoryMovements.itemId);
  }
}

function sum<T>(rows: T[], pick: (row: T) => number): number {
  return rows.reduce((total, row) => total + pick(row), 0);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}
