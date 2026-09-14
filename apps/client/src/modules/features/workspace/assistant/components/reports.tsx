"use client";

import { useState } from "react";
import {
  HiOutlineArrowDownTray,
  HiOutlineCalendarDays,
  HiOutlineDocumentChartBar,
} from "react-icons/hi2";
import {
  AiOutlineFileExcel,
  AiOutlineFilePdf,
  AiOutlineFileText,
} from "react-icons/ai";
import {
  AI_REPORT_PERIOD_LABELS,
  AI_REPORT_PERIOD_LIST,
} from "@rona/config/ai";
import { Card } from "@/modules/workspace/components/ui";
import Dropdown from "@/components/custom/dropdown";
import Spinner from "@/components/custom/spinner";
import { Skeleton } from "@/components/custom/skeleton";
import { aiReportDownloadUrl } from "../api";
import { useAiReportExport, useAiReportStatus } from "../hooks";
import type { AiReportResult } from "@rona/types/ai";

const REPORT_TYPES = [
  {
    label: "Management summary",
    value: "management_summary",
    desc: "Cross-module overview with key metrics",
  },
  { label: "Attendance", value: "attendance", desc: "Presence, lateness and overtime" },
  { label: "Production", value: "production", desc: "Output, efficiency and downtime" },
  {
    label: "Inventory valuation",
    value: "inventory_valuation",
    desc: "Stock on hand and total value",
  },
  { label: "Quality", value: "quality", desc: "Inspections and pass rate" },
  { label: "Sales", value: "sales", desc: "Orders, revenue and top products" },
  { label: "Finance", value: "finance", desc: "Profit, receivables and invoices" },
] as const;

const EXPORT_FORMATS = [
  {
    label: "PDF",
    value: "pdf",
    icon: AiOutlineFilePdf,
    desc: "Print-ready document",
  },
  {
    label: "Excel",
    value: "excel",
    icon: AiOutlineFileExcel,
    desc: "Spreadsheet workbook",
  },
  {
    label: "JSON",
    value: "json",
    icon: AiOutlineFileText,
    desc: "Raw data for integrations",
  },
] as const;

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  processing: "bg-sky-50 text-sky-800 border-sky-200",
  ready: "bg-emerald-50 text-emerald-800 border-emerald-200",
  failed: "bg-rose-50 text-rose-800 border-rose-200",
};

