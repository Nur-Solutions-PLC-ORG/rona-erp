import {
  ORGANIZATION_STATUS_LIST,
  CURRENCY_LIST,
  EMPLOYEE_STATUS_LIST,
  GENDER_LIST,
  PLATFORM_CONFIG_KEY_LIST,
  PLATFORM_CONFIG_TYPE_LIST,
} from "@rona/config/admin";
import {
  branchDto,
  branchListSearchParamsSchema,
  branchSchema,
  organizationDto,
  organizationListSearchParamsSchema,
  organizationSchema,
  organizationUpdateSchema,
  organizationSettingsDto,
  organizationSettingsSchema,
  organizationSettingsUpdateSchema,
  departmentDto,
  departmentListSearchParamsSchema,
  departmentSchema,
  departmentUpdateSchema,
  employeeDto,
  employeeListSearchParamsSchema,
  employeeSchema,
  employeeUpdateSchema,
  platformConfigDto,
  platformConfigSchema,
  userDto,
  userCredentialsDto,
  userListSearchParamsSchema,
  userSchema,
  userUpdateSchema,
  branchUpdateSchema,
  organizationSettingsListSearchParamsSchema,
  configsListSearchParamsSchema,
} from "@rona/validation/admin";
import z from "zod";

export type OrganizationStatus = (typeof ORGANIZATION_STATUS_LIST)[number];
export type EmployeeStatus = (typeof EMPLOYEE_STATUS_LIST)[number];

export type PlatformConfigType = (typeof PLATFORM_CONFIG_TYPE_LIST)[number];
export type PlatformConfigKey = (typeof PLATFORM_CONFIG_KEY_LIST)[number];

export type Currency = (typeof CURRENCY_LIST)[number];
export type Gender = (typeof GENDER_LIST)[number];

// Schemas
export type UserListSearchParamsSchema = z.infer<
  typeof userListSearchParamsSchema
>;
export type OrganizationListSearchParamsSchema = z.infer<
  typeof organizationListSearchParamsSchema
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
export type OrganizationSettingsListSearchParamsSchema = z.infer<
  typeof organizationSettingsListSearchParamsSchema
>;

export type UserSchema = z.infer<typeof userSchema>;
export type UserUpdateSchema = z.infer<typeof userUpdateSchema>;
export type OrganizationSchema = z.infer<typeof organizationSchema>;
export type OrganizationUpdateSchema = z.infer<typeof organizationUpdateSchema>;
export type OrganizationSettingsSchema = z.infer<
  typeof organizationSettingsSchema
>;
export type OrganizationSettingsUpdateSchema = z.infer<
  typeof organizationSettingsUpdateSchema
>;
export type DepartmentSchema = z.infer<typeof departmentSchema>;
export type DepartmentUpdateSchema = z.infer<typeof departmentUpdateSchema>;
export type BranchSchema = z.infer<typeof branchSchema>;
export type BranchUpdateSchema = z.infer<typeof branchUpdateSchema>;
export type EmployeeSchema = z.infer<typeof employeeSchema>;
export type EmployeeUpdateSchema = z.infer<typeof employeeUpdateSchema>;
export type PlatformConfigSchema = z.infer<typeof platformConfigSchema>;

// DTOs
export type UserDto = z.infer<typeof userDto>;
export type UserCredentialsDto = z.infer<typeof userCredentialsDto>;
export type OrganizationDto = z.infer<typeof organizationDto>;
export type OrganizationSettingsDto = z.infer<typeof organizationSettingsDto>;
export type DepartmentDto = z.infer<typeof departmentDto>;
export type BranchDto = z.infer<typeof branchDto>;
export type EmployeeDto = z.infer<typeof employeeDto>;
export type PlatformConfigDto = z.infer<typeof platformConfigDto>;

// Dashboard status
export interface AdminDashboardStatus {
  organizations: {
    total: number;
    active: number;
  };
  departments: {
    total: number;
  };
  branches: {
    total: number;
  };
  employees: {
    total: number;
    byStatus: Record<string, number>;
  };
  users: {
    total: number;
    active: number;
    byRole: Record<string, number>;
  };
  platformConfigs: {
    total: number;
    configs: PlatformConfigDto[];
  };
}

export type AdminDashboardStats = AdminDashboardStatus;
