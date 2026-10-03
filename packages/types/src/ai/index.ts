import type { z } from "zod";
import type {
  aiChatRequestSchema,
  aiReportRequestSchema,
} from "@rona/validation/ai";
import {
  AiChatResponse,
  AiHealthResponse,
  AiReportResponse,
  AiSummaryResponse,
} from "@rona/validation/ai";

export type AiChatRequest = z.infer<typeof aiChatRequestSchema>;
export type AiReportRequest = z.infer<typeof aiReportRequestSchema>;

export type AiChatResult = AiChatResponse;
export type AiSummaryResult = AiSummaryResponse;
export type AiReportResult = AiReportResponse;
export type AiHealthResult = AiHealthResponse;

export type {
  AiDataDomain,
  AiLanguage,
  AiSeverity,
  AiTrendDirection,
  AiProductionStatus,
  AiStockStatus,
  AiMachineStatus,
  AiReportType,
  AiReportPeriod,
  AiExportFormat,
  AiReportJobStatus,
  AiSupportingMetric,
  AiKbCitation,
  AiChatResponse,
  AiMetricItem,
  AiMetricGroup,
  AiAlertOut,
  AiPendingTaskOut,
  AiSummaryResponse,
  AiReportResponse,
  AiHealthResponse,
} from "@rona/validation/ai";
export { aiDomainLabel } from "@rona/validation/ai";
