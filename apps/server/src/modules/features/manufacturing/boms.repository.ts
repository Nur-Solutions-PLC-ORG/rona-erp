import { asc, count, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db, pooledDb } from '@/db';
import type { Executor } from '@/db/executor';
import { bomLines, boms, bomVersions } from '@/db/schemas/manufacturing/bom';
import { productionOrders } from '@/db/schemas/manufacturing/production';
import { items } from '@/db/schemas/inventory/master-data';
import { TenantScopedRepository } from '@/modules/tenancy/tenant-scoped.repository';
import type { BomListParams } from '@rona/types/manufacturing';

export interface BomLineInsert {
  componentItemId: string;
  quantityPerUnit: string;
  notes?: string | null;
}

@Injectable()
export class BomsRepository extends TenantScopedRepository {

  async create(
    data: {
      code: string;
      name: string;
      description?: string | null;
      itemId: string;
    },
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .insert(boms)
      .values({ ...data, organizationId: this.organizationId })
      .returning();
    return row;
  }

  async findById(bomId: string) {
    const [row] = await db
      .select()
      .from(boms)
      .where(this.tenantScope(boms, eq(boms.id, bomId)))
      .limit(1);
    return row;
  }

  async findByCode(code: string) {
    const [row] = await db
      .select()
      .from(boms)
      .where(this.tenantScope(boms, eq(boms.code, code)))
      .limit(1);
    return row;
  }

  async update(
    bomId: string,
    data: { name?: string; description?: string | null; isActive?: boolean },
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .update(boms)
      .set(data)
      .where(this.tenantScope(boms, eq(boms.id, bomId)))
      .returning();
    return row;
  }

  async list(params: BomListParams) {
    const conditions: SQL[] = [];
    if (params.itemId) {
      conditions.push(eq(boms.itemId, params.itemId));
    }
    if (params.searchQuery) {
      const searchCondition = or(
        ilike(boms.code, `%${params.searchQuery}%`),
        ilike(boms.name, `%${params.searchQuery}%`),
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    const where = this.tenantScope(boms, ...conditions);
    const offset = (params.page - 1) * params.limit;

    const rows = await db
      .select({
        id: boms.id,
        organizationId: boms.organizationId,
        code: boms.code,
        name: boms.name,
        description: boms.description,
        itemId: boms.itemId,
        itemCode: items.code,
        itemName: items.name,
        isActive: boms.isActive,
        createdAt: boms.createdAt,
        updatedAt: boms.updatedAt,
      })
      .from(boms)
      .leftJoin(items, eq(items.id, boms.itemId))
      .where(where)
      .orderBy(asc(boms.code))
      .limit(params.limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(boms)
      .where(where);

    return { rows, total: Number(total) };
  }

  async createVersion(
    data: { bomId: string; version: string; status?: 'DRAFT' },
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .insert(bomVersions)
      .values({
        organizationId: this.organizationId,
        bomId: data.bomId,
        version: data.version,
        status: data.status ?? 'DRAFT',
      })
      .returning();
    return row;
  }

  async findVersionById(versionId: string) {
    const [row] = await db
      .select()
      .from(bomVersions)
      .where(this.tenantScope(bomVersions, eq(bomVersions.id, versionId)))
      .limit(1);
    return row;
  }

  async findVersionByIdForUpdate(versionId: string, tx: Executor) {
    const [row] = await tx
      .select()
      .from(bomVersions)
      .where(this.tenantScope(bomVersions, eq(bomVersions.id, versionId)))
      .limit(1)
      .for('update');
    return row;
  }

  async findVersionsByBom(bomId: string) {
    return db
      .select()
      .from(bomVersions)
      .where(this.tenantScope(bomVersions, eq(bomVersions.bomId, bomId)))
      .orderBy(desc(bomVersions.version));
  }

  async findApprovedVersion(bomId: string, tx?: Executor) {
    const executor = tx ?? db;
    const [row] = await executor
      .select()
      .from(bomVersions)
      .where(
        this.tenantScope(
          bomVersions,
          eq(bomVersions.bomId, bomId),
          eq(bomVersions.status, 'APPROVED'),
        ),
      )
      .limit(1);
    return row;
  }

  async findDraftVersion(bomId: string, tx?: Executor) {
    const executor = tx ?? db;
    const [row] = await executor
      .select()
      .from(bomVersions)
      .where(
        this.tenantScope(
          bomVersions,
          eq(bomVersions.bomId, bomId),
          eq(bomVersions.status, 'DRAFT'),
        ),
      )
      .limit(1);
    return row;
  }

  async findMaxVersion(bomId: string, tx?: Executor) {
    const executor = tx ?? db;
    const [row] = await executor
      .select({ version: bomVersions.version })
      .from(bomVersions)
      .where(this.tenantScope(bomVersions, eq(bomVersions.bomId, bomId)))
      .orderBy(desc(bomVersions.version))
      .limit(1);
    return row?.version ?? '0';
  }

  async updateVersion(
    versionId: string,
    data: Partial<typeof bomVersions.$inferInsert>,
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .update(bomVersions)
      .set(data)
      .where(this.tenantScope(bomVersions, eq(bomVersions.id, versionId)))
      .returning();
    return row;
  }

  async listVersions(
    bomId: string,
    params: { page: number; limit: number; status?: string },
  ) {
    const conditions: SQL[] = [eq(bomVersions.bomId, bomId)];
    if (params.status) {
      conditions.push(
        eq(
          bomVersions.status,
          params.status as 'DRAFT' | 'APPROVED' | 'RETIRED',
        ),
      );
    }

    const where = this.tenantScope(bomVersions, ...conditions);
    const offset = (params.page - 1) * params.limit;

    const rows = await db
      .select()
      .from(bomVersions)
      .where(where)
      .orderBy(desc(bomVersions.version))
      .limit(params.limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(bomVersions)
      .where(where);

    return { rows, total: Number(total) };
  }

  async createLines(versionId: string, lines: BomLineInsert[], tx?: Executor) {
    const executor = tx ?? pooledDb;
    return executor
      .insert(bomLines)
      .values(
        lines.map((line) => ({
          organizationId: this.organizationId,
          bomVersionId: versionId,
          componentItemId: line.componentItemId,
          quantityPerUnit: line.quantityPerUnit,
          notes: line.notes ?? null,
        })),
      )
      .returning();
  }

  async findLinesByVersion(versionId: string) {
    return db
      .select({
        id: bomLines.id,
        organizationId: bomLines.organizationId,
        bomVersionId: bomLines.bomVersionId,
        componentItemId: bomLines.componentItemId,
        componentItemCode: items.code,
        componentItemName: items.name,
        quantityPerUnit: bomLines.quantityPerUnit,
        notes: bomLines.notes,
        createdAt: bomLines.createdAt,
        updatedAt: bomLines.updatedAt,
      })
      .from(bomLines)
      .leftJoin(items, eq(items.id, bomLines.componentItemId))
      .where(this.tenantScope(bomLines, eq(bomLines.bomVersionId, versionId)))
      .orderBy(asc(bomLines.componentItemId));
  }

  async deleteLines(versionId: string, tx: Executor) {
    await tx
      .delete(bomLines)
      .where(this.tenantScope(bomLines, eq(bomLines.bomVersionId, versionId)));
  }

  async countVersionUsage(versionId: string) {
    const [{ total }] = await db
      .select({ total: count() })
      .from(productionOrders)
      .where(
        this.tenantScope(
          productionOrders,
          eq(productionOrders.bomVersionId, versionId),
        ),
      );
    return Number(total);
  }
}
