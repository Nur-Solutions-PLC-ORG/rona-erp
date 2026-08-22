import { Request } from "@/api";
import {
  API_ADMIN_ORGANIZATION_SETTINGS_URL,
  API_ADMIN_ORGANIZATION_SETTINGS_BY_ID_URL,
} from "@rona/routes/admin";
import { OrganizationSettingsDto } from "@rona/types/admin";
import { OrganizationSettingsSchema } from "@rona/types/admin";

export const ApiGetOrganizationSettings = Request<OrganizationSettingsDto[]>(
  "get",
  API_ADMIN_ORGANIZATION_SETTINGS_URL,
);
export const ApiPostOrganizationSettings = Request<
  OrganizationSettingsDto,
  OrganizationSettingsSchema
>("post", API_ADMIN_ORGANIZATION_SETTINGS_URL);
export const ApiPatchOrganizationSettings = Request<
  OrganizationSettingsDto,
  Partial<OrganizationSettingsSchema>
>("patch", API_ADMIN_ORGANIZATION_SETTINGS_BY_ID_URL);
export const ApiDeleteOrganizationSettings = Request<void>(
  "delete",
  API_ADMIN_ORGANIZATION_SETTINGS_BY_ID_URL,
);
