import { db } from '@/db';
import { platformConfigs } from '@/db/schemas/admin';
import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';
import type {
  ConfigsListSearchParamsSchema,
  PlatformConfigKey,
  PlatformConfigType,
} from '@rona/types/admin';
import { PLATFORM_CONFIG_DEFAULTS } from '@rona/config/admin';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@rona/config';

@Injectable()
export class PlatformConfigsRepository {
  async findMany(params: ConfigsListSearchParamsSchema) {
    const page = params.page ?? DEFAULT_PAGE;
    const limit = params.limit ?? DEFAULT_PAGE_SIZE;
    const conditions = this.listConditions(params);
    const where = conditions.length ? and(...conditions) : undefined;

    const [records, totalResult] = await Promise.all([
      db
        .select()
        .from(platformConfigs)
        .where(where)
        .orderBy(desc(platformConfigs.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ total: count() }).from(platformConfigs).where(where),
    ]);

    return { records, total: totalResult[0]?.total ?? 0 };
  }

  async findByKey(key: PlatformConfigKey) {
    const records = await db
      .select()
      .from(platformConfigs)
      .where(eq(platformConfigs.key, key))
      .limit(1);
    return records[0];
  }

  async reset() {
    return db
      .insert(platformConfigs)
      .values([...PLATFORM_CONFIG_DEFAULTS])
      .onConflictDoUpdate({
        target: platformConfigs.key,
        set: {
          value: sql`excluded.value`,
          type: sql`excluded.type`,
          updatedAt: new Date(),
        },
      })
      .returning();
  }

  async update(
    key: PlatformConfigKey,
    data: { value: string; type: PlatformConfigType },
  ) {
    const records = await db
      .update(platformConfigs)
      .set(data)
      .where(eq(platformConfigs.key, key))
      .returning();
    return records[0];
  }

  private listConditions(params: ConfigsListSearchParamsSchema): SQL[] {
    const conditions: SQL[] = [];

    if (params.searchQuery) {
      const searchPattern = `%${params.searchQuery}%`;
      conditions.push(
        or(
          sql`${platformConfigs.key}::text ILIKE ${searchPattern}`,
          ilike(platformConfigs.value, searchPattern),
          sql`${platformConfigs.type}::text ILIKE ${searchPattern}`,
        )!,
      );
    }

    return conditions;
  }
}
