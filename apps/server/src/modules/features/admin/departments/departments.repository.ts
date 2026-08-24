import { db } from '@/db';
import { departments } from '@/db/schemas/admin';
import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, ilike, type SQL } from 'drizzle-orm';
import type { DepartmentListSearchParamsSchema } from '@rona/types/admin';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@rona/config';

@Injectable()
export class DepartmentsRepository {
  async findMany(params: DepartmentListSearchParamsSchema) {
    const page = params.page ?? DEFAULT_PAGE;
    const limit = params.limit ?? DEFAULT_PAGE_SIZE;
    const conditions = this.listConditions(params);
    const where = conditions.length ? and(...conditions) : undefined;
    const [records, totalResult] = await Promise.all([
      db
        .select()
        .from(departments)
        .where(where)
        .orderBy(desc(departments.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ total: count() }).from(departments).where(where),
    ]);
    return { records, total: totalResult[0]?.total ?? 0 };
  }
  async findById(id: string) {
    const records = await db
      .select()
      .from(departments)
      .where(eq(departments.id, id))
      .limit(1);
    return records[0];
  }
  async create(data: typeof departments.$inferInsert) {
    const records = await db.insert(departments).values(data).returning();
    return records[0];
  }
  async update(id: string, data: Partial<typeof departments.$inferInsert>) {
    const records = await db
      .update(departments)
      .set(data)
      .where(eq(departments.id, id))
      .returning();
    return records[0];
  }
  async delete(id: string) {
    const records = await db
      .delete(departments)
      .where(eq(departments.id, id))
      .returning({ id: departments.id });
    return Boolean(records[0]);
  }
  private listConditions(params: DepartmentListSearchParamsSchema): SQL[] {
    const conditions: SQL[] = [];
    if (params.orgId)
      conditions.push(eq(departments.organizationId, params.orgId));
    if (params.searchQuery)
      conditions.push(ilike(departments.name, `%${params.searchQuery}%`));
    return conditions;
  }
}
