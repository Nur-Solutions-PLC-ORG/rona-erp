import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { MODULE_LIST } from '@rona/config/auth';

const NEW_VALUES = MODULE_LIST;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');

  const sql = neon(url);
  const allowed = NEW_VALUES.map((value) => `'${value}'`).join(', ');

  await sql.query(`DROP TYPE IF EXISTS modules_list_new`);

  const stale = await sql.query(
    `select coalesce(array_agg(distinct m)) as modules from user_roles, unnest(module) as m where m::text not in (${allowed})`,
  );
  console.log(
    'stale values remaining:',
    JSON.stringify(stale[0]?.modules ?? []),
  );

  await sql.transaction([
    sql.query(`CREATE TYPE modules_list_new AS ENUM (${allowed})`),
    sql.query(`ALTER TABLE user_roles ALTER COLUMN module DROP DEFAULT`),
    sql.query(
      `ALTER TABLE user_roles ALTER COLUMN module TYPE modules_list_new[] USING module::text[]::modules_list_new[]`,
    ),
    sql.query(
      `ALTER TABLE user_roles ALTER COLUMN module SET DEFAULT '{}'::modules_list_new[]`,
    ),
    sql.query(`DROP TYPE modules_list`),
    sql.query(`ALTER TYPE modules_list_new RENAME TO modules_list`),
  ]);

  const enumValues =
    await sql`select unnest(enum_range(NULL::modules_list)) as value`;
  console.log(
    'new modules_list values:',
    enumValues.map((row) => String(row.value)).join(', '),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
