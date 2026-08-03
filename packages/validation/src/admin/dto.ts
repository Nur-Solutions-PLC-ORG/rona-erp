import z from "zod";
import {
  COMPANY_STATUS_LIST,
  CURRENCY_LIST,
  EMPLOYEE_STATUS_LIST,
  GENDER_LIST,
  PLATFORM_CONFIG_KEYS,
  PLATFORM_CONFIG_VALUE_TYPES,
} from "@rona/config/admin";
import { MODULE_LIST } from "@rona/config/auth";

export const companyDto = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  email: z.string(),
  phone: z.string(),
  country: z.string(),
  status: z.enum(COMPANY_STATUS_LIST),
  createdAt: z.string(),
});

export const companySettingsDto = z.object({
  id: z.string(),
  tenantId: z.string(),
  currency: z.enum(CURRENCY_LIST),
  createdAt: z.string(),
});

export const departmentDto = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  module: z.enum(MODULE_LIST).array(),
  createdAt: z.string(),
});

export const branchDto = z.object({
  id: z.string(),
  tenantId: z.string(),
  departmentId: z.string(),
  name: z.string(),
  createdAt: z.string(),
});

export const employeeDto = z.object({
  id: z.string(),
  tenantId: z.string(),
  eId: z.string(),
  fullName: z.string(),
  phone: z.string(),
  email: z.string().optional(),
  gender: z.enum(GENDER_LIST),
  birthDate: z.date(),
  status: z.enum(EMPLOYEE_STATUS_LIST),
  createdAt: z.string(),
});

export const platformConfigDto = z.object({
  id: z.string(),
  key: z.enum(PLATFORM_CONFIG_KEYS),
  value: z.union([z.string(), z.number(), z.boolean()]),
  type: z.enum(PLATFORM_CONFIG_VALUE_TYPES),
  createdAt: z.string(),
});
