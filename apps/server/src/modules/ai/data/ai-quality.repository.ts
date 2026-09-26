import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db } from '@/db';
import { inspections, testResults } from '@/db/schemas/quality';
import { batchLots, items } from '@/db/schemas/inventory';
import { TenantScopedRepository } from '@/modules/tenancy/tenant-scoped.repository';
import type {
  InspectionRecord,
  InspectionOutcome,
  PeriodSpec,
  QualityContext,
} from '../types/ai-contexts.types.js';

@Injectable()
export class AiQualityRepository extends TenantScopedRepository {
  async fetchQuality(period: PeriodSpec): Promise<QualityContext> {
    const start = new Date(`${period.start}T00:00:00.000Z`);
    const end = new Date(`${period.end}T23:59:59.999Z`);

    const [inspectionRows, results] = await Promise.all([
      this.loadInspections(start, end),
      this.loadResults(start, end),
    ]);

    const resultsByInspection = new Map<
      string,
      { passed: number; failed: number }
    >();
    for (const result of results) {
      const agg = resultsByInspection.get(result.inspectionId) ?? {
        passed: 0,
        failed: 0,
      };
      if (result.result === 'PASS') agg.passed += Number(result.count);
      else if (result.result === 'FAIL') agg.failed += Number(result.count);
      resultsByInspection.set(result.inspectionId, agg);
    }

    const records: InspectionRecord[] = inspectionRows.map((row) => {
      const agg = resultsByInspection.get(row.inspectionId) ?? {
        passed: 0,
        failed: 0,
      };
      const testsTotal = agg.passed + agg.failed;
      const outcome: InspectionOutcome | null =
        row.reviewDecision === 'RELEASE'
          ? 'released'
          : row.reviewDecision === 'REJECT'
            ? 'rejected'
            : row.status === 'COMPLETED' || row.status === 'REVIEWED'
              ? agg.failed > 0
                ? 'failed'
                : agg.passed > 0
                  ? 'passed'
                  : null
              : null;

      return {
        inspectionId: row.inspectionNumber,
        itemType: row.itemName ?? row.itemCode ?? 'Item',
        lotNumber: row.lotNumber ?? null,
        status: this.mapStatus(row.status),
        testsTotal,
        testsPassed: agg.passed,
        testsFailed: agg.failed,
        outcome,
      };
    });

    const reviewed = records.filter((r) => r.status === 'reviewed');
    const decided = reviewed.filter(
      (r) => r.outcome === 'released' || r.outcome === 'passed',
    );
    const passRatePct = reviewed.length
      ? round1((decided.length / reviewed.length) * 100)
      : 0;

    return {
      tenantId: this.organizationId,
      domain: 'quality',
      periodLabel: period.label,
      periodStart: period.start,
      periodEnd: period.end,
      generatedAt: new Date(),
      sourceSystem: 'rona-erp',
      recordCountTruncated: false,
      totalInspectionCount: records.length,
      inProgressCount: records.filter((r) => r.status === 'in_progress').length,
      completedCount: records.filter((r) => r.status === 'completed').length,
      reviewedCount: reviewed.length,
      passRatePct,
      rejectedLotCount: records.filter((r) => r.outcome === 'rejected').length,
      inspections: records,
      trends: [],
    };
  }

  private mapStatus(status: string): InspectionRecord['status'] {
    switch (status) {
      case 'IN_PROGRESS':
        return 'in_progress';
      case 'COMPLETED':
        return 'completed';
      default:
        return 'reviewed';
    }
  }

  private loadInspections(start: Date, end: Date) {
    return db
      .select({
        inspectionId: inspections.id,
        inspectionNumber: inspections.inspectionNumber,
        status: inspections.status,
        reviewDecision: sql<
          'RELEASE' | 'REJECT' | null
        >`(select decision from qa_reviews where qa_reviews.inspection_id = ${inspections.id} limit 1)`,
        itemName: items.name,
        itemCode: items.code,
        lotNumber: batchLots.lotNumber,
      })
      .from(inspections)
      .leftJoin(
        items,
        and(
          eq(items.id, inspections.itemId),
          eq(items.organizationId, inspections.organizationId),
        ),
      )
      .leftJoin(
        batchLots,
        and(
          eq(batchLots.id, inspections.lotId),
          eq(batchLots.organizationId, inspections.organizationId),
        ),
      )
      .where(
        and(
          eq(inspections.organizationId, this.organizationId),
          gte(inspections.createdAt, start),
          lte(inspections.createdAt, end),
        ),
      );
  }

  private loadResults(start: Date, end: Date) {
    return db
      .select({
        inspectionId: testResults.inspectionId,
        result: testResults.result,
        count: sql<number>`count(*)`,
      })
      .from(testResults)
      .where(
        and(
          eq(testResults.organizationId, this.organizationId),
          gte(testResults.createdAt, start),
          lte(testResults.createdAt, end),
        ),
      )
      .groupBy(testResults.inspectionId, testResults.result);
  }
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
