// Data types

export const POSITIONS_LIST = [
  "super_admin",
  "admin",
  "owner",
  "manager",
  "staff",
] as const;

export const MODULE_LIST = [
  "workforce",
  "payroll",
  "inventory",
  "production",
  "sales",
  "accounting",
] as const;

export const USER_STATUS_LIST = [
  "active",
  "inactive",
  "suspended",
  "pending_onboarding",
] as const;

// Values

export const OPT_RESEND_DELAY_DURATION_MS = 60 * 1000;

export const SESSION_DURATION = 14 * 24 * 60 * 60 * 1000;
export const COOKIE_NAME = "session_token";

export const CODE_LENGTH = 6;
export const CODE_EXPIRY_MS = 10 * 60 * 1000;
