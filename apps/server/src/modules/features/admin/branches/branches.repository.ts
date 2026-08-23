import { db } from '@/db';
import { branches } from '@/db/schemas/admin';
import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, ilike, type SQL } from 'drizzle-orm';
import type { BranchListSearchParamsSchema } from '@rona/types/admin';

@Injectable()
export class BranchesRepository {
  async findMany(params: BranchListSearchParamsSchema) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 25;
    const conditions = this.listConditions(params);
    const where = conditions.length ? and(...conditions) : undefined;
    const [records, totalResult] = await Promise.all([
      db
        .select()
        .from(branches)
        .where(where)
        .orderBy(desc(branches.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ total: count() }).from(branches).where(where),
    ]);
    return { records, total: totalResult[0]?.total ?? 0 };
  }

  async findById(id: string) {
    const records = await db
      .select()
      .from(branches)
      .where(eq(branches.id, id))
      .limit(1);
    return records[0];
  }
  async create(data: typeof branches.$inferInsert) {
    const records = await db.insert(branches).values(data).returning();
    return records[0];
  }
  async update(id: string, data: Partial<typeof branches.$inferInsert>) {
    const records = await db
      .update(branches)
      .set(data)
      .where(eq(branches.id, id))
      .returning();
    return records[0];
  }
  async delete(id: string) {
    const records = await db
      .delete(branches)
      .where(eq(branches.id, id))
      .returning({ id: branches.id });
    return Boolean(records[0]);
  }

  private listConditions(params: BranchListSearchParamsSchema): SQL[] {
    return params.searchQuery
      ? [ilike(branches.name, `%${params.searchQuery}%`)]
      : [];
  }
}