function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null) return "N/A";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatIsoDay(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export function AiReportsPanel() {
  const [reportType, setReportType] = useState<string>("management_summary");
  const [exportFormat, setExportFormat] = useState<string>("pdf");
  const [period, setPeriod] = useState<string>("this_week");
  const [customStart, setCustomStart] = useState<string>(formatIsoDay(-6));
  const [customEnd, setCustomEnd] = useState<string>(formatIsoDay(0));
  const [activeJob, setActiveJob] = useState<AiReportResult | null>(null);

  const exportReport = useAiReportExport();

  const { report: polled } = useAiReportStatus(
    activeJob && !isSettledState(activeJob) ? activeJob.reportId : null,
    false,
  );

  const job = polled ?? activeJob;

  const selectedFormat = EXPORT_FORMATS.find(
    (format) => format.value === exportFormat,
  );

  const submit = () => {
    const isCustom = period === "custom";
    exportReport.mutate(
      {
        reportType: reportType as AiReportResult["reportType"],
        exportFormat: exportFormat as AiReportResult["exportFormat"],
        ...(isCustom ? { periodStart: customStart, periodEnd: customEnd } : {}),
        ...(!isCustom ? { period: period as "this_week" } : {}),
      },
      {
        onSuccess: (data) => {
          setActiveJob(data.data ?? null);
        },
      },
    );
  };

  const periodLabel =
    period === "custom"
      ? "Custom Range"
      : AI_REPORT_PERIOD_LABELS[period as keyof typeof AI_REPORT_PERIOD_LABELS];

  return (
    <section aria-label="Report generation">
      <Card className="rounded-xl shadow-sm">
        <header className="flex items-center gap-2.5 border-b border-slate-200 px-5 py-3.5">
          <HiOutlineDocumentChartBar className="h-4 w-4 shrink-0 text-slate-400" />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900">
              Report generation
            </h2>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              Comprehensive exports for any business window — daily, weekly,
              monthly or a custom range.
            </p>
          </div>
        </header>

        <div className="space-y-4 px-5 py-5">
          <Dropdown
            label="Report type"
            name="report-type"
            options={REPORT_TYPES.map(({ label, value }) => ({
              label,
              value,
            }))}
            value={reportType}
            onChange={setReportType}
            placeholder="Choose a report"
            disabled={exportReport.isPending}
            className="h-11"
          />

          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-600">Period</p>
            <div className="flex flex-wrap gap-1.5">
              {AI_REPORT_PERIOD_LIST.filter((preset) => preset !== "custom").map(
                (preset) => (
                  <button
                    key={preset}
                    type="button"
                    disabled={exportReport.isPending}
                    onClick={() => setPeriod(preset)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                      period === preset
                        ? "border-purple-600 bg-purple-600 text-white"
                        : "border-slate-300 bg-white text-slate-600 hover:border-purple-400 hover:text-purple-600"
                    }`}
                  >
                    {AI_REPORT_PERIOD_LABELS[preset]}
                  </button>
                ),
              )}
              <button
                type="button"
                disabled={exportReport.isPending}
                onClick={() => setPeriod("custom")}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                  period === "custom"
                    ? "border-purple-600 bg-purple-600 text-white"
                    : "border-slate-300 bg-white text-slate-600 hover:border-purple-400 hover:text-purple-600"
                }`}
              >
                <HiOutlineCalendarDays className="h-3.5 w-3.5" />
                Custom
              </button>
            </div>
          </div>

          {period === "custom" ? (
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-slate-600">From</span>
                <input
                  type="date"
                  value={customStart}
                  max={customEnd}
                  onChange={(e) => setCustomStart(e.target.value)}
                  disabled={exportReport.isPending}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 transition focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 disabled:opacity-50"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-slate-600">To</span>
                <input
                  type="date"
                  value={customEnd}
                  min={customStart}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  disabled={exportReport.isPending}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 transition focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 disabled:opacity-50"
                />
              </label>
            </div>
          ) : null}

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="w-48">
              <Dropdown
                label="Format"
                name="export-format"
                options={EXPORT_FORMATS.map(({ label, value, icon }) => ({
                  label,
                  value,
                  icon,
                }))}
                value={exportFormat}
                onChange={setExportFormat}
                disabled={exportReport.isPending}
                className="h-11"
              />
            </div>
            <button
              type="button"
              onClick={submit}
              disabled={exportReport.isPending}
              className="flex h-11 shrink-0 items-center gap-2 rounded-lg bg-purple-600 px-5 text-sm font-semibold text-white transition hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50 disabled:pointer-events-none"
            >
              {exportReport.isPending ? (
                <>
                  <Spinner className="h-4 w-4 text-purple-200" />
                  Queueing…
                </>
              ) : (
                <>
                  <HiOutlineDocumentChartBar className="h-4 w-4" />
                  Generate report
                </>
              )}
            </button>
          </div>

          {exportReport.isPending && !job ? (
            <Skeleton className="h-20 w-full rounded-xl" />
          ) : null}

          {job ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {REPORT_TYPES.find((t) => t.value === job.reportType)?.label ??
                      job.reportType}
                  </p>
                  <p className="text-xs text-slate-500">
                    {job.periodLabel}
                    {job.byteSize ? ` · ${formatBytes(job.byteSize)}` : ""}
                    {job.filename ? ` · ${job.filename}` : ""}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
                    STATUS_TONE[job.status] ?? STATUS_TONE.pending
                  }`}
                >
                  {job.status}
                </span>
              </div>

              {job.status === "ready" && job.downloadUrl ? (
                <a
                  href={aiReportDownloadUrl(job.reportId)}
                  download
                  className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg bg-purple-600 px-4 text-sm font-semibold text-white transition hover:bg-purple-700"
                >
                  <HiOutlineArrowDownTray className="h-4 w-4" />
                  Download {job.exportFormat.toUpperCase()}
                </a>
              ) : null}

              {job.status === "failed" ? (
                <p className="mt-2 text-sm text-rose-600">
                  {job.message ?? "Report generation failed. Try again."}
                </p>
              ) : null}

              {job.status === "pending" || job.status === "processing" ? (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Spinner className="h-4 w-4 text-slate-400" />
                    Generating your {periodLabel} report — this usually takes a
                    moment.
                  </div>
                  <Skeleton className="h-2.5 w-full rounded-full" />
                  <Skeleton className="h-2.5 w-4/5 rounded-full" />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </Card>
    </section>
  );
}

function isSettledState(job: AiReportResult): boolean {
  return job.status === "ready" || job.status === "failed";
}
