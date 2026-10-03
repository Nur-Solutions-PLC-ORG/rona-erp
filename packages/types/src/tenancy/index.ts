import {
  DEFAULT_ROLE_LIST,
  MEMBERSHIP_STATUS_LIST,
  PERMISSION_LIST,
} from "@rona/config/tenancy";
import {
  auditListSearchParamsSchema,
  membershipCandidateSearchParamsSchema,
  membershipCreateSchema,
  memberCreateSchema,
  membershipListSearchParamsSchema,
  membershipStatusUpdateSchema,
  membershipUpdateSchema,
  membershipDto,
  membershipWithUserDto,
  organizationUpdateSchema,
  roleDto,
  roleListSearchParamsSchema,
  roleUpdateSchema,
  auditLogDto,
} from "@rona/validation/tenancy";
import z from "zod";

export type MembershipStatus = (typeof MEMBERSHIP_STATUS_LIST)[number];
export type RoleKey = (typeof DEFAULT_ROLE_LIST)[number];
export type Permission = (typeof PERMISSION_LIST)[number];

export type MembershipCreateSchema = z.infer<typeof membershipCreateSchema>;
export type MemberCreateSchema = z.infer<typeof memberCreateSchema>;
export type MembershipUpdateSchema = z.infer<typeof membershipUpdateSchema>;
export type MembershipStatusUpdateSchema = z.infer<
  typeof membershipStatusUpdateSchema
>;
export type MembershipListSearchParamsSchema = z.infer<
  typeof membershipListSearchParamsSchema
>;
export type MembershipCandidateSearchParams = z.infer<
  typeof membershipCandidateSearchParamsSchema
>;
export type OrganizationUpdateSchema = z.infer<
  typeof organizationUpdateSchema
>;
export type RoleListSearchParamsSchema = z.infer<
  typeof roleListSearchParamsSchema
>;
export type RoleUpdateSchema = z.infer<typeof roleUpdateSchema>;
export type AuditListSearchParamsSchema = z.infer<
  typeof auditListSearchParamsSchema
>;

export type MembershipDto = z.infer<typeof membershipDto>;
export type MembershipWithUserDto = z.infer<typeof membershipWithUserDto>;
export type RoleDto = z.infer<typeof roleDto>;
export type AuditLogDto = z.infer<typeof auditLogDto>;

export interface MembershipCandidateDto {
  id: string;
  fullName: string;
  email: string | null;
}

export interface TenantContext {
  organizationId: string;
  userId: string;
  membershipId: string;
  roles: RoleKey[];
  permissions: Permission[];
}
