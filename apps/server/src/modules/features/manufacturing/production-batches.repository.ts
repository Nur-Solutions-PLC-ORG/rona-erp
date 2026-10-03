import {
  and,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sum,
  type SQL,
} from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db, pooledDb } from '@/db';
import type { Executor } from '@/db/executor';
import {
  materialConsumptions,
  materialReturns,
  productionBatches,
  productionOutputs,
  productionOrders,
} from '@/db/schemas/manufacturing/production';
import { TenantScopedRepository } from '@/modules/tenancy/tenant-scoped.repository';
import type { BatchListParams } from '@rona/types/manufacturing';

@Injectable()
export class ProductionBatchesRepository extends TenantScopedRepository {
  async create(
    data: {
      productionOrderId: string;
      batchNumber: string;
      notes?: string | null;
    },
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .insert(productionBatches)
      .values({
        organizationId: this.organizationId,
        productionOrderId: data.productionOrderId,
        batchNumber: data.batchNumber,
        notes: data.notes ?? null,
      })
      .returning();
    return row;
  }

  async findById(batchId: string) {
    const [row] = await db
      .select()
      .from(productionBatches)
      .where(
        this.tenantScope(productionBatches, eq(productionBatches.id, batchId)),
      )
      .limit(1);
    return row;
  }

  async findByIdForUpdate(batchId: string, tx: Executor) {
    const [row] = await tx
      .select()
      .from(productionBatches)
      .where(
        this.tenantScope(productionBatches, eq(productionBatches.id, batchId)),
      )
      .limit(1)
      .for('update');
    return row;
  }

  async findByBatchNumber(batchNumber: string) {
    const [row] = await db
      .select()
      .from(productionBatches)
      .where(
        this.tenantScope(
          productionBatches,
          eq(productionBatches.batchNumber, batchNumber),
        ),
      )
      .limit(1);
    return row;
  }

  async update(
    batchId: string,
    data: Partial<typeof productionBatches.$inferInsert>,
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .update(productionBatches)
      .set(data)
      .where(
        this.tenantScope(productionBatches, eq(productionBatches.id, batchId)),
      )
      .returning();
    return row;
  }

