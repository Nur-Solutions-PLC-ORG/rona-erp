import { z } from "zod";
import {
  ORGANIZATION_STATUS_LIST,
  CURRENCY_LIST,
  EMPLOYEE_STATUS_LIST,
  GENDER_LIST,
  PLATFORM_CONFIG_KEY_LIST,
  PLATFORM_CONFIG_TYPE_LIST,
  EID_LENGTH,
} from "@rona/config/admin";
import {
  MODULE_LIST,
  POSITIONS_LIST,
  USER_STATUS_LIST,
} from "@rona/config/auth";

export const userSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters long"),
  email: z.email("Invalid email address"),
  organizationId: z.string().optional(),
  status: z.enum(USER_STATUS_LIST),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(72, "Password must be at most 72 characters long")
    .optional(),
  role: z.object({
    position: z.enum(POSITIONS_LIST),
    modules: z.array(z.enum(MODULE_LIST)),
  }),
});
export const userUpdateSchema = userSchema.partial();

export const organizationLogoUrlSchema = z
  .string()
  .trim()
  .max(1_500_000, "Logo is too large")
  .refine(
    (value) =>
      value === "" ||
      value.startsWith("data:image/") ||
      /^https:\/\/.+/i.test(value),
    "Logo must be an uploaded image or an https URL",
  );

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
  ownerUserId: z.string().uuid("Owner user ID must be a valid UUID").optional(),
  logoUrl: organizationLogoUrlSchema.optional(),
});
export const organizationUpdateSchema = organizationSchema.partial();

export const organizationSettingsSchema = z.object({
  organizationId: z.string().min(1, "organization ID is required"),
  currency: z.enum(CURRENCY_LIST),
});
export const organizationSettingsUpdateSchema = organizationSettingsSchema.partial();

export const departmentSchema = z.object({
  organizationId: z.string().min(1, "organization ID is required"),
  name: z.string().min(2, "Department name is required"),
  module: z.array(z.enum(MODULE_LIST)),
});
export const departmentUpdateSchema = departmentSchema.partial();

export const branchSchema = z.object({
  organizationId: z.string().min(1, "organization is required"),
  name: z.string().min(2, "Branch name is required"),
});
export const branchUpdateSchema = branchSchema.partial();

export const employeeSchema = z.object({
  organizationId: z.string().min(1, "Organization is required"),
  eId: z
    .string()
    .length(
      EID_LENGTH,
      `Employee ID (EID) must be exactly ${EID_LENGTH} digits`,
    )
    .regex(/^\d+$/, `Employee ID must be all digits`),
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(7, "Phone is required"),
  email: z.email("Email is invalid").optional().or(z.literal("")),
  gender: z.enum(GENDER_LIST, "Gender is required!"),
  birthDate: z.coerce.date("Date is required!"),
  status: z.enum(EMPLOYEE_STATUS_LIST, "Status is required!"),
});
export const employeeUpdateSchema = employeeSchema.partial();

export const platformConfigSchema = z.object({
  key: z.enum(PLATFORM_CONFIG_KEY_LIST, "Key is required!"),
  value: z.string().min(1, "Value is required!"),
  type: z.enum(PLATFORM_CONFIG_TYPE_LIST, "Type is required!"),
});
