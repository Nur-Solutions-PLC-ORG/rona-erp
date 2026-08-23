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

export const PLATFORM_CONFIG_DEFAULTS = [
  { key: "maintenance_mode", value: "false", type: "boolean" },
  { key: "name", value: "Rona ERP", type: "string" },
  { key: "contact_phone", value: "+251 90 909 0909", type: "string" },
  { key: "contact_email", value: "hello@ronaerp.com", type: "string" },
] as const;

export const EID_LENGTH = 5;
