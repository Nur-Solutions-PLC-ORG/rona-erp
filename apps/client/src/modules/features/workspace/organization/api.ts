import { Request } from "@/api";
import {
  API_AUDIT_LOGS_URL,
  API_MEMBERSHIPS_CREATE_URL,
  API_MEMBERSHIP_DELETE_URL,
  API_MEMBERSHIP_UPDATE_URL,
  API_MEMBERSHIPS_URL,
  API_ORGANIZATION_SETTINGS_URL,
  API_ORGANIZATION_UPDATE_URL,
  API_ORGANIZATION_URL,
  API_ORGANIZATION_USER_CANDIDATES_URL,
  API_ROLE_UPDATE_URL,
  API_ROLES_URL,
} from "@rona/routes/workspace";
import type {
  AuditLogDto,
  MembershipCandidateDto,
  MembershipCreateSchema,
  MembershipUpdateSchema,
  MembershipWithUserDto,
  OrganizationUpdateSchema,
  RoleDto,
  RoleUpdateSchema,
} from "@rona/types/tenancy";

export interface OrganizationRow {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  country: string | null;
  status: "active" | "inactive" | "suspended";
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationSettingsRow {
  id: string;
  organizationId: string;
  currency: "ETB" | "USD";
  createdAt: string;
  updatedAt: string;
}

export const ApiGetOrganization = Request<OrganizationRow>(
  "get",
  API_ORGANIZATION_URL,
);

export const ApiPatchOrganization = Request<
  OrganizationRow,
  OrganizationUpdateSchema
>("patch", API_ORGANIZATION_UPDATE_URL);

export const ApiGetOrganizationSettings = Request<OrganizationSettingsRow>(
  "get",
  API_ORGANIZATION_SETTINGS_URL,
);

export const ApiGetMemberships = Request<MembershipWithUserDto[]>(
  "get",
  API_MEMBERSHIPS_URL,
);

export const ApiPostMembership = Request<
  MembershipWithUserDto,
  MembershipCreateSchema
>("post", API_MEMBERSHIPS_CREATE_URL);

export const ApiPatchMembership = Request<
  MembershipWithUserDto,
  MembershipUpdateSchema
>("patch", API_MEMBERSHIP_UPDATE_URL);

export const ApiDeleteMembership = Request<MembershipWithUserDto>(
  "delete",
  API_MEMBERSHIP_DELETE_URL,
);

export const ApiGetMembershipCandidates = Request<MembershipCandidateDto[]>(
  "get",
  API_ORGANIZATION_USER_CANDIDATES_URL,
);

export const ApiGetRoles = Request<RoleDto[]>("get", API_ROLES_URL);

export const ApiPatchRole = Request<RoleDto, RoleUpdateSchema>(
  "patch",
  API_ROLE_UPDATE_URL,
);

export const ApiGetAuditLogs = Request<AuditLogDto[]>(
  "get",
  API_AUDIT_LOGS_URL,
);
