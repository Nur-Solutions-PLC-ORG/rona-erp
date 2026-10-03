// AI assistant

import { MODULE_LIST } from "../auth/index.js";

export const AI_DATA_DOMAIN_LIST = [
  "hr",
  "attendance",
  "production",
  "inventory",
  "quality",
  "sales",
  "finance",
  "organization",
  "bom",
  "reports",
] as const;

export const AI_DOMAIN_LABELS: Record<
  (typeof AI_DATA_DOMAIN_LIST)[number],
  string
> = {
  hr: "HR Module",
  attendance: "Attendance Module",
  production: "Production Module",
  inventory: "Inventory Module",
  quality: "Quality Module",
  sales: "Sales Module",
  finance: "Finance Module",
  organization: "Organization Module",
  bom: "BOM Module",
  reports: "Reports Database",
};

export const AI_LANGUAGE_LIST = ["en", "am", "om"] as const;

export const AI_SEVERITY_LIST = ["info", "warning", "critical"] as const;

export const AI_TREND_DIRECTION_LIST = ["up", "down", "flat"] as const;

export const AI_PRODUCTION_STATUS_LIST = [
  "ahead",
  "on_target",
  "below_target",
  "halted",
] as const;

export const AI_STOCK_STATUS_LIST = [
  "healthy",
  "low",
  "out_of_stock",
  "overstocked",
  "slow_moving",
] as const;

export const AI_MACHINE_STATUS_LIST = [
  "operational",
  "under_maintenance",
  "breakdown",
  "idle",
  "decommissioned",
] as const;

export const AI_REPORT_TYPE_LIST = [
  "attendance",
  "production",
  "inventory_valuation",
  "quality",
  "sales",
  "finance",
  "management_summary",
] as const;

export const AI_EXPORT_FORMAT_LIST = ["pdf", "excel", "json"] as const;

export const AI_REPORT_JOB_STATUS_LIST = [
  "pending",
  "processing",
  "ready",
  "failed",
] as const;

export const AI_MAX_PERIOD_DAYS = 366;

export const AI_REPORT_PERIOD_LIST = [
  "today",
  "yesterday",
  "this_week",
  "last_week",
  "this_month",
  "last_month",
  "custom",
] as const;

export const AI_REPORT_PERIOD_LABELS: Record<
  (typeof AI_REPORT_PERIOD_LIST)[number],
  string
> = {
  today: "Today",
  yesterday: "Yesterday",
  this_week: "This Week",
  last_week: "Last Week",
  this_month: "This Month",
  last_month: "Last Month",
  custom: "Custom Range",
};

export const AI_DOMAIN_REQUIRED_PERMISSIONS: Record<
  Exclude<(typeof AI_DATA_DOMAIN_LIST)[number], "reports">,
  string[]
> = {
  hr: ["hr.employee.read"],
  attendance: ["hr.attendance.read"],
  production: ["manufacturing.production.read"],
  inventory: ["inventory.stock.read"],
  quality: ["quality.inspection.read"],
  sales: ["sales.order.read"],
  finance: ["finance.invoice.read"],
  organization: ["membership.read"],
  bom: ["manufacturing.bom.read"],
};

export const AI_DOMAIN_REQUIRED_MODULES: Record<
  "reports" | keyof typeof AI_DOMAIN_REQUIRED_PERMISSIONS,
  (typeof MODULE_LIST)[number] | null
> = {
  hr: "workforce",
  attendance: "workforce",
  production: "manufacturing",
  inventory: "inventory",
  quality: "quality",
  sales: "sales",
  finance: "finance",
  organization: "organization",
  bom: "manufacturing",
  reports: null,
};

export const AI_UNCONDITIONAL_DOMAINS: (typeof AI_DATA_DOMAIN_LIST)[number][] =
  [];

export const AI_FULL_ACCESS_ROLE_KEYS = ["OWNER"] as const;

export const AI_DAILY_LIMIT_DEFAULT = 100_000;
export const AI_LIMIT_WINDOW_SECONDS = 24 * 60 * 60;
export const AI_LIMIT_KEY_PREFIX = "rona:ai:limit:";

export const AI_MAX_CONTEXT_RECORDS_PER_DOMAIN = 150;
export const AI_MAX_PROMPT_ROWS = 150;

export const AI_KB_ENABLED = false;
export const AI_KB_MAX_SNIPPETS = 3;
export const AI_KB_MAX_SNIPPETS_LIMIT = 10;
export const AI_KB_CHUNK_MAX_WORDS = 120;

export const AI_GEMINI_MODEL_DEFAULT = "gemini-2.5-flash-lite";
export const AI_GEMINI_TEMPERATURE_DEFAULT = 0.2;
export const AI_GEMINI_MAX_OUTPUT_TOKENS_DEFAULT = 1024;
export const AI_GEMINI_THINKING_BUDGET_DEFAULT = 0;
export const AI_GEMINI_TIMEOUT_SECONDS_DEFAULT = 10;
export const AI_GEMINI_MAX_ATTEMPTS = 2;
export const AI_GEMINI_RETRY_BASE_DELAY_SECONDS = 0.25;

export const AI_REPORT_RETENTION_HOURS = 24;
export const AI_REPORT_JOB_MAX_ATTEMPTS = 3;
export const AI_REPORT_JOB_RETRY_SECONDS = 5;
export const AI_REPORT_JOB_STALE_SECONDS = 300;
export const AI_REPORT_WORKER_POLL_SECONDS = 1;
export const AI_REPORT_WORKER_RETENTION_SWEEP_SECONDS = 300;
export const AI_REPORT_OUTPUT_DIR = "generated_reports";
