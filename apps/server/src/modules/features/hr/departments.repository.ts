import { asc, count, eq, ilike, isNull, or, type SQL } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db, pooledDb } from '@/db';
import type { Executor } from '@/db/executor';
import { departments, positions } from '@/db/schemas/admin';
import { TenantScopedRepository } from '@/modules/tenancy/tenant-scoped.repository';
import type {
  DepartmentCreateInput,
  DepartmentListParams,
  DepartmentUpdateInput,
  PositionCreateInput,
  PositionListParams,
  PositionUpdateInput,
} from '@rona/types/hr';

@Injectable()
export class DepartmentsRepository extends TenantScopedRepository {
  async createDepartment(data: DepartmentCreateInput, tx?: Executor) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .insert(departments)
      .values({
        name: data.name,
        code: data.code,
        modules: data.modules ?? [],
        organizationId: this.organizationId,
      })
      .returning();
    return row;
  }

  async findDepartmentById(departmentId: string) {
    const [row] = await db
      .select()
      .from(departments)
      .where(this.tenantScope(departments, eq(departments.id, departmentId)))
      .limit(1);
    return row;
  }

  async findDepartmentByCode(code: string) {
    const [row] = await db
      .select()
      .from(departments)
      .where(this.tenantScope(departments, eq(departments.code, code)))
      .limit(1);
    return row;
  }

  async updateDepartment(
    departmentId: string,
    data: DepartmentUpdateInput,
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .update(departments)
      .set(data)
      .where(this.tenantScope(departments, eq(departments.id, departmentId)))
      .returning();
    return row;
  }

  async listDepartments(params: DepartmentListParams) {
    const conditions: SQL[] = [];
    if (params.searchQuery) {
      const searchCondition = or(
        ilike(departments.name, `%${params.searchQuery}%`),
        ilike(departments.code, `%${params.searchQuery}%`),
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    const where = this.tenantScope(departments, ...conditions);
    const offset = (params.page - 1) * params.limit;

    const rows = await db
      .select()
      .from(departments)
      .where(where)
      .orderBy(asc(departments.name))
      .limit(params.limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(departments)
      .where(where);

    return { rows, total: Number(total) };
  }

  async createPosition(data: PositionCreateInput, tx?: Executor) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .insert(positions)
      .values({ ...data, organizationId: this.organizationId })
      .returning();
    return row;
  }

  async findPositionById(positionId: string) {
    const [row] = await db
      .select()
      .from(positions)
      .where(this.tenantScope(positions, eq(positions.id, positionId)))
      .limit(1);
    return row;
  }

  async findPositionByCode(code: string) {
    const [row] = await db
      .select()
      .from(positions)
      .where(this.tenantScope(positions, eq(positions.code, code)))
      .limit(1);
    return row;
  }

  async updatePosition(
    positionId: string,
    data: PositionUpdateInput,
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .update(positions)
      .set(data)
      .where(this.tenantScope(positions, eq(positions.id, positionId)))
      .returning();
    return row;
  }

  async archivePosition(positionId: string, tx?: Executor) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .update(positions)
      .set({ archivedAt: new Date() })
      .where(this.tenantScope(positions, eq(positions.id, positionId)))
      .returning();
    return row;
  }

  async restorePosition(positionId: string, tx?: Executor) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .update(positions)
      .set({ archivedAt: null })
      .where(this.tenantScope(positions, eq(positions.id, positionId)))
      .returning();
    return row;
  }

  async listPositions(params: PositionListParams) {
    const conditions: SQL[] = [];
    if (params.departmentId) {
      conditions.push(eq(positions.departmentId, params.departmentId));
    }
    if (!(
      typeof params.includeArchived === 'boolean' && params.includeArchived
    )) {
      conditions.push(isNull(positions.archivedAt));
    }
    if (params.searchQuery) {
      const searchCondition = or(
        ilike(positions.title, `%${params.searchQuery}%`),
        ilike(positions.code, `%${params.searchQuery}%`),
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    const where = this.tenantScope(positions, ...conditions);
    const offset = (params.page - 1) * params.limit;

    const rows = await db
      .select({
        id: positions.id,
        organizationId: positions.organizationId,
        title: positions.title,
        code: positions.code,
        description: positions.description,
        departmentId: positions.departmentId,
        departmentName: departments.name,
        createdAt: positions.createdAt,
        updatedAt: positions.updatedAt,
        archivedAt: positions.archivedAt,
      })
      .from(positions)
      .leftJoin(departments, eq(departments.id, positions.departmentId))
      .where(where)
      .orderBy(asc(positions.title))
      .limit(params.limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(positions)
      .where(where);

    return { rows, total: Number(total) };
  }
}
