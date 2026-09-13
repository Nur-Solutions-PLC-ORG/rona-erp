import { and, count, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db, pooledDb } from '@/db';
import type { Executor } from '@/db/executor';
import {
  productionOrderMaterials,
  productionOrders,
} from '@/db/schemas/manufacturing/production';
import { boms } from '@/db/schemas/manufacturing/bom';
import { items } from '@/db/schemas/inventory/master-data';
import { warehouses } from '@/db/schemas/inventory/master-data';
import { TenantScopedRepository } from '@/modules/tenancy/tenant-scoped.repository';
import type { ProductionOrderListParams } from '@rona/types/manufacturing';

export interface OrderMaterialInsert {
  componentItemId: string;
  quantityPerUnit: string;
  requiredQuantity: string;
  reservationId?: string | null;
}

@Injectable()
export class ProductionOrdersRepository extends TenantScopedRepository {
  async create(
    data: {
      orderNumber: string;
      bomId: string;
      itemId: string;
      warehouseId: string;
      plannedQuantity: string;
      expectedYieldPercent?: string | null;
      expectedQuantity?: string | null;
      plannedStartDate?: Date | null;
      plannedEndDate?: Date | null;
      notes?: string | null;
    },
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .insert(productionOrders)
      .values({ ...data, organizationId: this.organizationId })
      .returning();
    return row;
  }

  async findById(orderId: string) {
    const [row] = await db
      .select()
      .from(productionOrders)
      .where(
        this.tenantScope(productionOrders, eq(productionOrders.id, orderId)),
      )
      .limit(1);
    return row;
  }

  async findByIdForUpdate(orderId: string, tx: Executor) {
    const [row] = await tx
      .select()
      .from(productionOrders)
      .where(
        this.tenantScope(productionOrders, eq(productionOrders.id, orderId)),
      )
      .limit(1)
      .for('update');
    return row;
  }

  async findByOrderNumber(orderNumber: string) {
    const [row] = await db
      .select()
      .from(productionOrders)
      .where(
        this.tenantScope(
          productionOrders,
          eq(productionOrders.orderNumber, orderNumber),
        ),
      )
      .limit(1);
    return row;
  }

  async update(
    orderId: string,
    data: Partial<typeof productionOrders.$inferInsert>,
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .update(productionOrders)
      .set(data)
      .where(
        this.tenantScope(productionOrders, eq(productionOrders.id, orderId)),
      )
      .returning();
    return row;
  }

