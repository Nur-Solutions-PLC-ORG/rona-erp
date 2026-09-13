import { Injectable } from '@nestjs/common';
import type {
  AiChatRequest,
  AiDataDomain,
  AiReportRequest,
  AiAlertOut,
  AiMetricGroup,
  AiPendingTaskOut,
} from '@rona/types/ai';
import { aiDomainLabel } from '@rona/types/ai';
import { AI_REPORT_JOB_MAX_ATTEMPTS } from '@rona/config/ai';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import {
  AiDataSourceException,
  AiDomainAccessException,
  AiLlmUnavailableException,
  AiNotConfiguredException,
  AiReportNotReadyException,
} from './ai.exception.js';
import {
  AiBundleService,
  resolveDomainsFromPermissions,
} from './ai-bundle.service.js';
import { AiLlmService, LlmQuotaError } from './llm/ai-llm.service.js';
import { AiLimitService } from './ai-limit.service.js';
import { REPORT_REQUIRED_DOMAIN } from './reports/report-models.js';
import { AiReportJobsRepository } from './reports/ai-report-jobs.repository.js';
import { AiReportStorageService } from './reports/ai-report-storage.service.js';
import { bundleIsEmpty, truncatedDomains } from './ai-bundle.utils.js';
import { periodFromPreset, resolvePeriod } from './ai-periods.utils.js';
import type { RonaContextBundle } from './types/ai-contexts.types.js';

@Injectable()
export class AiService {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly bundleService: AiBundleService,
    private readonly llm: AiLlmService,
    private readonly limit: AiLimitService,
    private readonly reportJobs: AiReportJobsRepository,
    private readonly reportStorage: AiReportStorageService,
  ) {}

  private async resolveTenantName(): Promise<string> {
    const name = await this.bundleService.fetchTenantName();
    return name ?? this.tenantContext.organizationId;
  }

  private authContext(language?: AiChatRequest['language']) {
    const { granted, denied } = resolveDomainsFromPermissions(
      this.tenantContext.permissions,
      this.tenantContext.roles,
      this.tenantContext.modules,
    );
    return {
      tenantId: this.tenantContext.organizationId,
      userId: this.tenantContext.userId,
      roles: this.tenantContext.roles,
      grantedDomains: granted,
      deniedDomains: denied,
      language,
    };
  }

  async chat(request: AiChatRequest) {
    const auth = this.authContext(request.language);
    const period = resolvePeriod({
      periodStart: request.periodStart,
      periodEnd: request.periodEnd,
      defaultMonth: false,
      question: request.question,
    });

    await this.limit.consume(auth.tenantId);

    const bundle = await this.bundleService.buildBundle({
      auth,
      period,
      tenantName: await this.resolveTenantName(),
      includePendingTasks: false,
    });

    const generatedAt = new Date();
    const sourceSystem = 'rona-erp';

    if (bundleIsEmpty(bundle)) {
      return {
        answer: 'You do not have access to any data for this request.',
        supportingData: [],
        recommendation: null,
        source: [],
        sourceDomains: [],
        kbCitations: [],
        dataAvailable: false,
        tenantId: auth.tenantId,
        userRole: 'member',
        periodLabel: period.label,
        generatedAt: generatedAt.toISOString(),
        sourceSystem,
        partialData: bundle.failedDomains.length > 0,
      };
    }

    if (!this.llm.isConfigured) {
      throw new AiNotConfiguredException();
    }

    const response = await this.generate(request.question, bundle);

    return {
      answer: response.answer,
      supportingData: response.supportingData,
      recommendation: response.recommendation,
      source: response.source.map((domain) => aiDomainLabel(domain)),
      sourceDomains: response.source,
      kbCitations: response.kbCitations,
      dataAvailable: response.dataAvailable,
      tenantId: auth.tenantId,
      userRole: 'member',
      periodLabel: period.label,
      generatedAt: generatedAt.toISOString(),
      sourceSystem,
      partialData:
        bundle.failedDomains.length > 0 || truncatedDomains(bundle).length > 0,
    };
  }

  private async generate(question: string, bundle: RonaContextBundle) {
    try {
      return await this.llm.generateResponse(question, bundle);
    } catch (error) {
      if (error instanceof LlmQuotaError) {
        throw new (await import('./ai.exception.js')).AiQuotaExhaustedException(
          error.retryAfterSeconds ?? undefined,
        );
      }
      throw new AiLlmUnavailableException();
    }
  }

  async summary() {
    const auth = this.authContext();
    const period = resolvePeriod({ defaultMonth: false });

    const bundle = await this.bundleService.buildBundle({
      auth,
      period,
      tenantName: await this.resolveTenantName(),
      includePendingTasks: true,
    });

    return {
      greeting: greeting(new Date()),
      tenantId: auth.tenantId,
      tenantName: bundle.tenantName,
      periodLabel: period.label,
      periodStart: period.start,
      periodEnd: period.end,
      metrics: buildMetricGroups(bundle),
      alerts: bundle.alerts.map(toAlertOut),
      pendingTasks: bundle.pendingTasks.map(toTaskOut),
      grantedDomains: bundle.grantedDomains,
      deniedDomains: bundle.deniedDomains,
      unavailableDomains: bundle.failedDomains,
      generatedAt: bundle.generatedAt.toISOString(),
      sourceSystem: 'rona-erp',
    };
  }

  async exportReport(request: AiReportRequest) {
    const auth = this.authContext();

    const requiredDomain = REPORT_REQUIRED_DOMAIN[request.reportType];
    if (
      requiredDomain &&
      !auth.grantedDomains.includes(requiredDomain as AiDataDomain)
    ) {
      throw new AiDomainAccessException(
        aiDomainLabel(requiredDomain as AiDataDomain),
      );
    }

    const period =
      request.periodStart != null && request.periodEnd != null
        ? resolvePeriod({
            periodStart: request.periodStart,
            periodEnd: request.periodEnd,
            defaultMonth: true,
          })
        : request.period
          ? periodFromPreset(request.period)
          : resolvePeriod({ defaultMonth: true });

    const bundle = await this.bundleService.buildBundle({
      auth,
      period,
      tenantName: await this.resolveTenantName(),
      includePendingTasks: true,
    });

    const reportId = `RPT-${request.reportType}-${randomHex()}`;
    const job = await this.reportJobs.create({
      reportId,
      organizationId: auth.tenantId,
      requestedBy: auth.userId,
      reportType: request.reportType,
      exportFormat: request.exportFormat,
      periodLabel: period.label,
      payload: bundle,
      authorizedDomains: auth.grantedDomains,
      maxAttempts: AI_REPORT_JOB_MAX_ATTEMPTS,
    });

    return this.toReportResult(job, 'Report queued for generation.');
  }

  async reportStatus(reportId: string) {
    const auth = this.authContext();
    const job = await this.authorizedJob(reportId, auth);
    return this.toReportResult(job);
  }

  async downloadReport(reportId: string): Promise<{
    filename: string;
    mediaType: string;
    data: Buffer;
  }> {
    const auth = this.authContext();
    const job = await this.authorizedJob(reportId, auth);

    if (job.status !== 'ready' || !job.storageKey || !job.filename) {
      throw new AiReportNotReadyException();
    }

    let data: Buffer;
    try {
      data = await this.reportStorage.get(job.storageKey);
    } catch {
      throw new AiDataSourceException();
    }

    return {
      filename: job.filename,
      mediaType: mediaType(job.exportFormat),
      data,
    };
  }

  private async authorizedJob(
    reportId: string,
    auth: ReturnType<AiService['authContext']>,
  ) {
    const job = await this.reportJobs.get(reportId, auth.tenantId);
    if (!job || job.requestedBy !== auth.userId) {
      throw new AiReportNotReadyException();
    }
    const snapshot = new Set(job.authorizedDomains);
    for (const domain of snapshot) {
      if (!auth.grantedDomains.includes(domain as AiDataDomain)) {
        throw new AiReportNotReadyException();
      }
    }
    return job;
  }

  private toReportResult(
    job: Awaited<ReturnType<AiReportJobsRepository['get']>>,
    message?: string,
  ) {
    if (!job) throw new AiReportNotReadyException();
    const ready = job.status === 'ready';
    return {
      reportId: job.id,
      status: job.status,
      reportType: job.reportType,
      exportFormat: job.exportFormat,
      periodLabel: job.periodLabel,
      filename: ready ? job.filename : null,
      byteSize: ready ? job.byteSize : null,
      downloadUrl: ready ? `/api/ai/reports/${job.id}/download` : null,
      generatedAt: (job.completedAt ?? job.createdAt).toISOString(),
      message: message ?? job.errorMessage,
    };
  }
}

