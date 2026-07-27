export const POSITIONS_LIST = ["admin", "owner", "manager", "staff"] as const;

export const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export const OPT_RESEND_DELAY_DURATION_S = 60; // in seconds

export const MODULE_LIST = [
  "workforce",
  "payroll",
  "inventory",
  "production",
  "sales",
  "accounting",
] as const;
