import { db, pooledDb } from '@/db';
import { organizationSettings, organizations } from '@/db/schemas/admin';
import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, ilike, ne, type SQL } from 'drizzle-orm';
import type { Executor } from '@/db/executor';
import type { OrganizationListSearchParamsSchema } from '@rona/types/admin';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@rona/config';

@Injectable()
export class OrganizationsRepository {
  async findMany(params: OrganizationListSearchParamsSchema) {
    const page = params.page ?? DEFAULT_PAGE;
    const limit = params.limit ?? DEFAULT_PAGE_SIZE;
    const conditions = this.listConditions(params);
    const where = conditions.length ? and(...conditions) : undefined;

    const [records, totalResult] = await Promise.all([
      db
        .select()
        .from(organizations)
        .where(where)
        .orderBy(desc(organizations.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ total: count() }).from(organizations).where(where),
    ]);
    return { records, total: totalResult[0]?.total ?? 0 };
  }

  async findById(id: string) {
    const records = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);
    return records[0];
  }

  async findBySlug(slug: string, exceptId?: string) {
    const where = exceptId
      ? and(eq(organizations.slug, slug), ne(organizations.id, exceptId))
      : eq(organizations.slug, slug);
    const records = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(where)
      .limit(1);
    return records[0];
  }

  async create(data: typeof organizations.$inferInsert, tx?: Executor) {
    const executor = tx ?? pooledDb;
    return executor.transaction(async (innerTx) => {
      const records = await innerTx
        .insert(organizations)
        .values(data)
        .returning();
      const organization = records[0];

      await innerTx
        .insert(organizationSettings)
        .values({ organizationId: organization.id });

      return organization;
    });
  }

  async update(
    id: string,
    data: Partial<typeof organizations.$inferInsert>,
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const records = await executor
      .update(organizations)
      .set(data)
      .where(eq(organizations.id, id))
      .returning();
    return records[0];
  }

  async delete(id: string, tx?: Executor) {
    const executor = tx ?? pooledDb;
    const records = await executor
      .delete(organizations)
      .where(eq(organizations.id, id))
      .returning({ id: organizations.id });
    return Boolean(records[0]);
  }

  private listConditions(params: OrganizationListSearchParamsSchema): SQL[] {
    const conditions: SQL[] = [];
    if (params.status) conditions.push(eq(organizations.status, params.status));
    if (params.searchQuery)
      conditions.push(ilike(organizations.name, `%${params.searchQuery}%`));
    return conditions;
  }
}
