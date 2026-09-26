import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';
import { drizzle as drizzlePool } from 'drizzle-orm/neon-serverless';
import { drizzle } from 'drizzle-orm/neon-http';

export const db = drizzle(process.env.DATABASE_URL!);

export const pooledDb = drizzlePool(
  new Pool({ connectionString: process.env.DATABASE_URL! }),
);
