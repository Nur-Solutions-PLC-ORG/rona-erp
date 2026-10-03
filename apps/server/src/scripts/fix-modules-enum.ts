import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { MODULE_LIST } from '@rona/config/auth';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');

  const sql = neon(url);

  const current =
    await sql`select unnest(enum_range(NULL::modules_list)) as value`;
  const currentValues = new Set(current.map((row) => String(row.value)));
  console.log(
    'Current modules_list values:',
    [...currentValues].join(', ') || '(none)',
  );

  const missing = MODULE_LIST.filter(
    (value) => !currentValues.has(value as string),
  );

  if (missing.length === 0) {
    console.log('modules_list is already in sync — nothing to do.');
    return;
  }

  console.log('Adding missing enum values:', missing.join(', '));
  for (const value of missing) {
    await sql.query(`ALTER TYPE "public"."modules_list" ADD VALUE '${value}'`);
  }

  const updated =
    await sql`select unnest(enum_range(NULL::modules_list)) as value`;
  console.log(
    'Updated modules_list values:',
    updated.map((row) => String(row.value)).join(', '),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
