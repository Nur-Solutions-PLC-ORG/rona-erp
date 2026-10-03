import { aiDomainLabel } from '@rona/types/ai';
import type { RonaContextBundle } from '../../types/ai-contexts.types.js';
import { PROMPT_MAX_ROWS } from './prompt-header.js';

export function alertLines(bundle: RonaContextBundle): string[] {
  if (!bundle.alerts.length) return [];

  const lines = [
    `\nALERTS FOR REPORTING PERIOD ${bundle.period.label} (cite the module in parentheses as a source)`,
  ];
  for (const alert of bundle.alerts.slice(0, PROMPT_MAX_ROWS)) {
    const entity = alert.entityRef ? ` (${alert.entityRef})` : '';
    lines.push(
      `- [${alert.severity}] ${alert.title} (${aiDomainLabel(alert.domain)})${entity}: ${alert.message}`,
    );
    const threshold =
      alert.thresholdValue != null
        ? ` (threshold ${alert.thresholdValue})`
        : '';
    lines.push(
      `    metric=${alert.metricLabel}=${alert.metricValue}${threshold}`,
    );
  }
  return lines;
}

export function trendsLines(
  payload: {
    trends: Array<{
      metricLabel: string;
      currentValue: number;
      previousValue: number;
      changePct: number;
      direction: string;
      previousPeriodLabel: string;
    }>;
  },
  domainName: string,
): string[] {
  if (!payload.trends.length) return [];
  const lines = [
    `\n${domainName} trends (current vs ${payload.trends[0].previousPeriodLabel}):`,
  ];
  for (const trend of payload.trends.slice(0, PROMPT_MAX_ROWS)) {
    const arrow = trend.changePct >= 0 ? '+' : '';
    lines.push(
      `  - ${trend.metricLabel}: ${trend.currentValue} vs ${trend.previousValue} (${arrow}${trend.changePct}%, ${trend.direction})`,
    );
  }
  return lines;
}
