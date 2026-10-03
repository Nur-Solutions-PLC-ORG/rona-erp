import { eq, sql } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db } from '@/db';
import { organizations, organizationSettings } from '@/db/schemas/admin';
import { TenantScopedRepository } from '@/modules/tenancy/tenant-scoped.repository';

@Injectable()
export class AiTenantRepository extends TenantScopedRepository {
  async fetchTenantName(): Promise<string | null> {
    const [row] = await db
      .select({ name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, this.organizationId))
      .limit(1);
    return row?.name ?? null;
  }

  async fetchCurrency(): Promise<string> {
    const [row] = await db
      .select({ currency: organizationSettings.currency })
      .from(organizationSettings)
      .where(eq(organizationSettings.organizationId, this.organizationId))
      .limit(1);
    return row?.currency ?? 'ETB';
  }

  async healthCheck(): Promise<boolean> {
    const [row] = await db
      .select({ one: sql<number>`1` })
      .from(organizations)
      .where(eq(organizations.id, this.organizationId))
      .limit(1);
    return row != null;
  }
}
