import { and, eq, gte, inArray, lte, or, sql } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db } from '@/db';
import {
  boms,
  productionBatches,
  productionOrders,
} from '@/db/schemas/manufacturing';
import { items } from '@/db/schemas/inventory';
import { TenantScopedRepository } from '@/modules/tenancy/tenant-scoped.repository';
import type {
  PeriodSpec,
  ProductionContext,
  ShiftName,
  TrendComparison,
} from '../types/ai-contexts.types.js';

@Injectable()
export class AiProductionRepository extends TenantScopedRepository {
  async fetchProduction(period: PeriodSpec): Promise<ProductionContext> {
    const start = new Date(`${period.start}T00:00:00.000Z`);
    const end = new Date(`${period.end}T23:59:59.999Z`);

    const [orders, batches] = await Promise.all([
      this.loadOrders(start, end),
      this.loadBatches(start, end),
    ]);

    const outputByOrder = new Map<string, { output: number; scrap: number }>();
    for (const batch of batches) {
      const agg = outputByOrder.get(batch.orderId) ?? { output: 0, scrap: 0 };
      agg.output += Number(batch.outputQuantity);
      agg.scrap += Number(batch.scrapQuantity);
      outputByOrder.set(batch.orderId, agg);
    }

    const lines = orders.map((order) => {
      const agg = outputByOrder.get(order.id) ?? { output: 0, scrap: 0 };
      const target = Number(order.plannedQuantity);
      const produced = agg.output || Number(order.actualQuantity ?? 0);
      return this.buildLineRecord(order, target, produced, agg.scrap);
    });

    const totalTarget = sum(lines, (l) => l.targetUnits);
    const totalProduced = sum(lines, (l) => l.producedUnits);
    const totalRejected = sum(lines, (l) => l.rejectedUnits);
    const overallEfficiency =
      totalTarget > 0 ? (totalProduced / totalTarget) * 100 : 0;
    const rejectRate =
      totalProduced > 0 ? (totalRejected / totalProduced) * 100 : 0;

    const trends: TrendComparison[] = [];
    if (period.previousStart && period.previousEnd) {
      const previous = await this.efficiencyFor(
        period.previousStart,
        period.previousEnd,
      );
      if (previous != null) {
        const current = round1(overallEfficiency);
        trends.push(
          buildTrend(
            'Overall Efficiency',
            current,
            previous,
            period.previousLabel,
          ),
        );
      }
    }

    return {
      tenantId: this.organizationId,
      domain: 'production',
      periodLabel: period.label,
      periodStart: period.start,
      periodEnd: period.end,
      generatedAt: new Date(),
      sourceSystem: 'rona-erp',
      recordCountTruncated: false,
      totalTargetUnits: totalTarget,
      totalProducedUnits: totalProduced,
      totalRejectedUnits: totalRejected,
      overallEfficiencyPct: round1(overallEfficiency),
      targetAchievementPct: round1(overallEfficiency),
      rejectRatePct: round1(rejectRate),
      totalDowntimeMinutes: 0,
      overallStatus: statusFor(overallEfficiency, false),
      lines,
      byShift: this.rollupByShift(lines),
      underperformingLineIds: lines
        .filter((l) => l.status === 'below_target' || l.status === 'halted')
        .map((l) => l.lineId)
        .sort(),
      trends,
    };
  }

  private loadOrders(start: Date, end: Date) {
    return db
      .select({
        id: productionOrders.id,
        orderNumber: productionOrders.orderNumber,
        status: productionOrders.status,
        plannedQuantity: productionOrders.plannedQuantity,
        actualQuantity: productionOrders.actualQuantity,
        startedAt: productionOrders.startedAt,
        bomName: boms.name,
        bomCode: boms.code,
        itemName: items.name,
      })
      .from(productionOrders)
      .leftJoin(
        boms,
        and(
          eq(boms.id, productionOrders.bomId),
          eq(boms.organizationId, productionOrders.organizationId),
        ),
      )
      .leftJoin(
        items,
        and(
          eq(items.id, productionOrders.itemId),
          eq(items.organizationId, productionOrders.organizationId),
        ),
      )
      .where(
        and(
          eq(productionOrders.organizationId, this.organizationId),
          inArray(productionOrders.status, [
            'APPROVED',
            'IN_PROGRESS',
            'COMPLETED',
          ]),
          or(
            gte(productionOrders.createdAt, start),
            gte(productionOrders.startedAt, start),
          ),
          lte(productionOrders.createdAt, end),
        ),
      );
  }

