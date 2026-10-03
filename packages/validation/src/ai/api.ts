import { z } from "zod";
import {
  AI_DATA_DOMAIN_LIST,
  AI_DOMAIN_LABELS,
  AI_EXPORT_FORMAT_LIST,
  AI_LANGUAGE_LIST,
  AI_MAX_PERIOD_DAYS,
  AI_REPORT_PERIOD_LIST,
  AI_REPORT_TYPE_LIST,
  AI_SEVERITY_LIST,
  AI_TREND_DIRECTION_LIST,
} from "@rona/config/ai";

export type AiDataDomain = (typeof AI_DATA_DOMAIN_LIST)[number];
export type AiLanguage = (typeof AI_LANGUAGE_LIST)[number];
export type AiSeverity = (typeof AI_SEVERITY_LIST)[number];
export type AiTrendDirection = (typeof AI_TREND_DIRECTION_LIST)[number];
export type AiProductionStatus =
  (typeof import("@rona/config/ai").AI_PRODUCTION_STATUS_LIST)[number];
export type AiStockStatus =
  (typeof import("@rona/config/ai").AI_STOCK_STATUS_LIST)[number];
export type AiMachineStatus =
  (typeof import("@rona/config/ai").AI_MACHINE_STATUS_LIST)[number];
export type AiReportType = (typeof AI_REPORT_TYPE_LIST)[number];
export type AiExportFormat = (typeof AI_EXPORT_FORMAT_LIST)[number];
export type AiReportPeriod = (typeof AI_REPORT_PERIOD_LIST)[number];
export type AiReportJobStatus =
  (typeof import("@rona/config/ai").AI_REPORT_JOB_STATUS_LIST)[number];

export function aiDomainLabel(domain: AiDataDomain): string {
  return AI_DOMAIN_LABELS[domain];
}

export const aiIsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

const periodFields = {
  periodStart: aiIsoDateSchema.optional(),
  periodEnd: aiIsoDateSchema.optional(),
};

const periodSpanCheck = <T extends { periodStart?: string; periodEnd?: string }>(
  value: T,
): boolean => {
  const { periodStart, periodEnd } = value;
  if ((periodStart === undefined) !== (periodEnd === undefined)) return false;
  if (periodStart === undefined || periodEnd === undefined) return true;
  if (periodEnd < periodStart) return false;
  const span =
    (new Date(periodEnd).getTime() - new Date(periodStart).getTime()) / 86_400_000 + 1;
  return span <= AI_MAX_PERIOD_DAYS;
};

const periodSpanMessage =
  'periodStart and periodEnd must be provided together, periodEnd must not ' +
  `be before periodStart, and the span must not exceed ${AI_MAX_PERIOD_DAYS} days`;

export const aiChatRequestSchema = z
  .object({
    ...periodFields,
    question: z.string().trim().min(1).max(1000),
    language: z.enum(AI_LANGUAGE_LIST).optional(),
  })
  .refine(periodSpanCheck, { message: periodSpanMessage });

export type AiChatRequestSchema = z.infer<typeof aiChatRequestSchema>;

export const aiReportRequestSchema = z
  .object({
    ...periodFields,
    reportType: z.enum(AI_REPORT_TYPE_LIST),
    exportFormat: z.enum(AI_EXPORT_FORMAT_LIST).default('pdf'),
    period: z.enum(AI_REPORT_PERIOD_LIST).optional(),
  })
  .refine(periodSpanCheck, { message: periodSpanMessage });

export type AiReportRequestSchema = z.infer<typeof aiReportRequestSchema>;

export const aiSummaryQuerySchema = z.object({
  language: z.enum(AI_LANGUAGE_LIST).optional(),
});

export type AiSummaryQuerySchema = z.infer<typeof aiSummaryQuerySchema>;

export interface AiSupportingMetric {
  label: string;
  value: string;
  unit?: string | null;
  comparison?: string | null;
}

export interface AiKbCitation {
  documentId: string;
  title: string;
  version: number;
  chunkId: string;
  section: string;
  domain: AiDataDomain;
}

export interface AiChatResponse {
  answer: string;
  supportingData: AiSupportingMetric[];
  recommendation: string | null;
  source: string[];
  sourceDomains: AiDataDomain[];
  kbCitations: AiKbCitation[];
  dataAvailable: boolean;
  tenantId: string;
  userRole: string;
  periodLabel: string;
  generatedAt: string;
  sourceSystem: string;
  partialData: boolean;
}

export interface AiMetricItem {
  key: string;
  label: string;
  value: string;
  numericValue?: number | null;
  unit?: string | null;
}

export interface AiMetricGroup {
  domain: AiDataDomain;
  label: string;
  metrics: AiMetricItem[];
}

export interface AiAlertOut {
  alertId: string;
  domain: AiDataDomain;
  severity: AiSeverity;
  title: string;
  message: string;
  metricLabel: string;
  metricValue: number;
  thresholdValue?: number | null;
  entityRef?: string | null;
  detectedAt: string;
}

export interface AiPendingTaskOut {
  taskId: string;
  domain: AiDataDomain;
  title: string;
  dueDate?: string | null;
  isOverdue: boolean;
  assignedTo?: string | null;
}

export interface AiSummaryResponse {
  greeting: string;
  tenantId: string;
  tenantName?: string | null;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  metrics: AiMetricGroup[];
  alerts: AiAlertOut[];
  pendingTasks: AiPendingTaskOut[];
  grantedDomains: AiDataDomain[];
  deniedDomains: AiDataDomain[];
  unavailableDomains: AiDataDomain[];
  generatedAt: string;
  sourceSystem: string;
}

export interface AiReportResponse {
  reportId: string;
  status: (typeof import("@rona/config/ai").AI_REPORT_JOB_STATUS_LIST)[number];
  reportType: AiReportType;
  exportFormat: AiExportFormat;
  periodLabel: string;
  filename?: string | null;
  byteSize?: number | null;
  downloadUrl?: string | null;
  generatedAt: string;
  message?: string | null;
}

export interface AiHealthResponse {
  status: "ok" | "degraded";
  llmConfigured: boolean;
  dataSourceReachable: boolean;
}
