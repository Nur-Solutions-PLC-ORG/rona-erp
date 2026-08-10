export const API_ADMIN_USERS_URL = "/api/admin/users";
/**
 * Methods: GET, POST
 * Query: UserListSearchParamsSchema
 * RequestBody: UserCreateSchema
 * Response: ApiResponse<UserDto[] | UserDto>
 */

// Dashboard
export const API_ADMIN_DASHBOARD_URL = "/api/admin/dashboard";
/**
 * Method: GET
 * Response: ApiResponse<AdminDashboardStats>
 */

export const API_ADMIN_USER_BY_ID_URL = "/api/admin/users/:id";
/**
 * Methods: GET, PUT, DELETE
 * RequestBody: UserSchema
 * Response: ApiResponse<UserDto | never>
 */

// Companies
export const API_ADMIN_COMPANIES_URL = "/api/admin/companies";
/**
 * Methods: GET, POST
 * Query: CompanyListSearchParamsSchema
 * RequestBody: CompanySchema
 * Response: ApiResponse<CompanyDto[] | CompanyDto>
 */

export const API_ADMIN_COMPANY_BY_ID_URL = "/api/admin/companies/:id";
/**
 * Methods: GET, PUT, DELETE
 * RequestBody: CompanySchema
 * Response: ApiResponse<CompanyDto | never>
 */

export const API_ADMIN_COMPANY_SETTINGS_URL = "/api/admin/company-settings";
/**
 * Methods: GET, POST
 * RequestBody: CompanySettingsSchema
 * Response: ApiResponse<CompanySettingsDto[] | CompanySettingsDto>
 */

export const API_ADMIN_COMPANY_SETTINGS_BY_ID_URL =
  "/api/admin/company-settings/:id";
/**
 * Methods: GET, PUT, DELETE
 * RequestBody: CompanySettingsSchema
 * Response: ApiResponse<CompanySettingsDto | never>
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
 * Methods: GET, PUT, DELETE
 * RequestBody: DepartmentSchema
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
 * Methods: GET, PUT, DELETE
 * RequestBody: BranchSchema
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
 * Methods: GET, PUT, DELETE
 * RequestBody: EmployeeSchema
 * Response: ApiResponse<EmployeeDto | never>
 */

// Platform configuration
export const API_ADMIN_PLATFORM_CONFIGS_URL = "/api/admin/platform-configs";
/**
 * Methods: GET, PUT
 * RequestBody: PlatformConfigSchema
 * Response: ApiResponse<PlatformConfigDto[] | PlatformConfigDto>
 */

export const API_ADMIN_PLATFORM_CONFIG_BY_KEY_URL =
  "/api/admin/platform-configs/:key";
/**
 * Methods: GET, PUT
 * RequestBody: PlatformConfigSchema
 * Response: ApiResponse<PlatformConfigDto>
 */
