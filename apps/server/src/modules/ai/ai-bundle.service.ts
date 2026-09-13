import { Injectable, Logger } from '@nestjs/common';
import {
  AI_DATA_DOMAIN_LIST,
  AI_FULL_ACCESS_ROLE_KEYS,
  AI_MAX_CONTEXT_RECORDS_PER_DOMAIN,
  AI_DOMAIN_REQUIRED_PERMISSIONS,
  AI_DOMAIN_REQUIRED_MODULES,
} from '@rona/config/ai';
import type { AiDataDomain } from '@rona/types/ai';
import type { Permission } from '@rona/types/tenancy';
import type {
  RonaContextBundle,
  PeriodSpec,
  PendingTask,
  CanonicalContext,
} from './types/ai-contexts.types.js';
import { applyRecordCap, assertTenantMatch } from './ai-bundle.utils.js';
import { AiAlertsService } from './ai-alerts.service.js';
import {
  AiHrRepository,
  AiProductionRepository,
  AiInventoryRepository,
  AiQualityRepository,
  AiFinanceRepository,
  AiSalesRepository,
  AiTenantRepository,
  AiOrganizationRepository,
  AiBomRepository,
} from './data/index.js';

export interface AiAuthContext {
  tenantId: string;
  userId: string;
  roles: string[];
  grantedDomains: AiDataDomain[];
  deniedDomains: AiDataDomain[];
  language?: 'en' | 'am' | 'om';
}

export function resolveDomainsFromPermissions(
  permissions: string[],
  roles: string[] = [],
  modules: string[] = [],
): {
  granted: AiDataDomain[];
  denied: AiDataDomain[];
} {
  const allowedModules = new Set(modules);

  let granted: AiDataDomain[];
  if (
    roles.some((role) =>
      (AI_FULL_ACCESS_ROLE_KEYS as readonly string[]).includes(role),
    )
  ) {
    granted = [...AI_DATA_DOMAIN_LIST] as AiDataDomain[];
  } else {
    const set = new Set(permissions);
    granted = [];
    const domainEntries = Object.entries(
      AI_DOMAIN_REQUIRED_PERMISSIONS,
    ) as Array<[AiDataDomain, Permission[]]>;
    for (const [domain, required] of domainEntries) {
      if (required.every((p) => set.has(p))) {
        granted.push(domain);
      }
    }
  }

  if (allowedModules.size > 0) {
    granted = granted.filter((domain) => {
      const requiredModule = AI_DOMAIN_REQUIRED_MODULES[domain];
      return requiredModule == null || allowedModules.has(requiredModule);
    });
  }

  const dataDomains = granted.filter((domain) => domain !== 'reports');
  granted = dataDomains.length > 0 ? [...dataDomains, 'reports'] : [];

  const allDomains = [...AI_DATA_DOMAIN_LIST] as AiDataDomain[];
  const denied = allDomains.filter((domain) => !granted.includes(domain));

  return { granted, denied };
}

export interface BuildBundleArgs {
  auth: AiAuthContext;
  period: PeriodSpec;
  tenantName: string;
  includeAlerts?: boolean;
  includePendingTasks?: boolean;
}

@Injectable()
export class AiBundleService {
  private readonly logger = new Logger(AiBundleService.name);

  constructor(
    private readonly tenantRepo: AiTenantRepository,
    private readonly hrRepo: AiHrRepository,
    private readonly productionRepo: AiProductionRepository,
    private readonly inventoryRepo: AiInventoryRepository,
    private readonly qualityRepo: AiQualityRepository,
    private readonly financeRepo: AiFinanceRepository,
    private readonly salesRepo: AiSalesRepository,
    private readonly organizationRepo: AiOrganizationRepository,
    private readonly bomRepo: AiBomRepository,
    private readonly alertsService: AiAlertsService,
  ) {}

  async fetchTenantName(): Promise<string | null> {
    return this.tenantRepo.fetchTenantName();
  }

