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
  "inventory",
  "manufacturing",
  "quality",
  "traceability",
  "organization",
  "sales",
  "finance",
  "kiosk",
] as const;

export const USER_STATUS_LIST = [
  "active",
  "inactive",
  "suspended",
  "pending_onboarding",
] as const;

export const OPT_RESEND_DELAY_DURATION_MS = 60 * 1000;

export const SESSION_DURATION = 14 * 24 * 60 * 60 * 1000;
export const COOKIE_NAME = "session_token";

export const CODE_LENGTH = 6;
export const CODE_EXPIRY_MS = 10 * 60 * 1000;

export const SIGN_IN_ATTEMPT_LIMIT = 10;
export const SIGN_IN_WINDOW_SECONDS = 15 * 60;
export const CODE_MAX_ATTEMPTS = 5;
export const CODE_WINDOW_SECONDS = 10 * 60;
export const RESET_MAX_ATTEMPTS = 5;
export const FORGOT_ATTEMPT_LIMIT = 5;
export const FORGOT_WINDOW_SECONDS = 15 * 60;
export const PASSWORD_MAX_LENGTH = 128;
