import {
  and,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
  type SQL,
} from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db, pooledDb } from '@/db';
import type { Executor } from '@/db/executor';
import { batchLots, items } from '@/db/schemas/inventory/master-data';
import {
  inspections,
  inspectionTests,
  testResults,
} from '@/db/schemas/quality/inspections';
import { TenantScopedRepository } from '@/modules/tenancy/tenant-scoped.repository';
import type { InspectionListParams } from '@rona/types/quality';

@Injectable()
export class InspectionsRepository extends TenantScopedRepository {

  async create(
    data: {
      inspectionNumber: string;
      type: 'INCOMING' | 'IN_PROCESS' | 'FINISHED_GOOD';
      lotId: string;
      itemId: string;
      performedBy?: string | null;
      notes?: string | null;
    },
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .insert(inspections)
      .values({ ...data, organizationId: this.organizationId })
      .returning();
    return row;
  }

  async findById(inspectionId: string) {
    const [row] = await db
      .select()
      .from(inspections)
      .where(this.tenantScope(inspections, eq(inspections.id, inspectionId)))
      .limit(1);
    return row;
  }

  async findByIdForUpdate(inspectionId: string, tx: Executor) {
    const [row] = await tx
      .select()
      .from(inspections)
      .where(this.tenantScope(inspections, eq(inspections.id, inspectionId)))
      .limit(1)
      .for('update');
    return row;
  }

  async findByInspectionNumber(inspectionNumber: string) {
    const [row] = await db
      .select()
      .from(inspections)
      .where(
        this.tenantScope(
          inspections,
          eq(inspections.inspectionNumber, inspectionNumber),
        ),
      )
      .limit(1);
    return row;
  }

  async update(
    inspectionId: string,
    data: Partial<typeof inspections.$inferInsert>,
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .update(inspections)
      .set(data)
      .where(this.tenantScope(inspections, eq(inspections.id, inspectionId)))
      .returning();
    return row;
  }

  async list(params: InspectionListParams) {
    const conditions: SQL[] = [];
    if (params.status) {
      conditions.push(eq(inspections.status, params.status));
    }
    if (params.type) {
      conditions.push(eq(inspections.type, params.type));
    }
    if (params.lotId) {
      conditions.push(eq(inspections.lotId, params.lotId));
    }
    if (params.itemId) {
      conditions.push(eq(inspections.itemId, params.itemId));
    }
    if (params.searchQuery) {
      const pattern = `%${params.searchQuery}%`;
      const searchCondition = or(
        ilike(inspections.inspectionNumber, pattern),
        inArray(
          inspections.lotId,
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
        inArray(
          inspections.itemId,
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

    const where = this.tenantScope(inspections, ...conditions);
    const offset = (params.page - 1) * params.limit;

    const rows = await db
      .select({
        id: inspections.id,
        organizationId: inspections.organizationId,
        inspectionNumber: inspections.inspectionNumber,
        type: inspections.type,
        lotId: inspections.lotId,
        lotNumber: batchLots.lotNumber,
        itemId: inspections.itemId,
        itemCode: items.code,
        itemName: items.name,
        status: inspections.status,
        performedBy: inspections.performedBy,
        notes: inspections.notes,
        createdAt: inspections.createdAt,
        updatedAt: inspections.updatedAt,
        completedAt: inspections.completedAt,
        reviewedAt: inspections.reviewedAt,
      })
      .from(inspections)
      .leftJoin(batchLots, eq(batchLots.id, inspections.lotId))
      .leftJoin(items, eq(items.id, inspections.itemId))
      .where(where)
      .orderBy(desc(inspections.createdAt))
      .limit(params.limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(inspections)
      .where(where);

    return { rows, total: Number(total) };
  }

  async addTest(
    inspectionId: string,
    data: {
      name: string;
      specification?: string | null;
      method?: string | null;
      notes?: string | null;
    },
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .insert(inspectionTests)
      .values({
        ...data,
        organizationId: this.organizationId,
        inspectionId,
      })
      .returning();
    return row;
  }

  async findTests(inspectionId: string) {
    return db
      .select()
      .from(inspectionTests)
      .where(
        this.tenantScope(
          inspectionTests,
          eq(inspectionTests.inspectionId, inspectionId),
        ),
      )
      .orderBy(inspectionTests.createdAt);
  }

  async findTestByInspectionAndId(inspectionId: string, testId: string) {
    const [row] = await db
      .select()
      .from(inspectionTests)
      .where(
        this.tenantScope(
          inspectionTests,
          eq(inspectionTests.inspectionId, inspectionId),
          eq(inspectionTests.id, testId),
        ),
      )
      .limit(1);
    return row;
  }

  async addResult(
    data: {
      testId: string;
      inspectionId: string;
      result: 'PASS' | 'FAIL';
      measuredValue?: string | null;
      notes?: string | null;
      performedBy?: string | null;
    },
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .insert(testResults)
      .values({ ...data, organizationId: this.organizationId })
      .returning();
    return row;
  }

  async findResultByTest(testId: string) {
    const [row] = await db
      .select()
      .from(testResults)
      .where(this.tenantScope(testResults, eq(testResults.testId, testId)))
      .limit(1);
    return row;
  }

  async findResultsByInspection(inspectionId: string) {
    return db
      .select()
      .from(testResults)
      .where(
        this.tenantScope(
          testResults,
          eq(testResults.inspectionId, inspectionId),
        ),
      );
  }
}
