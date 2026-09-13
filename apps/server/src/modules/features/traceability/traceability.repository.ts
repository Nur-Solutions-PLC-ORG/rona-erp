import { asc, desc, eq, inArray } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db } from '@/db';
import { batchLots, items } from '@/db/schemas/inventory/master-data';
import { inspections } from '@/db/schemas/quality/inspections';
import { releaseDecisions } from '@/db/schemas/quality/reviews';
import {
  materialConsumptions,
  productionBatches,
  productionOrders,
  productionOutputs,
} from '@/db/schemas/manufacturing/production';
import { TenantScopedRepository } from '@/modules/tenancy/tenant-scoped.repository';

@Injectable()
export class TraceabilityRepository extends TenantScopedRepository {
  async findLotWithItem(lotId: string) {
    const [row] = await db
      .select({
        id: batchLots.id,
        organizationId: batchLots.organizationId,
        lotNumber: batchLots.lotNumber,
        itemId: batchLots.itemId,
        itemCode: items.code,
        itemName: items.name,
        qualityStatus: batchLots.qualityStatus,
        expiryDate: batchLots.expiryDate,
        supplier: batchLots.supplier,
        receiptDate: batchLots.receiptDate,
        manufactureDate: batchLots.manufactureDate,
        createdAt: batchLots.createdAt,
        updatedAt: batchLots.updatedAt,
      })
      .from(batchLots)
      .innerJoin(items, eq(items.id, batchLots.itemId))
      .where(this.tenantScope(batchLots, eq(batchLots.id, lotId)))
      .limit(1);
    return row;
  }

  async findLotInspections(lotId: string) {
    return db
      .select({
        id: inspections.id,
        inspectionNumber: inspections.inspectionNumber,
        type: inspections.type,
        status: inspections.status,
        completedAt: inspections.completedAt,
        reviewedAt: inspections.reviewedAt,
      })
      .from(inspections)
      .where(this.tenantScope(inspections, eq(inspections.lotId, lotId)))
      .orderBy(desc(inspections.createdAt));
  }

  async findLotReleaseDecisions(lotId: string) {
    return db
      .select({
        id: releaseDecisions.id,
        inspectionId: releaseDecisions.inspectionId,
        decision: releaseDecisions.decision,
        decidedBy: releaseDecisions.decidedBy,
        notes: releaseDecisions.notes,
        createdAt: releaseDecisions.createdAt,
      })
      .from(releaseDecisions)
      .where(
        this.tenantScope(releaseDecisions, eq(releaseDecisions.lotId, lotId)),
      )
      .orderBy(desc(releaseDecisions.createdAt));
  }

  async findConsumingBatches(lotId: string) {
    return db
      .select({
        productionBatchId: materialConsumptions.productionBatchId,
        batchNumber: productionBatches.batchNumber,
        productionOrderId: productionOrders.id,
        orderNumber: productionOrders.orderNumber,
        consumedQuantity: materialConsumptions.quantity,
        consumedAt: materialConsumptions.consumedAt,
      })
      .from(materialConsumptions)
      .innerJoin(
        productionBatches,
        eq(productionBatches.id, materialConsumptions.productionBatchId),
      )
      .innerJoin(
        productionOrders,
        eq(productionOrders.id, productionBatches.productionOrderId),
      )
      .where(
        this.tenantScope(
          materialConsumptions,
          eq(materialConsumptions.lotId, lotId),
        ),
      )
      .orderBy(desc(materialConsumptions.consumedAt));
  }

  async findBatchOutputs(productionBatchIds: string[]) {
    if (productionBatchIds.length === 0) return [];
    return db
      .select({
        productionBatchId: productionOutputs.productionBatchId,
        lotId: productionOutputs.lotId,
        lotNumber: batchLots.lotNumber,
        itemId: productionOutputs.itemId,
        itemCode: items.code,
        itemName: items.name,
        quantity: productionOutputs.quantity,
        qualityStatus: batchLots.qualityStatus,
        outputAt: productionOutputs.createdAt,
      })
      .from(productionOutputs)
      .innerJoin(batchLots, eq(batchLots.id, productionOutputs.lotId))
      .innerJoin(items, eq(items.id, productionOutputs.itemId))
      .where(
        this.tenantScope(
          productionOutputs,
          inArray(productionOutputs.productionBatchId, productionBatchIds),
        ),
      )
      .orderBy(asc(productionOutputs.createdAt));
  }

  async findProducingBatch(lotId: string) {
    const [row] = await db
      .select({
        productionBatchId: productionOutputs.productionBatchId,
        batchNumber: productionBatches.batchNumber,
        productionOrderId: productionOrders.id,
        orderNumber: productionOrders.orderNumber,
        outputQuantity: productionOutputs.quantity,
        completedAt: productionBatches.completedAt,
      })
      .from(productionOutputs)
      .innerJoin(
        productionBatches,
        eq(productionBatches.id, productionOutputs.productionBatchId),
      )
      .innerJoin(
        productionOrders,
        eq(productionOrders.id, productionBatches.productionOrderId),
      )
      .where(
        this.tenantScope(productionOutputs, eq(productionOutputs.lotId, lotId)),
      )
      .orderBy(desc(productionOutputs.createdAt))
      .limit(1);
    return row;
  }

  async findBatchMaterials(productionBatchId: string) {
    return db
      .select({
        lotId: materialConsumptions.lotId,
        lotNumber: batchLots.lotNumber,
        itemId: materialConsumptions.itemId,
        itemCode: items.code,
        itemName: items.name,
        quantity: materialConsumptions.quantity,
        isScrap: materialConsumptions.isScrap,
        consumedAt: materialConsumptions.consumedAt,
      })
      .from(materialConsumptions)
      .innerJoin(batchLots, eq(batchLots.id, materialConsumptions.lotId))
      .innerJoin(items, eq(items.id, materialConsumptions.itemId))
      .where(
        this.tenantScope(
          materialConsumptions,
          eq(materialConsumptions.productionBatchId, productionBatchId),
        ),
      )
      .orderBy(asc(materialConsumptions.consumedAt));
  }
}