function greeting(now: Date): string {
  const hour = now.getUTCHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function toAlertOut(alert: RonaContextBundle['alerts'][number]): AiAlertOut {
  return {
    alertId: alert.alertId,
    domain: alert.domain,
    severity: alert.severity,
    title: alert.title,
    message: alert.message,
    metricLabel: alert.metricLabel,
    metricValue: alert.metricValue,
    thresholdValue: alert.thresholdValue,
    entityRef: alert.entityRef,
    detectedAt: alert.detectedAt.toISOString(),
  };
}

function toTaskOut(
  task: RonaContextBundle['pendingTasks'][number],
): AiPendingTaskOut {
  return {
    taskId: task.taskId,
    domain: task.domain,
    title: task.title,
    dueDate: task.dueDate,
    isOverdue: task.isOverdue,
    assignedTo: task.assignedTo,
  };
}

function buildMetricGroups(bundle: RonaContextBundle): AiMetricGroup[] {
  const groups: AiMetricGroup[] = [];
  const group = (domain: AiDataDomain, metrics: AiMetricGroup['metrics']) =>
    groups.push({ domain, label: aiDomainLabel(domain), metrics });

  if (bundle.hr) {
    group('hr', [
      metric(
        'present_count',
        'Present',
        String(bundle.hr.presentCount),
        bundle.hr.presentCount,
      ),
      metric(
        'absent_count',
        'Absent',
        String(bundle.hr.absentCount),
        bundle.hr.absentCount,
      ),
      metric(
        'attendance_rate_pct',
        'Attendance rate',
        `${bundle.hr.attendanceRatePct}%`,
        bundle.hr.attendanceRatePct,
        '%',
      ),
      metric(
        'total_overtime_hours',
        'Overtime',
        `${bundle.hr.totalOvertimeHours} h`,
        bundle.hr.totalOvertimeHours,
        'h',
      ),
    ]);
  }
  if (bundle.production) {
    group('production', [
      metric(
        'overall_efficiency_pct',
        'Efficiency',
        `${bundle.production.overallEfficiencyPct}%`,
        bundle.production.overallEfficiencyPct,
        '%',
      ),
      metric(
        'target_achievement_pct',
        'Target achievement',
        `${bundle.production.targetAchievementPct}%`,
        bundle.production.targetAchievementPct,
        '%',
      ),
      metricItem('overall_status', 'Status', bundle.production.overallStatus),
    ]);
  }
  if (bundle.inventory) {
    group('inventory', [
      metric(
        'total_inventory_value',
        'Total value',
        `${bundle.inventory.currency} ${bundle.inventory.totalInventoryValue.toFixed(2)}`,
        bundle.inventory.totalInventoryValue,
        bundle.inventory.currency,
      ),
      metric(
        'low_stock_count',
        'Low stock',
        String(bundle.inventory.lowStockCount),
        bundle.inventory.lowStockCount,
      ),
      metric(
        'out_of_stock_count',
        'Out of stock',
        String(bundle.inventory.outOfStockCount),
        bundle.inventory.outOfStockCount,
      ),
    ]);
  }
  if (bundle.quality) {
    group('quality', [
      metric(
        'total_inspections',
        'Inspections',
        String(bundle.quality.totalInspectionCount),
        bundle.quality.totalInspectionCount,
      ),
      metric(
        'pass_rate_pct',
        'Pass rate',
        `${bundle.quality.passRatePct}%`,
        bundle.quality.passRatePct,
        '%',
      ),
      metric(
        'rejected_lots',
        'Rejected lots',
        String(bundle.quality.rejectedLotCount),
        bundle.quality.rejectedLotCount,
      ),
    ]);
  }
  if (bundle.finance) {
    group('finance', [
      metric(
        'revenue',
        'Revenue',
        `${bundle.finance.currency} ${bundle.finance.revenue.toFixed(2)}`,
        bundle.finance.revenue,
        bundle.finance.currency,
      ),
      metric(
        'net_profit',
        'Net profit',
        `${bundle.finance.currency} ${bundle.finance.netProfit.toFixed(2)}`,
        bundle.finance.netProfit,
        bundle.finance.currency,
      ),
      metric(
        'profit_margin_pct',
        'Profit margin',
        `${bundle.finance.profitMarginPct}%`,
        bundle.finance.profitMarginPct,
        '%',
      ),
    ]);
  }
  if (bundle.sales) {
    group('sales', [
      metric(
        'total_revenue',
        'Revenue',
        `${bundle.sales.currency} ${bundle.sales.totalRevenue.toFixed(2)}`,
        bundle.sales.totalRevenue,
        bundle.sales.currency,
      ),
      metric(
        'total_order_count',
        'Orders',
        String(bundle.sales.totalOrderCount),
        bundle.sales.totalOrderCount,
      ),
      metric(
        'overdue_count',
        'Overdue orders',
        String(bundle.sales.overdueCount),
        bundle.sales.overdueCount,
      ),
    ]);
  }
  if (bundle.organization) {
    group('organization', [
      metric(
        'active_member_count',
        'Active members',
        String(bundle.organization.activeMemberCount),
        bundle.organization.activeMemberCount,
      ),
      metric(
        'department_count',
        'Departments',
        String(bundle.organization.departmentCount),
        bundle.organization.departmentCount,
      ),
      metric(
        'branch_count',
        'Branches',
        String(bundle.organization.branchCount),
        bundle.organization.branchCount,
      ),
    ]);
  }
  if (bundle.bom) {
    group('bom', [
      metric(
        'total_bom_count',
        'BOMs',
        String(bundle.bom.totalBomCount),
        bundle.bom.totalBomCount,
      ),
      metric(
        'approved_bom_count',
        'Approved',
        String(bundle.bom.approvedCount),
        bundle.bom.approvedCount,
      ),
    ]);
  }
  return groups;
}

function metric(
  key: string,
  label: string,
  value: string,
  numericValue: number,
  unit?: string,
): AiMetricGroup['metrics'][number] {
  return { key, label, value, numericValue, unit: unit ?? null };
}

function metricItem(
  key: string,
  label: string,
  value: string,
): AiMetricGroup['metrics'][number] {
  return { key, label, value, numericValue: null, unit: null };
}

function mediaType(format: string): string {
  switch (format) {
    case 'pdf':
      return 'application/pdf';
    case 'excel':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'json':
      return 'application/json';
    default:
      return 'application/octet-stream';
  }
}

function randomHex(): string {
  return Array.from({ length: 12 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join('');
}
