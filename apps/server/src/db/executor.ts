import type { pooledDb } from '@/db';

export type TxExecutor = Parameters<
  Parameters<typeof pooledDb.transaction>[0]
>[0];

export type Executor = typeof pooledDb | TxExecutor;
