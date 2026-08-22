import { Request } from "@/api";
import {
  API_ADMIN_EMPLOYEES_URL,
  API_ADMIN_EMPLOYEE_BY_ID_URL,
} from "@rona/routes/admin";
import { EmployeeDto } from "@rona/types/admin";
import { EmployeeSchema } from "@rona/types/admin";

export const ApiGetEmployees = Request<EmployeeDto[]>(
  "get",
  API_ADMIN_EMPLOYEES_URL,
);
export const ApiPostEmployee = Request<EmployeeDto, EmployeeSchema>(
  "post",
  API_ADMIN_EMPLOYEES_URL,
);
export const ApiPatchEmployee = Request<EmployeeDto, Partial<EmployeeSchema>>(
  "patch",
  API_ADMIN_EMPLOYEE_BY_ID_URL,
);
export const ApiDeleteEmployee = Request<void>(
  "delete",
  API_ADMIN_EMPLOYEE_BY_ID_URL,
);
