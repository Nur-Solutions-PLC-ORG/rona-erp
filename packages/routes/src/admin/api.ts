// Dashboard
export const API_ADMIN_DASHBOARD_URL = "/api/admin/dashboard";
/**
 * Method: GET
 * Response: ApiResponse<AdminDashboardStats>
 */

// Users
export const API_ADMIN_USERS_URL = "/api/admin/users";
/**
 * Methods: GET, POST
 * Query: UserListSearchParamsSchema
 * RequestBody: UserSchema
 * Response: GET ApiResponse<UserDto[]>; POST ApiResponse<UserCredentialsDto>
 */

export const API_ADMIN_USER_BY_ID_URL = "/api/admin/users/:id";
/**
 * Methods: GET, PATCH, DELETE
 * RequestBody: UserUpdateSchema
 * Response: ApiResponse<UserDto | never>
 */

export const API_ADMIN_USER_RESET_PASSWORD_URL =
  "/api/admin/users/:id/reset-password";
/**
 * Method: POST
 * Response: ApiResponse<UserCredentialsDto>
 */

// Organizations
export const API_ADMIN_COMPANIES_URL = "/api/admin/organizations";
/**
 * Methods: GET, POST
 * Query: OrganizationListSearchParamsSchema
 * RequestBody: OrganizationSchema
 * Response: ApiResponse<OrganizationDto[] | OrganizationDto>
 */

export const API_ADMIN_ORGANIZATION_BY_ID_URL = "/api/admin/organizations/:id";
/**
 * Methods: GET, PATCH, DELETE
 * RequestBody: OrganizationUpdateSchema
 * Response: ApiResponse<OrganizationDto | never>
 */

export const API_ADMIN_ORGANIZATION_SETTINGS_URL =
  "/api/admin/organization-settings";
/**
 * Methods: GET, POST
 * RequestBody: OrganizationSettingsSchema
 * Response: ApiResponse<OrganizationSettingsDto[] | OrganizationSettingsDto>
 */

export const API_ADMIN_ORGANIZATION_SETTINGS_BY_ID_URL =
  "/api/admin/organization-settings/:id";
/**
 * Methods: GET, PATCH, DELETE
 * RequestBody: OrganizationSettingsUpdateSchema
 * Response: ApiResponse<OrganizationSettingsDto | never>
 */

// Departments and branches
export const API_ADMIN_DEPARTMENTS_URL = "/api/admin/departments";
/**
 * Methods: GET, POST
 * Query: DepartmentListSearchParamsSchema
 * RequestBody: DepartmentSchema
 * Response: ApiResponse<DepartmentDto[] | DepartmentDto>
 */

export const API_ADMIN_DEPARTMENT_BY_ID_URL = "/api/admin/departments/:id";
/**
 * Methods: GET, PATCH, DELETE
 * RequestBody: DepartmentUpdateSchema
 * Response: ApiResponse<DepartmentDto | never>
 */

export const API_ADMIN_BRANCHES_URL = "/api/admin/branches";
/**
 * Methods: GET, POST
 * Query: BranchListSearchParamsSchema
 * RequestBody: BranchSchema
 * Response: ApiResponse<BranchDto[] | BranchDto>
 */

export const API_ADMIN_BRANCH_BY_ID_URL = "/api/admin/branches/:id";
/**
 * Methods: GET, PATCH, DELETE
 * RequestBody: BranchUpdateSchema
 * Response: ApiResponse<BranchDto | never>
 */

// Employees
export const API_ADMIN_EMPLOYEES_URL = "/api/admin/employees";
/**
 * Methods: GET, POST
 * Query: EmployeeListSearchParamsSchema
 * RequestBody: EmployeeSchema
 * Response: ApiResponse<EmployeeDto[] | EmployeeDto>
 */

export const API_ADMIN_EMPLOYEE_BY_ID_URL = "/api/admin/employees/:id";
/**
 * Methods: GET, PATCH, DELETE
 * RequestBody: EmployeeUpdateSchema
 * Response: ApiResponse<EmployeeDto | never>
 */

// Platform configuration
export const API_ADMIN_PLATFORM_CONFIGS_URL = "/api/admin/platform-configs";
/**
 * Methods: GET, POST
 * POST resets all values to the predefined defaults.
 * Response: ApiResponse<PlatformConfigDto[]>
 */

export const API_ADMIN_PLATFORM_CONFIG_BY_KEY_URL =
  "/api/admin/platform-configs/:key";
/**
 * Methods: GET, PATCH, PUT
 * RequestBody: PlatformConfigSchema
 * Response: ApiResponse<PlatformConfigDto>
 */
