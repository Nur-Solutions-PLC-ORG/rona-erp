import { and, asc, count, eq, type SQL } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db, pooledDb } from '@/db';
import type { Executor } from '@/db/executor';
import { kiosks } from '@/db/schemas/kiosk';
import { TenantScopedRepository } from '@/modules/tenancy/tenant-scoped.repository';
import type { KioskListParams } from '@rona/types/kiosk';

@Injectable()
export class KiosksRepository extends TenantScopedRepository {
  async create(
    data: {
      organizationId: string;
      deviceId: string;
      name: string;
      tokenHash: string;
    },
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor.insert(kiosks).values(data).returning();
    return row;
  }

  async findById(kioskId: string) {
    const [row] = await db
      .select()
      .from(kiosks)
      .where(this.tenantScope(kiosks, eq(kiosks.id, kioskId)))
      .limit(1);
    return row;
  }

  async findByName(name: string) {
    const [row] = await db
      .select()
      .from(kiosks)
      .where(this.tenantScope(kiosks, eq(kiosks.name, name)))
      .limit(1);
    return row;
  }

  async update(
    kioskId: string,
    data: {
      name?: string;
      status?: 'ACTIVE' | 'INACTIVE';
      lastSeenAt?: Date;
      tokenHash?: string;
    },
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .update(kiosks)
      .set(data)
      .where(this.tenantScope(kiosks, eq(kiosks.id, kioskId)))
      .returning();
    return row;
  }

  async list(params: KioskListParams) {
    const conditions: SQL[] = [];
    if (params.status) {
      conditions.push(eq(kiosks.status, params.status));
    }

    const where = this.tenantScope(kiosks, ...conditions);
    const offset = (params.page - 1) * params.limit;

    const rows = await db
      .select()
      .from(kiosks)
      .where(where)
      .orderBy(asc(kiosks.name))
      .limit(params.limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(kiosks)
      .where(where);

    return { rows, total: Number(total) };
  }

  async findByTokenHash(tokenHash: string) {
    const [row] = await db
      .select()
      .from(kiosks)
      .where(eq(kiosks.tokenHash, tokenHash))
      .limit(1);
    return row;
  }

  async touchLastSeen(kioskId: string, organizationId: string) {
    await db
      .update(kiosks)
      .set({ lastSeenAt: new Date() })
      .where(
        and(eq(kiosks.id, kioskId), eq(kiosks.organizationId, organizationId)),
      );
  }
}
