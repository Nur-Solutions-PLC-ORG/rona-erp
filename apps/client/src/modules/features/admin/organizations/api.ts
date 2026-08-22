import { Request } from "@/api";
import {
  API_ADMIN_COMPANIES_URL,
  API_ADMIN_ORGANIZATION_BY_ID_URL,
} from "@rona/routes/admin";
import { OrganizationDto } from "@rona/types/admin";
import { OrganizationSchema } from "@rona/types/admin";

export const ApiGetOrganizations = Request<OrganizationDto[]>(
  "get",
  API_ADMIN_COMPANIES_URL,
);
export const ApiPostOrganization = Request<OrganizationDto, OrganizationSchema>(
  "post",
  API_ADMIN_COMPANIES_URL,
);
export const ApiPatchOrganization = Request<
  OrganizationDto,
  Partial<OrganizationSchema>
>("patch", API_ADMIN_ORGANIZATION_BY_ID_URL);
export const ApiDeleteOrganization = Request<void>(
  "delete",
  API_ADMIN_ORGANIZATION_BY_ID_URL,
);