  async buildBundle(args: BuildBundleArgs): Promise<RonaContextBundle> {
    const { auth, period, tenantName } = args;
    const granted = auth.grantedDomains;
    const denied = auth.deniedDomains;

    const fetchers = this.routeFetchers(granted);
    const results = await Promise.allSettled(
      fetchers.map((f) => f.fetch(period)),
    );

    const bundle: RonaContextBundle = {
      tenantId: auth.tenantId,
      tenantName,
      userRole: 'member',
      language: auth.language ?? 'en',
      grantedDomains: granted,
      deniedDomains: denied,
      period,
      generatedAt: new Date(),
      failedDomains: [],
      hr: null,
      production: null,
      inventory: null,
      quality: null,
      finance: null,
      sales: null,
      organization: null,
      bom: null,
      alerts: [],
      pendingTasks: [],
    };

    for (let i = 0; i < results.length; i += 1) {
      const { domain, key } = fetchers[i];
      const result = results[i];
      if (result.status !== 'fulfilled') {
        bundle.failedDomains.push(domain);
        this.logger.warn(
          `AI context fetch failed domain=${domain}: ${String(result.reason)}`,
        );
        continue;
      }
      assertTenantMatch(result.value.tenantId, auth.tenantId);
      (bundle as unknown as Record<string, unknown>)[key] = applyRecordCap(
        result.value,
        AI_MAX_CONTEXT_RECORDS_PER_DOMAIN,
      );
    }

    if (args.includeAlerts !== false && granted.length > 0) {
      try {
        bundle.alerts = this.alertsService.build(bundle, new Set(granted));
      } catch (error) {
        this.logger.warn(`Alert build failed: ${String(error)}`);
      }
    }

    if (args.includePendingTasks && granted.length > 0) {
      bundle.pendingTasks = this.buildPendingTasks(bundle, new Set(granted));
    }

    return bundle;
  }

  private routeFetchers(granted: AiDataDomain[]): Array<{
    domain: AiDataDomain;
    key: keyof RonaContextBundle;
    fetch: (p: PeriodSpec) => Promise<CanonicalContext>;
  }> {
    const fetchers: Array<{
      domain: AiDataDomain;
      key: keyof RonaContextBundle;
      fetch: (p: PeriodSpec) => Promise<CanonicalContext>;
    }> = [];

    const needsHr = granted.includes('hr') || granted.includes('attendance');
    if (needsHr) {
      fetchers.push({
        domain: 'hr',
        key: 'hr',
        fetch: (p) => this.hrRepo.fetchHr(p),
      });
    }
    if (granted.includes('production')) {
      fetchers.push({
        domain: 'production',
        key: 'production',
        fetch: (p) => this.productionRepo.fetchProduction(p),
      });
    }
    if (granted.includes('inventory')) {
      fetchers.push({
        domain: 'inventory',
        key: 'inventory',
        fetch: (p) => this.inventoryRepo.fetchInventory(p),
      });
    }
    if (granted.includes('quality')) {
      fetchers.push({
        domain: 'quality',
        key: 'quality',
        fetch: (p) => this.qualityRepo.fetchQuality(p),
      });
    }
    if (granted.includes('finance')) {
      fetchers.push({
        domain: 'finance',
        key: 'finance',
        fetch: (p) => this.financeRepo.fetchFinance(p),
      });
    }
    if (granted.includes('sales')) {
      fetchers.push({
        domain: 'sales',
        key: 'sales',
        fetch: (p) => this.salesRepo.fetchSales(p),
      });
    }
    if (granted.includes('organization')) {
      fetchers.push({
        domain: 'organization',
        key: 'organization',
        fetch: (p) => this.organizationRepo.fetchOrganization(p),
      });
    }
    if (granted.includes('bom')) {
      fetchers.push({
        domain: 'bom',
        key: 'bom',
        fetch: (p) => this.bomRepo.fetchBom(p),
      });
    }

    return fetchers;
  }

  private buildPendingTasks(
    bundle: RonaContextBundle,
    domains: Set<AiDataDomain>,
  ): PendingTask[] {
    const tasks: PendingTask[] = [];
    const asOf = bundle.period.end;

    if ((domains.has('hr') || domains.has('attendance')) && bundle.hr) {
      if (bundle.hr.employeesOnOvertime > 0) {
        tasks.push({
          taskId: 'TASK-H-overtime',
          domain: 'hr',
          title: `Review ${bundle.hr.employeesOnOvertime} overtime request(s)`,
          dueDate: shiftDate(asOf, 2),
          isOverdue: false,
          assignedTo: null,
        });
      }
    }

    return tasks.filter((task) => domains.has(task.domain));
  }
}

function shiftDate(isoDate: string, days: number): string {
  return new Date(new Date(isoDate).getTime() + days * 86_400_000)
    .toISOString()
    .slice(0, 10);
}
