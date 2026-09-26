import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const STATEMENTS_MARKER = '--> statement-breakpoint';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const db = drizzle(new Pool({ connectionString: process.env.DATABASE_URL }));
  const migrationsDir = join(process.cwd(), 'migrations');
  const file = readdirSync(migrationsDir).find((name) =>
    /^0014_.*\.sql$/.test(name),
  );
  if (!file) throw new Error('0014 migration file not found');

  const migration = readFileSync(join(migrationsDir, file), 'utf8');
  const statements = migration
    .split(STATEMENTS_MARKER)
    .map((statement) => statement.trim())
    .filter(Boolean);

  let applied = 0;
  let skipped = 0;

  const SKIP_PATTERNS = [/ALTER TABLE "costs"/];

  for (const statement of statements) {
    const label =
      statement
        .split('\n')
        .find((line) => line.startsWith('CREATE'))
        ?.slice(0, 70) ?? statement.slice(0, 70);

    if (SKIP_PATTERNS.some((pattern) => pattern.test(statement))) {
      console.log(`SKIP  ${label} (explicitly skipped)`);
      skipped += 1;
      continue;
    }

    try {
      await db.execute(sql.raw(statement));
      console.log(`OK    ${label}`);
      applied += 1;
    } catch (error) {
      const message = String((error as Error).message ?? error);
      const cause = String(
        ((error as Error).cause as Error | undefined)?.message ?? '',
      );
      const combined = `${message} ${cause}`;
      if (
        combined.includes('already exists') ||
        combined.includes('duplicate key value violates unique constraint')
      ) {
        console.log(`SKIP  ${label} (already exists)`);
        skipped += 1;
      } else {
        throw new Error(`Failed on "${label}": ${combined}`);
      }
    }
  }

  console.log(`\nDone: ${applied} applied, ${skipped} skipped (${file}).`);
  process.exit(0);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
