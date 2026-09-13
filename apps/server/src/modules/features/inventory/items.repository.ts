import { and, asc, count, eq, ilike, or, type SQL } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db, pooledDb } from '@/db';
import type { Executor } from '@/db/executor';
import { items, unitsOfMeasure } from '@/db/schemas/inventory/master-data';
import { TenantScopedRepository } from '@/modules/tenancy/tenant-scoped.repository';
import type {
  ItemCreateInput,
  ItemListParams,
  ItemUpdateInput,
} from '@rona/types/inventory';

@Injectable()
export class ItemsRepository extends TenantScopedRepository {
  async create(data: ItemCreateInput, tx?: Executor) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .insert(items)
      .values({ ...data, organizationId: this.organizationId })
      .returning();
    return row;
  }

  async findById(itemId: string) {
    const [row] = await db
      .select()
      .from(items)
      .where(this.tenantScope(items, eq(items.id, itemId)))
      .limit(1);
    return row;
  }

  async findByIdForUpdate(itemId: string, tx: Executor) {
    const [row] = await tx
      .select()
      .from(items)
      .where(this.tenantScope(items, eq(items.id, itemId)))
      .limit(1)
      .for('update');
    return row;
  }

  async findByCode(code: string) {
    const [row] = await db
      .select()
      .from(items)
      .where(this.tenantScope(items, eq(items.code, code)))
      .limit(1);
    return row;
  }

  async update(itemId: string, data: ItemUpdateInput, tx?: Executor) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .update(items)
      .set(data)
      .where(this.tenantScope(items, eq(items.id, itemId)))
      .returning();
    return row;
  }

  async archive(itemId: string, tx?: Executor) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .update(items)
      .set({ isArchived: true })
      .where(this.tenantScope(items, eq(items.id, itemId)))
      .returning();
    return row;
  }

  async list(params: ItemListParams) {
    const conditions: SQL[] = [];
    if (params.type) {
      conditions.push(eq(items.type, params.type));
    }
    if (typeof params.includeArchived === 'boolean' && params.includeArchived) {
    } else {
      conditions.push(eq(items.isArchived, false));
    }
    if (params.searchQuery) {
      const searchCondition = or(
        ilike(items.code, `%${params.searchQuery}%`),
        ilike(items.name, `%${params.searchQuery}%`),
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    const where = this.tenantScope(items, ...conditions);
    const offset = (params.page - 1) * params.limit;

    const rows = await db
      .select({
        id: items.id,
        organizationId: items.organizationId,
        code: items.code,
        name: items.name,
        description: items.description,
        type: items.type,
        unitOfMeasureId: items.unitOfMeasureId,
        unitOfMeasureCode: unitsOfMeasure.code,
        reorderPoint: items.reorderPoint,
        reorderQuantity: items.reorderQuantity,
        barcode: items.barcode,
        isArchived: items.isArchived,
        createdAt: items.createdAt,
        updatedAt: items.updatedAt,
      })
      .from(items)
      .leftJoin(unitsOfMeasure, eq(unitsOfMeasure.id, items.unitOfMeasureId))
      .where(where)
      .orderBy(asc(items.code))
      .limit(params.limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(items)
      .where(where);

    return { rows, total: Number(total) };
  }

  async findUnitOfMeasure(unitOfMeasureId: string) {
    const [row] = await db
      .select()
      .from(unitsOfMeasure)
      .where(
        this.tenantScope(
          unitsOfMeasure,
          eq(unitsOfMeasure.id, unitOfMeasureId),
        ),
      )
      .limit(1);
    return row;
  }

  async createUnitOfMeasure(
    data: { code: string; name: string },
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .insert(unitsOfMeasure)
      .values({ ...data, organizationId: this.organizationId })
      .onConflictDoNothing()
      .returning();
    if (row) return row;
    const [existing] = await executor
      .select()
      .from(unitsOfMeasure)
      .where(
        and(
          eq(unitsOfMeasure.organizationId, this.organizationId),
          eq(unitsOfMeasure.code, data.code),
        ),
      )
      .limit(1);
    return existing;
  }

  async listUnitsOfMeasure() {
    return db
      .select()
      .from(unitsOfMeasure)
      .where(this.tenantScope(unitsOfMeasure))
      .orderBy(asc(unitsOfMeasure.code));
  }
}