  private loadBatches(start: Date, end: Date) {
    return db
      .select({
        orderId: productionBatches.productionOrderId,
        outputQuantity: productionBatches.outputQuantity,
        scrapQuantity: productionBatches.scrapQuantity,
      })
      .from(productionBatches)
      .where(
        and(
          eq(productionBatches.organizationId, this.organizationId),
          gte(productionBatches.startedAt, start),
          lte(productionBatches.startedAt, end),
        ),
      );
  }

  private buildLineRecord(
    order: {
      id: string;
      orderNumber: string;
      status: string;
      startedAt: Date | null;
      bomName: string | null;
      bomCode: string | null;
      itemName: string | null;
    },
    target: number,
    produced: number,
    scrap: number,
  ): ProductionContext['lines'][number] {
    const efficiency = target > 0 ? (produced / target) * 100 : 0;
    return {
      lineId: order.id,
      lineName: order.orderNumber,
      product:
        order.itemName ??
        (order.bomName
          ? `${order.bomCode ?? ''} ${order.bomName}`.trim()
          : order.orderNumber),
      shift: shiftFor(order.startedAt),
      targetUnits: target,
      producedUnits: produced,
      rejectedUnits: scrap,
      efficiencyPct: round1(efficiency),
      downtimeMinutes: 0,
      operatorsAssigned: 0,
      status: statusFor(
        efficiency,
        order.status === 'IN_PROGRESS' && produced === 0,
      ),
      blockingMachineId: null,
    };
  }

  private rollupByShift(lines: ProductionContext['lines']) {
    const map = new Map<ShiftName, { target: number; produced: number }>();
    for (const line of lines) {
      const agg = map.get(line.shift) ?? { target: 0, produced: 0 };
      agg.target += line.targetUnits;
      agg.produced += line.producedUnits;
      map.set(line.shift, agg);
    }
    return (['morning', 'afternoon', 'night'] as ShiftName[])
      .filter((shift) => map.has(shift))
      .map((shift) => {
        const agg = map.get(shift)!;
        return {
          shift,
          targetUnits: agg.target,
          producedUnits: agg.produced,
          efficiencyPct:
            agg.target > 0 ? round1((agg.produced / agg.target) * 100) : 0,
        };
      });
  }

  private async efficiencyFor(
    startIso: string,
    endIso: string,
  ): Promise<number | null> {
    const start = new Date(`${startIso}T00:00:00.000Z`);
    const end = new Date(`${endIso}T23:59:59.999Z`);

    const [row] = await db
      .select({
        planned: sql<number>`coalesce(sum(${productionOrders.plannedQuantity}), 0)`,
        actual: sql<number>`coalesce(sum(${productionOrders.actualQuantity}), 0)`,
      })
      .from(productionOrders)
      .where(
        and(
          eq(productionOrders.organizationId, this.organizationId),
          eq(productionOrders.status, 'COMPLETED'),
          gte(productionOrders.completedAt, start),
          lte(productionOrders.completedAt, end),
        ),
      );

    const planned = Number(row?.planned ?? 0);
    const actual = Number(row?.actual ?? 0);
    if (!planned) return null;
    return round1((actual / planned) * 100);
  }
}

export function productionStatusFor(
  efficiencyPct: number,
): ProductionContext['overallStatus'] {
  return statusFor(efficiencyPct, false);
}

function statusFor(
  efficiencyPct: number,
  halted: boolean,
): ProductionContext['overallStatus'] {
  if (halted) return 'halted';
  if (efficiencyPct >= 100) return 'ahead';
  if (efficiencyPct >= 95) return 'on_target';
  if (efficiencyPct >= 70) return 'below_target';
  return 'halted';
}

function shiftFor(startedAt: Date | null | undefined): ShiftName {
  if (!startedAt) return 'morning';
  const hour = startedAt.getUTCHours();
  if (hour < 14) return 'morning';
  if (hour < 22) return 'afternoon';
  return 'night';
}

function buildTrend(
  metricLabel: string,
  current: number,
  previous: number,
  label: string | null,
): TrendComparison {
  return {
    metricLabel,
    currentValue: current,
    previousValue: previous,
    changePct: round1(current - previous),
    direction: current > previous ? 'up' : current < previous ? 'down' : 'flat',
    previousPeriodLabel: label ?? 'previous period',
  };
}

function sum<T>(rows: T[], pick: (row: T) => number): number {
  return rows.reduce((total, row) => total + pick(row), 0);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
