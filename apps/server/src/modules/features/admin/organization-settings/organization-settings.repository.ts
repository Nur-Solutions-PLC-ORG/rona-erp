import { db } from '@/db';
import { organizationSettings } from '@/db/schemas/admin';
import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, ne, type SQL } from 'drizzle-orm';
import type { OrganizationSettingsListSearchParamsSchema } from '@rona/types/admin';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@rona/config';

@Injectable()
export class OrganizationSettingsRepository {
  async findMany(params: OrganizationSettingsListSearchParamsSchema) {
    const page = params.page ?? DEFAULT_PAGE;
    const limit = params.limit ?? DEFAULT_PAGE_SIZE;
    const where = this.listConditions(params).length
      ? and(...this.listConditions(params))
      : undefined;
    const [records, totalResult] = await Promise.all([
      db
        .select()
        .from(organizationSettings)
        .where(where)
        .orderBy(desc(organizationSettings.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ total: count() }).from(organizationSettings).where(where),
    ]);
    return { records, total: totalResult[0]?.total ?? 0 };
  }

  async findById(id: string) {
    const records = await db
      .select()
      .from(organizationSettings)
      .where(eq(organizationSettings.id, id))
      .limit(1);
    return records[0];
  }

  async findByOrganizationId(organizationId: string, exceptId?: string) {
    const where = exceptId
      ? and(
          eq(organizationSettings.organizationId, organizationId),
          ne(organizationSettings.id, exceptId),
        )
      : eq(organizationSettings.organizationId, organizationId);
    const records = await db
      .select({ id: organizationSettings.id })
      .from(organizationSettings)
      .where(where)
      .limit(1);
    return records[0];
  }

  async create(data: typeof organizationSettings.$inferInsert) {
    const records = await db
      .insert(organizationSettings)
      .values(data)
      .returning();
    return records[0];
  }

  async update(
    id: string,
    data: Partial<typeof organizationSettings.$inferInsert>,
  ) {
    const records = await db
      .update(organizationSettings)
      .set(data)
      .where(eq(organizationSettings.id, id))
      .returning();
    return records[0];
  }

  async delete(id: string) {
    const records = await db
      .delete(organizationSettings)
      .where(eq(organizationSettings.id, id))
      .returning({ id: organizationSettings.id });
    return Boolean(records[0]);
  }

  private listConditions(
    params: OrganizationSettingsListSearchParamsSchema,
  ): SQL[] {
    return params.searchQuery
      ? [eq(organizationSettings.organizationId, params.searchQuery)]
      : [];
  }
}