  async list(params: BatchListParams) {
    const conditions: SQL[] = [];
    if (params.productionOrderId) {
      conditions.push(
        eq(productionBatches.productionOrderId, params.productionOrderId),
      );
    }
    if (params.status) {
      conditions.push(eq(productionBatches.status, params.status));
    }
    if (params.searchQuery) {
      const pattern = `%${params.searchQuery}%`;
      const searchCondition = or(
        ilike(productionBatches.batchNumber, pattern),
        inArray(
          productionBatches.productionOrderId,
          db
            .select({ id: productionOrders.id })
            .from(productionOrders)
            .where(
              and(
                eq(productionOrders.organizationId, this.organizationId),
                ilike(productionOrders.orderNumber, pattern),
              ),
            ),
        ),
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    const where = this.tenantScope(productionBatches, ...conditions);
    const offset = (params.page - 1) * params.limit;

    const rows = await db
      .select({
        id: productionBatches.id,
        organizationId: productionBatches.organizationId,
        productionOrderId: productionBatches.productionOrderId,
        orderNumber: productionOrders.orderNumber,
        batchNumber: productionBatches.batchNumber,
        status: productionBatches.status,
        scrapQuantity: productionBatches.scrapQuantity,
        outputQuantity: productionBatches.outputQuantity,
        notes: productionBatches.notes,
        startedAt: productionBatches.startedAt,
        completedAt: productionBatches.completedAt,
        createdAt: productionBatches.createdAt,
        updatedAt: productionBatches.updatedAt,
      })
      .from(productionBatches)
      .leftJoin(
        productionOrders,
        eq(productionOrders.id, productionBatches.productionOrderId),
      )
      .where(where)
      .orderBy(desc(productionBatches.createdAt))
      .limit(params.limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(productionBatches)
      .where(where);

    return { rows, total: Number(total) };
  }

  async findOpenByOrder(orderId: string, tx?: Executor) {
    const executor = tx ?? db;
    return executor
      .select()
      .from(productionBatches)
      .where(
        this.tenantScope(
          productionBatches,
          eq(productionBatches.productionOrderId, orderId),
          eq(productionBatches.status, 'IN_PROGRESS'),
        ),
      );
  }

  async nextBatchSequence(orderId: string, tx?: Executor) {
    const executor = tx ?? db;
    const [{ total }] = await executor
      .select({ total: count() })
      .from(productionBatches)
      .where(
        this.tenantScope(
          productionBatches,
          eq(productionBatches.productionOrderId, orderId),
        ),
      );
    return Number(total) + 1;
  }

  async sumOutputsByOrder(orderId: string, tx?: Executor) {
    const executor = tx ?? db;
    const [row] = await executor
      .select({ total: sum(productionBatches.outputQuantity) })
      .from(productionBatches)
      .where(
        this.tenantScope(
          productionBatches,
          eq(productionBatches.productionOrderId, orderId),
        ),
      );
    return row?.total ?? '0';
  }

  async createConsumption(
    data: {
      productionBatchId: string;
      orderMaterialId?: string | null;
      itemId: string;
      lotId: string;
      locationId: string;
      substitutedForItemId?: string | null;
      movementId?: string | null;
      quantity: string;
      isScrap?: boolean;
      notes?: string | null;
    },
    tx: Executor,
  ) {
    const [row] = await tx
      .insert(materialConsumptions)
      .values({
        organizationId: this.organizationId,
        ...data,
        orderMaterialId: data.orderMaterialId ?? null,
        substitutedForItemId: data.substitutedForItemId ?? null,
        movementId: data.movementId ?? null,
        isScrap: data.isScrap ?? false,
        notes: data.notes ?? null,
      })
      .returning();
    return row;
  }

  async findConsumptionsByBatch(batchId: string) {
    return db
      .select()
      .from(materialConsumptions)
      .where(
        this.tenantScope(
          materialConsumptions,
          eq(materialConsumptions.productionBatchId, batchId),
        ),
      )
      .orderBy(desc(materialConsumptions.consumedAt));
  }

  async sumConsumedByOrderItem(orderId: string, itemId: string) {
    const [row] = await db
      .select({ total: sum(materialConsumptions.quantity) })
      .from(materialConsumptions)
      .innerJoin(
        productionBatches,
        eq(productionBatches.id, materialConsumptions.productionBatchId),
      )
      .where(
        this.tenantScope(
          materialConsumptions,
          eq(productionBatches.productionOrderId, orderId),
          eq(materialConsumptions.itemId, itemId),
        ),
      );
    return row?.total ?? '0';
  }

  async createReturn(
    data: {
      productionBatchId: string;
      orderMaterialId?: string | null;
      itemId: string;
      lotId: string;
      locationId: string;
      movementId?: string | null;
      quantity: string;
      reason: string;
      notes?: string | null;
    },
    tx: Executor,
  ) {
    const [row] = await tx
      .insert(materialReturns)
      .values({
        organizationId: this.organizationId,
        ...data,
        orderMaterialId: data.orderMaterialId ?? null,
        movementId: data.movementId ?? null,
        notes: data.notes ?? null,
      })
      .returning();
    return row;
  }

  async findReturnsByBatch(batchId: string) {
    return db
      .select()
      .from(materialReturns)
      .where(
        this.tenantScope(
          materialReturns,
          eq(materialReturns.productionBatchId, batchId),
        ),
      )
      .orderBy(desc(materialReturns.createdAt));
  }

  async createOutput(
    data: {
      productionBatchId: string;
      itemId: string;
      lotId: string;
      locationId: string;
      movementId?: string | null;
      quantity: string;
      unitCost?: string | null;
      notes?: string | null;
    },
    tx: Executor,
  ) {
    const [row] = await tx
      .insert(productionOutputs)
      .values({
        organizationId: this.organizationId,
        ...data,
        movementId: data.movementId ?? null,
        unitCost: data.unitCost ?? null,
        notes: data.notes ?? null,
      })
      .returning();
    return row;
  }

  async findOutputsByBatch(batchId: string) {
    return db
      .select()
      .from(productionOutputs)
      .where(
        this.tenantScope(
          productionOutputs,
          eq(productionOutputs.productionBatchId, batchId),
        ),
      )
      .orderBy(desc(productionOutputs.createdAt));
  }

  async findConsumedLotsByOrder(orderId: string) {
    return db
      .select({
        lotId: materialConsumptions.lotId,
        itemId: materialConsumptions.itemId,
        batchId: materialConsumptions.productionBatchId,
        quantity: materialConsumptions.quantity,
        consumedAt: materialConsumptions.consumedAt,
      })
      .from(materialConsumptions)
      .innerJoin(
        productionBatches,
        eq(productionBatches.id, materialConsumptions.productionBatchId),
      )
      .where(
        this.tenantScope(
          materialConsumptions,
          eq(productionBatches.productionOrderId, orderId),
        ),
      )
      .orderBy(desc(materialConsumptions.consumedAt));
  }

  async findOutputLotsByOrder(orderId: string) {
    return db
      .select({
        lotId: productionOutputs.lotId,
        itemId: productionOutputs.itemId,
        batchId: productionOutputs.productionBatchId,
        quantity: productionOutputs.quantity,
        createdAt: productionOutputs.createdAt,
      })
      .from(productionOutputs)
      .innerJoin(
        productionBatches,
        eq(productionBatches.id, productionOutputs.productionBatchId),
      )
      .where(
        this.tenantScope(
          productionOutputs,
          eq(productionBatches.productionOrderId, orderId),
        ),
      )
      .orderBy(desc(productionOutputs.createdAt));
  }
}
