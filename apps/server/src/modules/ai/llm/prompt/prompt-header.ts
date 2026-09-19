import { AI_MAX_PROMPT_ROWS } from '@rona/config/ai';
import { aiDomainLabel } from '@rona/types/ai';
import { toIsoDate } from '../../ai-periods.utils.js';
import { ethiopianDayLabel } from '../../ethiopian-date.js';
import type { RonaContextBundle } from '../../types/ai-contexts.types.js';

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  am: 'Amharic',
  om: 'Afaan Oromo',
};

export function headerLines(bundle: RonaContextBundle): string[] {
  const lines = ['CONTEXT', '======='];
  lines.push(`Tenant: ${bundle.tenantName ?? bundle.tenantId}`);

  const language = LANGUAGE_NAMES[bundle.language] ?? bundle.language;
  lines.push(
    `RESPONSE LANGUAGE: ${language}. Always write the answer, recommendation, and supporting-data labels in this language, even when the user writes the question in another language.`,
  );

  lines.push(
    `Reporting period: ${bundle.period.label} (${bundle.period.start} to ${bundle.period.end})`,
  );
  lines.push(`Data fetched at: ${bundle.generatedAt.toISOString()}`);
  const today = new Date(bundle.generatedAt);
  lines.push(`Today (Gregorian): ${toIsoDate(today)}`);
  if (bundle.language === 'am') {
    lines.push(`Today (Ethiopian): ${ethiopianDayLabel(today)}`);
    lines.push(
      'DATE/TIME CONVENTION: Write every date in the Ethiopian calendar ' +
        `(today is ${ethiopianDayLabel(today)}) and every time using the ` +
        'Ethiopian 12-hour clock, which starts the day at 6:00 AM, so 7:00 AM ' +
        "is 1 o'clock, 1:00 PM is 7 o'clock and 6:00 AM is 12 o'clock.",
    );
  }
  lines.push(...availabilityLines(bundle));
  return lines;
}

function availabilityLines(bundle: RonaContextBundle): string[] {
  const lines: string[] = [];
  const labels = (domains: typeof bundle.grantedDomains) =>
    domains.map(aiDomainLabel).join(', ');

  if (bundle.grantedDomains.length) {
    lines.push(`Accessible modules: ${labels(bundle.grantedDomains)}`);
  }
  if (bundle.deniedDomains.length) {
    lines.push(
      `Restricted modules (do NOT answer from these; say access is denied): ${labels(bundle.deniedDomains)}`,
    );
  }
  if (bundle.failedDomains.length) {
    lines.push(
      `Temporarily unavailable modules (data could not be retrieved): ${labels(bundle.failedDomains)}`,
    );
  }

  const truncated = truncatedLabel(bundle);
  if (truncated) {
    lines.push(
      `NOTE: example rows for ${truncated} are a partial sample; the totals above them are complete.`,
    );
  }
  return lines;
}

function truncatedLabel(bundle: RonaContextBundle): string | null {
  const pairs: Array<[string, { recordCountTruncated: boolean } | null]> = [
    ['HR & Attendance', bundle.hr],
    ['Production', bundle.production],
    ['Inventory', bundle.inventory],
    ['Finance', bundle.finance],
    ['Sales', bundle.sales],
  ];
  const truncated = pairs
    .filter(([, payload]) => payload != null && payload.recordCountTruncated)
    .map(([label]) => label);
  return truncated.length ? truncated.join(', ') : null;
}

export const PROMPT_MAX_ROWS = AI_MAX_PROMPT_ROWS;

export function formatMoney(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatNumber(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : String(Math.round(value * 1000) / 1000);
}
