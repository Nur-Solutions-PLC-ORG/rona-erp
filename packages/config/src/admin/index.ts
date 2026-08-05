export const COMPANY_STATUS_LIST = ["active", "inactive"] as const;

export const EMPLOYEE_STATUS_LIST = [
  "active",
  "suspended",
  "resigned",
  "terminated",
] as const;

export const PLATFORM_CONFIG_TYPE_LIST = [
  "string",
  "number",
  "boolean",
] as const;

export const CURRENCY_LIST = ["ETB", "USD"] as const;

export const GENDER_LIST = ["M", "F"] as const;

export const PLATFORM_CONFIG_KEYS = [
  "maintenance_mode",
  "name",
  "contact_phone",
  "contact_email",
] as const;
