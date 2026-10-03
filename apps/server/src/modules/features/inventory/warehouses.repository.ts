import {
  and,
  asc,
  count,
  eq,
  getTableColumns,
  ilike,
  inArray,
  or,
  type SQL,
} from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db, pooledDb } from '@/db';
import type { Executor } from '@/db/executor';
import {
  batchLots,
  items,
  warehouseLocations,
  warehouses,
} from '@/db/schemas/inventory/master-data';
import { TenantScopedRepository } from '@/modules/tenancy/tenant-scoped.repository';
import type {
  LotCreateInput,
  LotListParams,
  WarehouseCreateInput,
  WarehouseListParams,
  WarehouseLocationCreateInput,
  WarehouseUpdateInput,
} from '@rona/types/inventory';

type WarehouseLocationInsert = Omit<
  WarehouseLocationCreateInput,
  'warehouseId'
>;

@Injectable()
export class WarehousesRepository extends TenantScopedRepository {
  async create(data: WarehouseCreateInput, tx?: Executor) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .insert(warehouses)
      .values({ ...data, organizationId: this.organizationId })
      .returning();
    return row;
  }

  async findById(warehouseId: string) {
    const [row] = await db
      .select()
      .from(warehouses)
      .where(this.tenantScope(warehouses, eq(warehouses.id, warehouseId)))
      .limit(1);
    return row;
  }

  async findByCode(code: string) {
    const [row] = await db
      .select()
      .from(warehouses)
      .where(this.tenantScope(warehouses, eq(warehouses.code, code)))
      .limit(1);
    return row;
  }

  async update(warehouseId: string, data: WarehouseUpdateInput, tx?: Executor) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .update(warehouses)
      .set(data)
      .where(this.tenantScope(warehouses, eq(warehouses.id, warehouseId)))
      .returning();
    return row;
  }

  async list(params: WarehouseListParams) {
    const conditions: SQL[] = [];
    if (!(
      typeof params.includeInactive === 'boolean' && params.includeInactive
    )) {
      conditions.push(eq(warehouses.isActive, true));
    }
    if (params.searchQuery) {
      conditions.push(ilike(warehouses.name, `%${params.searchQuery}%`));
    }

    const where = this.tenantScope(warehouses, ...conditions);
    const offset = (params.page - 1) * params.limit;

    const rows = await db
      .select()
      .from(warehouses)
      .where(where)
      .orderBy(asc(warehouses.code))
      .limit(params.limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(warehouses)
      .where(where);

    return { rows, total: Number(total) };
  }

  async createLocation(
    warehouseId: string,
    data: WarehouseLocationInsert,
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .insert(warehouseLocations)
      .values({ ...data, warehouseId, organizationId: this.organizationId })
      .returning();
    return row;
  }

  async findLocationById(locationId: string) {
    const [row] = await db
      .select()
      .from(warehouseLocations)
      .where(
        this.tenantScope(
          warehouseLocations,
          eq(warehouseLocations.id, locationId),
        ),
      )
      .limit(1);
    return row;
  }

  async findLocationByCode(warehouseId: string, code: string) {
    const [row] = await db
      .select()
      .from(warehouseLocations)
      .where(
        this.tenantScope(
          warehouseLocations,
          eq(warehouseLocations.warehouseId, warehouseId),
          eq(warehouseLocations.code, code),
        ),
      )
      .limit(1);
    return row;
  }

  async listLocations(warehouseId: string) {
    return db
      .select()
      .from(warehouseLocations)
      .where(
        this.tenantScope(
          warehouseLocations,
          eq(warehouseLocations.warehouseId, warehouseId),
        ),
      )
      .orderBy(asc(warehouseLocations.code));
  }

  async createLot(
    itemId: string,
    data: Omit<LotCreateInput, 'itemId'>,
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .insert(batchLots)
      .values({ ...data, itemId, organizationId: this.organizationId })
      .returning();
    return row;
  }

  async findLotById(lotId: string) {
    const [row] = await db
      .select()
      .from(batchLots)
      .where(this.tenantScope(batchLots, eq(batchLots.id, lotId)))
      .limit(1);
    return row;
  }

  async findLotByNumber(itemId: string, lotNumber: string) {
    const [row] = await db
      .select()
      .from(batchLots)
      .where(
        this.tenantScope(
          batchLots,
          eq(batchLots.itemId, itemId),
          eq(batchLots.lotNumber, lotNumber),
        ),
      )
      .limit(1);
    return row;
  }

  async updateLot(
    lotId: string,
    data: Partial<typeof batchLots.$inferInsert>,
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .update(batchLots)
      .set(data)
      .where(this.tenantScope(batchLots, eq(batchLots.id, lotId)))
      .returning();
    return row;
  }

  async listLots(params: LotListParams) {
    const conditions: SQL[] = [];
    if (params.itemId) {
      conditions.push(eq(batchLots.itemId, params.itemId));
    }
    if (params.qualityStatus) {
      conditions.push(eq(batchLots.qualityStatus, params.qualityStatus));
    }
    if (params.searchQuery) {
      const pattern = `%${params.searchQuery}%`;
      const searchCondition = or(
        ilike(batchLots.lotNumber, pattern),
        inArray(
          batchLots.itemId,
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

    const where = this.tenantScope(batchLots, ...conditions);
    const offset = (params.page - 1) * params.limit;

    const rows = await db
      .select({
        ...getTableColumns(batchLots),
        itemName: items.name,
      })
      .from(batchLots)
      .leftJoin(items, eq(items.id, batchLots.itemId))
      .where(where)
      .orderBy(asc(batchLots.createdAt))
      .limit(params.limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(batchLots)
      .where(where);

    return { rows, total: Number(total) };
  }
}
