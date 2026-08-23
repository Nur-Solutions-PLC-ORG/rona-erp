export const ORGANIZATION_STATUS_LIST = [
  "active",
  "inactive",
  "suspended",
] as const;

export const EMPLOYEE_STATUS_LIST = [
  "active",
  "suspended",
  "resigned",
  "on_leave",
  "terminated",
] as const;

export const PLATFORM_CONFIG_TYPE_LIST = [
  "string",
  "number",
  "boolean",
] as const;

export const CURRENCY_LIST = ["ETB", "USD"] as const;

export const GENDER_LIST = ["M", "F"] as const;

export const PLATFORM_CONFIG_KEY_LIST = [
  "maintenance_mode",
  "name",
  "contact_phone",
  "contact_email",
] as const;

export const EID_LENGTH = 5;
