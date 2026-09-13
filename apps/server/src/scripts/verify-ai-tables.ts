import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const db = drizzle(new Pool({ connectionString: process.env.DATABASE_URL }));

  const columns = await db.execute<{ column_name: string; data_type: string }>(
    sql`select column_name, data_type
        from information_schema.columns
        where table_name = 'ai_report_jobs'
        order by ordinal_position`,
  );
  console.log('ai_report_jobs columns:');
  for (const row of columns.rows) {
    console.log(`  ${row.column_name} (${row.data_type})`);
  }

  const claim = await db.execute(
    sql`select report_id from ai_report_jobs
        where status = 'pending'
          and next_attempt_at <= now()
          and attempts < max_attempts
        order by next_attempt_at asc
        limit 5`,
  );
  console.log(
    `\nWorker claim query OK (${claim.rows.length} runnable job(s)).`,
  );

  const knowledge = await db.execute(
    sql`select count(*)::int as count from ai_knowledge_documents`,
  );
  console.log(
    `ai_knowledge_documents present (${knowledge.rows[0]?.count ?? 0} rows).`,
  );

  process.exit(0);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
