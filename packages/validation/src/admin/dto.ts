import z from "zod";
import {
  ORGANIZATION_STATUS_LIST,
  CURRENCY_LIST,
  EMPLOYEE_STATUS_LIST,
  GENDER_LIST,
  PLATFORM_CONFIG_KEY_LIST,
  PLATFORM_CONFIG_TYPE_LIST,
} from "@rona/config/admin";
import { MODULE_LIST } from "@rona/config/auth";
import { POSITIONS_LIST, USER_STATUS_LIST } from "@rona/config/auth";

export const userDto = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string(),
  organizationId: z.string().nullable(),
  status: z.enum(USER_STATUS_LIST),
  role: z.object({
    position: z.enum(POSITIONS_LIST),
    modules: z.array(z.enum(MODULE_LIST)),
  }),
  createdAt: z.date(),
});

export const userCredentialsDto = z.object({
  email: z.email(),
});

export const organizationDto = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  email: z.string(),
  phone: z.string(),
  country: z.string(),
  status: z.enum(ORGANIZATION_STATUS_LIST),
  createdAt: z.date(),
});

export const organizationSettingsDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  currency: z.enum(CURRENCY_LIST),
  createdAt: z.date(),
});

export const departmentDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  module: z.enum(MODULE_LIST).array(),
  createdAt: z.date(),
});

export const branchDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  createdAt: z.date(),
});

export const employeeDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  eId: z.string(),
  fullName: z.string(),
  phone: z.string(),
  email: z.string().optional(),
  gender: z.enum(GENDER_LIST),
  birthDate: z.date(),
  status: z.enum(EMPLOYEE_STATUS_LIST),
  createdAt: z.date(),
});

export const platformConfigDto = z.object({
  id: z.string(),
  key: z.enum(PLATFORM_CONFIG_KEY_LIST),
  value: z.string(),
  type: z.enum(PLATFORM_CONFIG_TYPE_LIST),
  updatedAt: z.date(),
});
