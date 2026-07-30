export const COMPANY_STATUS_LIST = ["active", "inactive"] as const;

export const EMPLOYEE_STATUS_LIST = [
  "active",
  "suspended",
  "resigned",
  "terminated",
] as const;

export const PLATFORM_CONFIG_VALUE_TYPES = [
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

// This is data used to automatically populate the DB with the config defaults. Also useful if suddenly some got deleted and need to quickly update.
export const PLATFORM_CONFIG_DEFAULTS = {
  maintenance_mode: {
    type: "boolean",
    value: false,
  },
  name: {
    type: "string",
    value: "Rona ERP",
  },
  contact_phone: {
    type: "string",
    value: "+251 90 909 0909",
  },
  contact_email: {
    type: "string",
    value: "hello@ronaerp.com",
  },
} as const;
