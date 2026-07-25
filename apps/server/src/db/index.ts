import dotenv from "dotenv";
dotenv.config();
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  console.warn("Database url missing.");}

const connectionString = process.env.DATABASE_URL as string;
export const sqlWrite = postgres(connectionString, {
  max: 50,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: "require",
  fetch_types: false,
  prepare: false,
});

export const sqlRead = process.env.DATABASE_READ_URL
  ? postgres(process.env.DATABASE_READ_URL as string, {
      max: 100, 
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: "require",
      fetch_types: false,
      prepare: false,
    })
  : sqlWrite;

export const db = drizzle(sqlWrite, { schema});
export const dbRead = drizzle(sqlRead, { schema});

export async function withTenantContext<T>(
  claims: { id: string; tenant_id: string; role: string },
  callback: (tx: postgres.TransactionSql) => Promise<T>,
  useReplica: boolean = false
): Promise<T> {
  const db = useReplica ? sqlRead : sqlWrite;

  return (await db.begin(async (tx) => {
    await tx`
      SELECT set_config('app.current_tenant_id', ${claims.tenant_id}, true),
             set_config('app.user_id', ${claims.id}, true),
             set_config('app.role', ${claims.role}, true)
    `;
    return await callback(tx);
  })) as any;
}

export default sqlWrite;
