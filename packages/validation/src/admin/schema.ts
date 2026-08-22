import { z } from "zod";
import {
  ORGANIZATION_STATUS_LIST,
  CURRENCY_LIST,
  EMPLOYEE_STATUS_LIST,
  GENDER_LIST,
  PLATFORM_CONFIG_KEY_LIST,
  PLATFORM_CONFIG_TYPE_LIST,
} from "@rona/config/admin";
import {
  MODULE_LIST,
  POSITIONS_LIST,
  USER_STATUS_LIST,
} from "@rona/config/auth";
import { paginationSearchParamsSchema } from "../global/schema.js";

export const userListSearchParamsSchema = paginationSearchParamsSchema.extend({
  status: z.enum(USER_STATUS_LIST).optional(),
  position: z.enum(POSITIONS_LIST).optional(),
});

export const organizationListSearchParamsSchema =
  paginationSearchParamsSchema.extend({
    status: z.enum(ORGANIZATION_STATUS_LIST).optional(),
  });

export const employeeListSearchParamsSchema =
  paginationSearchParamsSchema.extend({
    status: z.enum(EMPLOYEE_STATUS_LIST).optional(),
  });

export const departmentListSearchParamsSchema = paginationSearchParamsSchema;
export const branchListSearchParamsSchema = paginationSearchParamsSchema;
export const configsListSearchParamsSchema = paginationSearchParamsSchema;
export const organizationSettingsListSearchParamsSchema =
  paginationSearchParamsSchema;

// Tables schema
export const userSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters long"),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  organizationId: z.string().optional(),
  status: z.enum(USER_STATUS_LIST),
  role: z.object({
    position: z.enum(POSITIONS_LIST),
    modules: z.array(z.enum(MODULE_LIST)),
  }),
});

export const organizationSchema = z.object({
  name: z.string().min(2, "Organization name is required"),
  slug: z
    .string()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9-]+$/),
  email: z.email("Organization email is invalid"),
  phone: z.string().min(7, "Phone is required"),
  country: z.string().min(2, "Country is required"),
  status: z.enum(ORGANIZATION_STATUS_LIST),
});

export const organizationSettingsSchema = z.object({
  organizationId: z.string().min(1, "organization ID is required"),
  currency: z.enum(CURRENCY_LIST),
});

export const departmentSchema = z.object({
  organizationId: z.string().min(1, "organization ID is required"),
  name: z.string().min(2, "Department name is required"),
  module: z.array(z.enum(MODULE_LIST)),
});

export const branchSchema = z.object({
  organizationId: z.string().min(1, "organization ID is required"),
  name: z.string().min(2, "Branch name is required"),
});

export const employeeSchema = z.object({
  organizationId: z.string().min(1),
  eId: z.string().regex(/^\d{5}$/, "Employee ID must be exactly 5 digits"),
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(7, "Phone is required"),
  email: z.email("Email is invalid").optional().or(z.literal("")),
  gender: z.enum(GENDER_LIST),
  birthDate: z.date("Date is required!"),
  status: z.enum(EMPLOYEE_STATUS_LIST),
});

export const platformConfigSchema = z.object({
  key: z.enum(PLATFORM_CONFIG_KEY_LIST),
  value: z.string().min(1, "Value is required!"),
  type: z.enum(PLATFORM_CONFIG_TYPE_LIST),
});
