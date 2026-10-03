import { Request, buildRoute } from "@/api";
import { DEFAULT_API_URL } from "@rona/config/server";
import {
  API_AI_CHAT_URL,
  API_AI_HEALTH_URL,
  API_AI_REPORT_EXPORT_URL,
  API_AI_REPORT_STATUS_URL,
  API_AI_SUMMARY_URL,
} from "@rona/routes/workspace";
import type {
  AiChatRequest,
  AiChatResult,
  AiHealthResult,
  AiReportRequest,
  AiReportResult,
  AiSummaryResult,
} from "@rona/types/ai";

export const ApiAiChat = Request<AiChatResult, AiChatRequest>(
  "post",
  API_AI_CHAT_URL,
);

export const ApiAiSummary = Request<AiSummaryResult>("get", API_AI_SUMMARY_URL);

export const ApiAiHealth = Request<AiHealthResult>("get", API_AI_HEALTH_URL);

export const ApiAiReportExport = Request<AiReportResult, AiReportRequest>(
  "post",
  API_AI_REPORT_EXPORT_URL,
);

export const ApiAiReportStatus = Request<AiReportResult>(
  "get",
  API_AI_REPORT_STATUS_URL,
);

export function aiReportDownloadUrl(reportId: string): string {
  const path = buildRoute("/api/ai/reports/:reportId/download", {
    slugReplacement: { reportId },
  });
  const base = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
  return `${base}${path}`;
}
