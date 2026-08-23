import { db } from '@/db';
import { platformConfigs } from '@/db/schemas/admin';
import { Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import type { PlatformConfigKey, PlatformConfigType } from '@rona/types/admin';
import { PLATFORM_CONFIG_DEFAULTS } from '@rona/config/admin';

@Injectable()
export class PlatformConfigsRepository {
  async findMany() {
    return db.select().from(platformConfigs);
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
}
