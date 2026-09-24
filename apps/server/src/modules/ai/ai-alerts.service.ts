import { Injectable } from '@nestjs/common';
import type { AiDataDomain } from '@rona/types/ai';
import type {
  RonaContextBundle,
  SmartAlert,
} from './types/ai-contexts.types.js';

const EFFICIENCY_TARGET_PCT = 95;
const EFFICIENCY_CRITICAL_PCT = 70;
const ABSENTEEISM_ALERT_PCT = 10;

@Injectable()
export class AiAlertsService {
  build(bundle: RonaContextBundle, domains: Set<AiDataDomain>): SmartAlert[] {
    const detectedAt = new Date(`${bundle.period.end}T00:00:00.000Z`);
    const alerts: SmartAlert[] = [];
    let seq = 0;
    const nextId = () => `ALERT-${String(++seq).padStart(3, '0')}`;

    const hrDomain: AiDataDomain = domains.has('attendance')
      ? 'attendance'
      : 'hr';

    if (bundle.hr && (domains.has('hr') || domains.has('attendance'))) {
      const hr = bundle.hr;
      if (hr.absenteeismRatePct >= ABSENTEEISM_ALERT_PCT) {
        alerts.push({
          alertId: nextId(),
          domain: hrDomain,
          severity: 'warning',
          title: 'High absenteeism',
          message: `${hr.absentCount} of ${hr.totalHeadcount} employees absent (${hr.absenteeismRatePct}%).`,
          metricLabel: 'Absenteeism rate',
          metricValue: hr.absenteeismRatePct,
          thresholdValue: ABSENTEEISM_ALERT_PCT,
          entityRef: null,
          detectedAt,
        });
      }
      if (hr.notRecordedCount > 0) {
        alerts.push({
          alertId: nextId(),
          domain: hrDomain,
          severity: 'info',
          title: 'Missing attendance',
          message: `${hr.notRecordedCount} employee(s) have no attendance record.`,
          metricLabel: 'Not recorded',
          metricValue: hr.notRecordedCount,
          thresholdValue: 0,
          entityRef: null,
          detectedAt,
        });
      }
    }

    if (bundle.production && domains.has('production')) {
      const worst = bundle.production.lines.reduce<
        null | (typeof bundle.production.lines)[number]
      >(
        (acc, line) =>
          !acc || line.efficiencyPct < acc.efficiencyPct ? line : acc,
        null,
      );
      if (worst && worst.efficiencyPct < EFFICIENCY_TARGET_PCT) {
        alerts.push({
          alertId: nextId(),
          domain: 'production',
          severity:
            worst.efficiencyPct < EFFICIENCY_CRITICAL_PCT
              ? 'critical'
              : 'warning',
          title: 'Production below target',
          message: `${worst.lineName} (${worst.shift} shift) is at ${worst.efficiencyPct}% efficiency.`,
          metricLabel: 'Efficiency',
          metricValue: worst.efficiencyPct,
          thresholdValue: EFFICIENCY_TARGET_PCT,
          entityRef: worst.lineId,
          detectedAt,
        });
      }
    }

    if (bundle.inventory && domains.has('inventory')) {
      for (const item of bundle.inventory.items) {
        if (!item.needsReorder) continue;
        alerts.push({
          alertId: nextId(),
          domain: 'inventory',
          severity:
            item.stockStatus === 'out_of_stock' ? 'critical' : 'warning',
          title: item.stockStatus === 'low' ? 'Low stock' : 'Out of stock',
          message: `${item.name} is at ${item.quantityOnHand} ${item.unitOfMeasure} (reorder level ${item.reorderLevel}).`,
          metricLabel: 'Quantity on hand',
          metricValue: item.quantityOnHand,
          thresholdValue: item.reorderLevel,
          entityRef: item.itemId,
          detectedAt,
        });
      }
    }

    if (bundle.quality && domains.has('quality')) {
      for (const inspection of bundle.quality.inspections) {
        if (inspection.outcome !== 'rejected') continue;
        alerts.push({
          alertId: nextId(),
          domain: 'quality',
          severity: 'critical',
          title: 'Rejected lot',
          message: `Inspection ${inspection.inspectionId} rejected lot ${inspection.lotNumber ?? ''} for ${inspection.itemType}.`,
          metricLabel: 'Failed tests',
          metricValue: inspection.testsFailed,
          thresholdValue: 0,
          entityRef: inspection.inspectionId,
          detectedAt,
        });
      }
      if (bundle.quality.inProgressCount > 0) {
        alerts.push({
          alertId: nextId(),
          domain: 'quality',
          severity: 'info',
          title: 'Inspections in progress',
          message: `${bundle.quality.inProgressCount} inspection(s) still recording tests.`,
          metricLabel: 'In progress',
          metricValue: bundle.quality.inProgressCount,
          thresholdValue: 0,
          entityRef: null,
          detectedAt,
        });
      }
    }

    if (bundle.finance && domains.has('finance')) {
      for (const invoice of bundle.finance.invoices) {
        if (invoice.status !== 'overdue' || invoice.direction !== 'receivable')
          continue;
        alerts.push({
          alertId: nextId(),
          domain: 'finance',
          severity: 'warning',
          title: 'Overdue invoice',
          message: `Invoice ${invoice.invoiceId} (${invoice.counterparty}) is ${invoice.daysOverdue} day(s) overdue - ${invoice.currency} ${invoice.amountOutstanding.toFixed(2)} outstanding.`,
          metricLabel: 'Days overdue',
          metricValue: invoice.daysOverdue,
          thresholdValue: 0,
          entityRef: invoice.invoiceId,
          detectedAt,
        });
      }
      for (const line of bundle.finance.expenseBreakdown) {
        if (!line.isOverBudget) continue;
        alerts.push({
          alertId: nextId(),
          domain: 'finance',
          severity: 'info',
          title: 'Budget overrun',
          message: `${line.category} is ${line.variancePct}% over budget.`,
          metricLabel: 'Variance',
          metricValue: line.variancePct ?? 0,
          thresholdValue: 0,
          entityRef: null,
          detectedAt,
        });
      }
    }

    return alerts.filter((alert) => domains.has(alert.domain));
  }
}
