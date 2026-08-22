import { Request } from "@/api";
import {
  API_ADMIN_DEPARTMENTS_URL,
  API_ADMIN_DEPARTMENT_BY_ID_URL,
} from "@rona/routes/admin";
import { DepartmentDto } from "@rona/types/admin";
import { DepartmentSchema } from "@rona/types/admin";

export const ApiGetDepartments = Request<DepartmentDto[]>(
  "get",
  API_ADMIN_DEPARTMENTS_URL,
);
export const ApiPostDepartment = Request<DepartmentDto, DepartmentSchema>(
  "post",
  API_ADMIN_DEPARTMENTS_URL,
);
export const ApiPatchDepartment = Request<
  DepartmentDto,
  Partial<DepartmentSchema>
>("patch", API_ADMIN_DEPARTMENT_BY_ID_URL);
export const ApiDeleteDepartment = Request<void>(
  "delete",
  API_ADMIN_DEPARTMENT_BY_ID_URL,
);