  async list(params: ProductionOrderListParams) {
    const conditions: SQL[] = [];
    if (params.status) {
      conditions.push(eq(productionOrders.status, params.status));
    }
    if (params.itemId) {
      conditions.push(eq(productionOrders.itemId, params.itemId));
    }
    if (params.warehouseId) {
      conditions.push(eq(productionOrders.warehouseId, params.warehouseId));
    }
    if (params.searchQuery) {
      const searchCondition = or(
        ilike(productionOrders.orderNumber, `%${params.searchQuery}%`),
        ilike(boms.code, `%${params.searchQuery}%`),
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    const where = this.tenantScope(productionOrders, ...conditions);
    const offset = (params.page - 1) * params.limit;

    const rows = await db
      .select({
        id: productionOrders.id,
        organizationId: productionOrders.organizationId,
        orderNumber: productionOrders.orderNumber,
        bomId: productionOrders.bomId,
        bomVersionId: productionOrders.bomVersionId,
        bomCode: boms.code,
        itemId: productionOrders.itemId,
        itemCode: items.code,
        itemName: items.name,
        warehouseId: productionOrders.warehouseId,
        warehouseCode: warehouses.code,
        status: productionOrders.status,
        plannedQuantity: productionOrders.plannedQuantity,
        expectedYieldPercent: productionOrders.expectedYieldPercent,
        expectedQuantity: productionOrders.expectedQuantity,
        actualQuantity: productionOrders.actualQuantity,
        actualYieldPercent: productionOrders.actualYieldPercent,
        plannedStartDate: productionOrders.plannedStartDate,
        plannedEndDate: productionOrders.plannedEndDate,
        startedAt: productionOrders.startedAt,
        completedAt: productionOrders.completedAt,
        approvedAt: productionOrders.approvedAt,
        notes: productionOrders.notes,
        createdAt: productionOrders.createdAt,
        updatedAt: productionOrders.updatedAt,
      })
      .from(productionOrders)
      .leftJoin(boms, eq(boms.id, productionOrders.bomId))
      .leftJoin(items, eq(items.id, productionOrders.itemId))
      .leftJoin(warehouses, eq(warehouses.id, productionOrders.warehouseId))
      .where(where)
      .orderBy(desc(productionOrders.createdAt))
      .limit(params.limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(productionOrders)
      .leftJoin(boms, eq(boms.id, productionOrders.bomId))
      .where(where);

    return { rows, total: Number(total) };
  }

  async createMaterials(
    orderId: string,
    materials: OrderMaterialInsert[],
    tx: Executor,
  ) {
    return tx
      .insert(productionOrderMaterials)
      .values(
        materials.map((material) => ({
          organizationId: this.organizationId,
          productionOrderId: orderId,
          componentItemId: material.componentItemId,
          quantityPerUnit: material.quantityPerUnit,
          requiredQuantity: material.requiredQuantity,
          reservationId: material.reservationId ?? null,
        })),
      )
      .returning();
  }

  async findMaterials(orderId: string) {
    return db
      .select({
        id: productionOrderMaterials.id,
        organizationId: productionOrderMaterials.organizationId,
        productionOrderId: productionOrderMaterials.productionOrderId,
        componentItemId: productionOrderMaterials.componentItemId,
        componentItemCode: items.code,
        componentItemName: items.name,
        quantityPerUnit: productionOrderMaterials.quantityPerUnit,
        requiredQuantity: productionOrderMaterials.requiredQuantity,
        reservationId: productionOrderMaterials.reservationId,
        consumedQuantity: productionOrderMaterials.consumedQuantity,
        returnedQuantity: productionOrderMaterials.returnedQuantity,
        createdAt: productionOrderMaterials.createdAt,
        updatedAt: productionOrderMaterials.updatedAt,
      })
      .from(productionOrderMaterials)
      .leftJoin(items, eq(items.id, productionOrderMaterials.componentItemId))
      .where(
        this.tenantScope(
          productionOrderMaterials,
          eq(productionOrderMaterials.productionOrderId, orderId),
        ),
      )
      .orderBy(productionOrderMaterials.componentItemId);
  }

  async findMaterialByItem(orderId: string, componentItemId: string) {
    const [row] = await db
      .select()
      .from(productionOrderMaterials)
      .where(
        this.tenantScope(
          productionOrderMaterials,
          eq(productionOrderMaterials.productionOrderId, orderId),
          eq(productionOrderMaterials.componentItemId, componentItemId),
        ),
      )
      .limit(1);
    return row;
  }

  async findMaterialForUpdate(materialId: string, tx: Executor) {
    const [row] = await tx
      .select()
      .from(productionOrderMaterials)
      .where(
        this.tenantScope(
          productionOrderMaterials,
          eq(productionOrderMaterials.id, materialId),
        ),
      )
      .limit(1)
      .for('update');
    return row;
  }

  async updateMaterial(
    materialId: string,
    data: Partial<typeof productionOrderMaterials.$inferInsert>,
    tx: Executor,
  ) {
    const [row] = await tx
      .update(productionOrderMaterials)
      .set(data)
      .where(
        this.tenantScope(
          productionOrderMaterials,
          eq(productionOrderMaterials.id, materialId),
        ),
      )
      .returning();
    return row;
  }

  async sumConsumedByItem(orderId: string, componentItemId: string) {
    const material = await this.findMaterialByItem(orderId, componentItemId);
    return material?.consumedQuantity ?? '0';
  }

  async hasMaterials(orderId: string) {
    const [{ total }] = await db
      .select({ total: count() })
      .from(productionOrderMaterials)
      .where(
        and(
          this.tenantScope(
            productionOrderMaterials,
            eq(productionOrderMaterials.productionOrderId, orderId),
          ),
        ),
      );
    return Number(total) > 0;
  }
}
