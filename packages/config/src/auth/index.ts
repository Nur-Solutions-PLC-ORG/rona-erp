// Data types
export const POSITIONS_LIST = ["admin", "owner", "manager", "staff"] as const;

export const MODULE_LIST = [
  "workforce",
  "payroll",
  "inventory",
  "production",
  "sales",
  "accounting",
] as const;

export const OPT_RESEND_DELAY_DURATION_MS = 60 * 1000;

export const VERIFICATION_CODE_LENGTH = 6;
export const VERIFICATION_CODE_EXPIRY_MS = 10 * 60 * 1000;

export const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
export const COOKIE_NAME = "session_token";
