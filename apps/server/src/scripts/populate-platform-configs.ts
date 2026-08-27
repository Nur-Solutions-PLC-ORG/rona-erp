import { db } from '@/db';
import { platformConfigs } from '@/db/schemas/admin';
import { PLATFORM_CONFIG_DEFAULTS } from '@rona/config/admin';
import { sql } from 'drizzle-orm';

async function main() {
  const configs = await db
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
    .returning({ key: platformConfigs.key });

  console.log(`Populated ${configs.length} platform configurations.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
