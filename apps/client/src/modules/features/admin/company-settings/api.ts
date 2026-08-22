import { Request } from "@/api";
import {
  API_ADMIN_COMPANY_SETTINGS_URL,
  API_ADMIN_COMPANY_SETTINGS_BY_ID_URL,
} from "@rona/routes/admin";
import { CompanySettingsDto } from "@rona/types/admin";
import { CompanySettingsSchema } from "@rona/types/admin";

export const ApiGetCompanySettings = Request<CompanySettingsDto[]>(
  "get",
  API_ADMIN_COMPANY_SETTINGS_URL,
);
export const ApiPostCompanySettings = Request<
  CompanySettingsDto,
  CompanySettingsSchema
>("post", API_ADMIN_COMPANY_SETTINGS_URL);
export const ApiPatchCompanySettings = Request<
  CompanySettingsDto,
  Partial<CompanySettingsSchema>
>("patch", API_ADMIN_COMPANY_SETTINGS_BY_ID_URL);
export const ApiDeleteCompanySettings = Request<void>(
  "delete",
  API_ADMIN_COMPANY_SETTINGS_BY_ID_URL,
);
