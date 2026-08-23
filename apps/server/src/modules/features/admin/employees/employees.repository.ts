import { db } from '@/db';
import { employees } from '@/db/schemas/admin';
import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, ilike, ne, type SQL } from 'drizzle-orm';
import type { EmployeeListSearchParamsSchema } from '@rona/types/admin';

@Injectable()
export class EmployeesRepository {
  async findMany(params: EmployeeListSearchParamsSchema) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 25;
    const conditions = this.listConditions(params);
    const where = conditions.length ? and(...conditions) : undefined;
    const [records, totalResult] = await Promise.all([
      db
        .select()
        .from(employees)
        .where(where)
        .orderBy(desc(employees.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ total: count() }).from(employees).where(where),
    ]);
    return { records, total: totalResult[0]?.total ?? 0 };
  }
  async findById(id: string) {
    const records = await db
      .select()
      .from(employees)
      .where(eq(employees.id, id))
      .limit(1);
    return records[0];
  }
  async findByEid(eid: string, exceptId?: string) {
    const where = exceptId
      ? and(eq(employees.eid, eid), ne(employees.id, exceptId))
      : eq(employees.eid, eid);
    const records = await db
      .select({ id: employees.id })
      .from(employees)
      .where(where)
      .limit(1);
    return records[0];
  }
  async create(data: typeof employees.$inferInsert) {
    const records = await db.insert(employees).values(data).returning();
    return records[0];
  }
  async update(id: string, data: Partial<typeof employees.$inferInsert>) {
    const records = await db
      .update(employees)
      .set(data)
      .where(eq(employees.id, id))
      .returning();
    return records[0];
  }
  async delete(id: string) {
    const records = await db
      .delete(employees)
      .where(eq(employees.id, id))
      .returning({ id: employees.id });
    return Boolean(records[0]);
  }
  private listConditions(params: EmployeeListSearchParamsSchema): SQL[] {
    const conditions: SQL[] = [];
    if (params.status) conditions.push(eq(employees.status, params.status));
    if (params.searchQuery)
      conditions.push(ilike(employees.fullName, `%${params.searchQuery}%`));
    return conditions;
  }
}
