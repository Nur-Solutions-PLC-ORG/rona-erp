import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const sql = neon(process.env.DATABASE_URL);

  await sql`DROP SCHEMA IF EXISTS public CASCADE`;
  console.log('Dropped public schema.');

  await sql`CREATE SCHEMA public`;
  console.log('Recreated public schema.');

  console.log('Database reset. Run `pnpm exec drizzle-kit push` next.');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
