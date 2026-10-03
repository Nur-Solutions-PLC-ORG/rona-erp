import type { AiDataDomain } from '@rona/types/ai';
import type { RonaContextBundle } from './types/ai-contexts.types.js';

export function loadedDomains(bundle: RonaContextBundle): AiDataDomain[] {
  const granted = new Set(bundle.grantedDomains);
  const loaded: AiDataDomain[] = [];

  if (bundle.hr) {
    const hrDomains = (['hr', 'attendance'] as AiDataDomain[]).filter((d) =>
      granted.has(d),
    );
    loaded.push(...(hrDomains.length ? hrDomains : (['hr'] as AiDataDomain[])));
  }

  const pairs: Array<[AiDataDomain, unknown]> = [
    ['production', bundle.production],
    ['inventory', bundle.inventory],
    ['quality', bundle.quality],
    ['finance', bundle.finance],
    ['sales', bundle.sales],
    ['organization', bundle.organization],
    ['bom', bundle.bom],
  ];
  for (const [domain, payload] of pairs) {
    if (payload != null) loaded.push(domain);
  }

  return loaded;
}

export function bundleIsEmpty(bundle: RonaContextBundle): boolean {
  return loadedDomains(bundle).length === 0 && bundle.alerts.length === 0;
}

export function truncatedDomains(bundle: RonaContextBundle): AiDataDomain[] {
  const pairs: Array<[AiDataDomain, { recordCountTruncated: boolean } | null]> =
    [
      ['hr', bundle.hr],
      ['production', bundle.production],
      ['inventory', bundle.inventory],
      ['quality', bundle.quality],
      ['finance', bundle.finance],
      ['sales', bundle.sales],
      ['organization', bundle.organization],
      ['bom', bundle.bom],
    ];
  return pairs
    .filter(([, payload]) => payload != null && payload.recordCountTruncated)
    .map(([domain]) => domain);
}

export function assertTenantMatch(
  bundleTenantId: string,
  requestTenantId: string,
): void {
  if (bundleTenantId !== requestTenantId) {
    throw new Error(
      `Tenant isolation violation: adapter returned data for tenant '${bundleTenantId}' while serving a request for '${requestTenantId}'.`,
    );
  }
}

const DETAIL_ROW_FIELDS: Record<string, string[]> = {
  hr: ['records'],
  production: ['lines'],
  inventory: ['items', 'reservations'],
  quality: ['inspections'],
  finance: ['invoices'],
  sales: ['orders', 'customers'],
  organization: ['members'],
  bom: ['boms'],
};

export function applyRecordCap<T extends { domain: string }>(
  context: T,
  maxRecords: number,
): T {
  if (maxRecords <= 0) throw new Error('maxRecords must be positive');

  const fields = DETAIL_ROW_FIELDS[context.domain] ?? [];
  let truncated = false;
  const patch: Record<string, unknown> = {};

  for (const field of fields) {
    const rows = (context as Record<string, unknown>)[field];
    if (Array.isArray(rows) && rows.length > maxRecords) {
      patch[field] = rows.slice(0, maxRecords);
      truncated = true;
    }
  }

  if (!truncated) return context;
  return { ...context, ...patch, recordCountTruncated: true };
}
