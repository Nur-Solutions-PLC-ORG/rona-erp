// Data types
export const POSITIONS_LIST = [
    "super_admin",
    "admin",
    "owner",
    "manager",
    "staff",
];
export const MODULE_LIST = [
    "workforce",
    "payroll",
    "inventory",
    "production",
    "sales",
    "accounting",
];
export const USER_STATUS_LIST = [
    "active",
    "inactive",
    "suspended",
    "pending_onboarding",
];
// Values
export const OPT_RESEND_DELAY_DURATION_MS = 60 * 1000;
export const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
export const COOKIE_NAME = "session_token";
export const CODE_LENGTH = 6;
export const CODE_EXPIRY_MS = 10 * 60 * 1000;
