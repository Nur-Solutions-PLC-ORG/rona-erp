import { and, eq, type SQL } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import { TenantContextService } from './tenant-context.service';

interface TenantScopedTable extends PgTable {
  organizationId: PgColumn;
}

export abstract class TenantScopedRepository {
  protected readonly tenantContext: TenantContextService;

  constructor(tenantContext?: TenantContextService) {
    this.tenantContext = tenantContext ?? new TenantContextService();
  }

  protected tenantScope(
    table: TenantScopedTable,
    ...conditions: SQL[]
  ): SQL | undefined {
    const organizationId = this.tenantContext.organizationId;
    const scope = eq(table.organizationId, organizationId);
    if (conditions.length === 0) return scope;
    return and(scope, ...conditions);
  }

  protected get organizationId(): string {
    return this.tenantContext.organizationId;
  }
}
