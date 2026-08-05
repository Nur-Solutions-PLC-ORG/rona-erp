import {
  COMPANY_STATUS_LIST,
  CURRENCY_LIST,
  EMPLOYEE_STATUS_LIST,
  GENDER_LIST,
  PLATFORM_CONFIG_KEYS,
  PLATFORM_CONFIG_TYPE_LIST,
} from "@rona/config/admin";
import {
  branchDto,
  branchListSearchParamsSchema,
  branchSchema,
  companyDto,
  companyListSearchParamsSchema,
  companySchema,
  companySettingsDto,
  companySettingsSchema,
  departmentDto,
  departmentListSearchParamsSchema,
  departmentSchema,
  employeeDto,
  employeeListSearchParamsSchema,
  employeeSchema,
  platformConfigDto,
  platformConfigSchema,
  userListSearchParamsSchema,
  userSchema,
  companySettingsListSearchParamsSchema,
  configsListSearchParamsSchema,
} from "@rona/validation/admin";
import z from "zod";

export type CompanyStatus = (typeof COMPANY_STATUS_LIST)[number];
export type EmployeeStatus = (typeof EMPLOYEE_STATUS_LIST)[number];

export type PlatformConfigType = (typeof PLATFORM_CONFIG_TYPE_LIST)[number];
export type PlatformConfigKey = (typeof PLATFORM_CONFIG_KEYS)[number];

export type Currency = (typeof CURRENCY_LIST)[number];
export type Gender = (typeof GENDER_LIST)[number];

// Schemas
export type UserListSearchParamsSchema = z.infer<
  typeof userListSearchParamsSchema
>;
export type CompanyListSearchParamsSchema = z.infer<
  typeof companyListSearchParamsSchema
>;
export type EmployeeListSearchParamsSchema = z.infer<
  typeof employeeListSearchParamsSchema
>;
export type DepartmentListSearchParamsSchema = z.infer<
  typeof departmentListSearchParamsSchema
>;
export type BranchListSearchParamsSchema = z.infer<
  typeof branchListSearchParamsSchema
>;
export type ConfigsListSearchParamsSchema = z.infer<
  typeof configsListSearchParamsSchema
>;
export type CompanySettingsListSearchParamsSchema = z.infer<
  typeof companySettingsListSearchParamsSchema
>;

export type UserSchema = z.infer<typeof userSchema>;
export type CompanySchema = z.infer<typeof companySchema>;
export type CompanySettingsSchema = z.infer<typeof companySettingsSchema>;
export type DepartmentSchema = z.infer<typeof departmentSchema>;
export type BranchSchema = z.infer<typeof branchSchema>;
export type EmployeeSchema = z.infer<typeof employeeSchema>;
export type PlatformConfigSchema = z.infer<typeof platformConfigSchema>;

// DTOs
export type CompanyDto = z.infer<typeof companyDto>;
export type CompanySettingsDto = z.infer<typeof companySettingsDto>;
export type DepartmentDto = z.infer<typeof departmentDto>;
export type BranchDto = z.infer<typeof branchDto>;
export type EmployeeDto = z.infer<typeof employeeDto>;
export type PlatformConfigDto = z.infer<typeof platformConfigDto>;
