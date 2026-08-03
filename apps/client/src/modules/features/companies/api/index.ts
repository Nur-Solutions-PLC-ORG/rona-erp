import { Request } from "@/api";
import {
  API_ADMIN_COMPANIES_URL,
  API_ADMIN_COMPANY_BY_ID_URL,
} from "@rona/routes/admin";
import { CompanyDto } from "@rona/types/admin";
import { CompanySchema } from "@rona/types/admin";

export const ApiGetCompanies = Request<CompanyDto[]>(
  "get",
  API_ADMIN_COMPANIES_URL,
);
export const ApiPostCompany = Request<CompanyDto, CompanySchema>(
  "post",
  API_ADMIN_COMPANIES_URL,
);
export const ApiPatchCompany = Request<CompanyDto, Partial<CompanySchema>>(
  "patch",
  API_ADMIN_COMPANY_BY_ID_URL,
);
export const ApiDeleteCompany = Request<void>(
  "delete",
  API_ADMIN_COMPANY_BY_ID_URL,
);
