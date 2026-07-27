import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';
import { drizzle as drizzlePool } from 'drizzle-orm/neon-serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// normal DB client
export const db = drizzle(process.env.DATABASE_URL!);

// DB client for pooled connections, for using db transactions
export const pooledDb = drizzlePool(
  new Pool({ connectionString: process.env.DATABASE_URL! }),
);
