import { and, count, desc, eq, type SQL } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db, pooledDb } from '@/db';
import type { Executor } from '@/db/executor';
import { auditLogs } from '@/db/schemas/tenancy';
import type { AuditLogDto } from '@rona/types/tenancy';

export interface AuditListFilters {
  action?: string;
  entityType?: string;
  entityId?: string;
  actorId?: string;
  limit: number;
  offset: number;
}

@Injectable()
export class AuditRepository {
  async insert(
    values: typeof auditLogs.$inferInsert,
    tx?: Executor,
  ): Promise<void> {
    const executor = tx ?? pooledDb;
    await executor.insert(auditLogs).values(values);
  }

  async list(
    organizationId: string,
    filters: AuditListFilters,
  ): Promise<AuditLogDto[]> {
    const conditions: SQL[] = [eq(auditLogs.organizationId, organizationId)];

    if (filters.action) {
      conditions.push(eq(auditLogs.action, filters.action));
    }
    if (filters.entityType) {
      conditions.push(eq(auditLogs.entityType, filters.entityType));
    }
    if (filters.entityId) {
      conditions.push(eq(auditLogs.entityId, filters.entityId));
    }
    if (filters.actorId) {
      conditions.push(eq(auditLogs.actorId, filters.actorId));
    }

    return db
      .select()
      .from(auditLogs)
      .where(and(...conditions))
      .orderBy(desc(auditLogs.createdAt))
      .limit(filters.limit)
      .offset(filters.offset);
  }

  async count(
    organizationId: string,
    filters: Omit<AuditListFilters, 'limit' | 'offset'>,
  ): Promise<number> {
    const conditions: SQL[] = [eq(auditLogs.organizationId, organizationId)];

    if (filters.action) {
      conditions.push(eq(auditLogs.action, filters.action));
    }
    if (filters.entityType) {
      conditions.push(eq(auditLogs.entityType, filters.entityType));
    }
    if (filters.entityId) {
      conditions.push(eq(auditLogs.entityId, filters.entityId));
    }
    if (filters.actorId) {
      conditions.push(eq(auditLogs.actorId, filters.actorId));
    }

    const [row] = await db
      .select({ total: count() })
      .from(auditLogs)
      .where(and(...conditions));

    return Number(row?.total ?? 0);
  }
}
