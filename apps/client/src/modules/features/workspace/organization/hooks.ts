import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TryCatchNullWrap } from "@/api";
import { usePermissions } from "@/modules/workspace/hooks";
import { useCreateMutation } from "@/hooks/utils";
import type { ApiResponse, ResponseMeta } from "@rona/types/api";
import type { Permission } from "@rona/types/tenancy";
import {
  ApiGetAuditLogs,
  ApiGetMembershipCandidates,
  ApiGetMemberships,
  ApiGetOrganization,
  ApiGetOrganizationSettings,
  ApiGetRoles,
  ApiPatchMembership,
  ApiPatchOrganization,
  ApiPatchRole,
  ApiPostMember,
  ApiPostMembership,
  ApiDeleteMembership,
} from "./api";
import type { OrganizationRow } from "./api";
import type {
  MemberCreateSchema,
  MembershipCreateSchema,
  MembershipUpdateSchema,
  MembershipWithUserDto,
  OrganizationUpdateSchema,
  RoleDto,
  RoleUpdateSchema,
} from "@rona/types/tenancy";

const AUDIT_PAGE_SIZE = 25;

function useOrganizationQuery<TDto>(
  permission: Permission,
  queryKey: unknown[],
  queryFn: () => Promise<ApiResponse<TDto[]> | null>,
) {
  const { hasPermission } = usePermissions();

  return useQuery({
    queryKey,
    queryFn,
    enabled: hasPermission(permission),
  });
}

export const useOrganization = () => {
  const { hasPermission } = usePermissions();
  const query = useQuery({
    queryKey: ["organization"],
    queryFn: TryCatchNullWrap(() => ApiGetOrganization()),
    enabled: hasPermission("organization.read"),
  });

  return {
    organization: query.data?.data,
    isLoading: query.isLoading,
  };
};

export const useOrganizationSettings = () => {
  const { hasPermission } = usePermissions();
  const query = useQuery({
    queryKey: ["organization-settings"],
    queryFn: TryCatchNullWrap(() => ApiGetOrganizationSettings()),
    enabled: hasPermission("organization.read"),
  });

  return {
    settings: query.data?.data,
    isLoading: query.isLoading,
  };
};

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<OrganizationRow, OrganizationUpdateSchema>(
    (input) => ApiPatchOrganization({ body: input }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
    (error) => toast.error(error.message),
  );
};

export const useMemberships = () => {
  const query = useOrganizationQuery(
    "membership.read",
    ["organization-memberships"],
    TryCatchNullWrap(() => ApiGetMemberships()),
  );

  return {
    memberships: query.data?.data ?? [],
    isLoading: query.isLoading,
  };
};

export const useMembershipCandidates = (searchQuery: string) => {
  const { hasPermission } = usePermissions();
  const query = useQuery({
    queryKey: ["organization-membership-candidates", searchQuery],
    queryFn: TryCatchNullWrap(() =>
      ApiGetMembershipCandidates({ searchParams: { searchQuery } }),
    ),
    enabled:
      hasPermission("membership.create") && searchQuery.trim().length > 0,
  });

  return {
    candidates: query.data?.data ?? [],
    isLoading: query.isLoading,
  };
};

export const useCreateMembership = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<MembershipWithUserDto, MembershipCreateSchema>(
    (input) => ApiPostMembership({ body: input }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: ["organization-memberships"] });
      // The acting user may have changed their own roles, so refresh the
      // membership/permission set that drives navigation and query gating.
      void queryClient.invalidateQueries({ queryKey: ["me-memberships"] });
    },
    (error) => toast.error(error.message),
  );
};

export const useCreateMember = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<{ email: string }, MemberCreateSchema>(
    (input) => ApiPostMember({ body: input }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: ["organization-memberships"] });
      // The acting user may have changed their own roles, so refresh the
      // membership/permission set that drives navigation and query gating.
      void queryClient.invalidateQueries({ queryKey: ["me-memberships"] });
    },
    (error) => toast.error(error.message),
  );
};

export interface MembershipUpdateInput extends MembershipUpdateSchema {
  id: string;
}

export const useUpdateMembership = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<MembershipWithUserDto, MembershipUpdateInput>(
    ({ id, ...input }) =>
      ApiPatchMembership({ body: input, slugReplacement: { id } }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: ["organization-memberships"] });
      // The acting user may have changed their own roles, so refresh the
      // membership/permission set that drives navigation and query gating.
      void queryClient.invalidateQueries({ queryKey: ["me-memberships"] });
    },
    (error) => toast.error(error.message),
  );
};

export const useDeleteMembership = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<MembershipWithUserDto, string>(
    (id) => ApiDeleteMembership({ slugReplacement: { id } }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: ["organization-memberships"] });
      // The acting user may have changed their own roles, so refresh the
      // membership/permission set that drives navigation and query gating.
      void queryClient.invalidateQueries({ queryKey: ["me-memberships"] });
    },
    (error) => toast.error(error.message),
  );
};

export const useRoles = () => {
  const query = useOrganizationQuery(
    "role.read",
    ["organization-roles"],
    TryCatchNullWrap(() => ApiGetRoles()),
  );

  return {
    roles: query.data?.data ?? [],
    isLoading: query.isLoading,
  };
};

export interface RoleUpdateInput extends RoleUpdateSchema {
  id: string;
}

export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<RoleDto, RoleUpdateInput>(
    ({ id, ...input }) => ApiPatchRole({ body: input, slugReplacement: { id } }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: ["organization-roles"] });
    },
    (error) => toast.error(error.message),
  );
};

export interface AuditFilters {
  action?: string;
  entityType?: string;
  entityId?: string;
  actorId?: string;
}

export const useAuditLogs = (page: number, filters: AuditFilters = {}) => {
  const query = useOrganizationQuery(
    "audit.read",
    [
      "organization-audit-logs",
      page,
      filters.action,
      filters.entityType,
      filters.entityId,
      filters.actorId,
    ],
    TryCatchNullWrap(() =>
      ApiGetAuditLogs({
        searchParams: {
          page,
          limit: AUDIT_PAGE_SIZE,
          action: filters.action,
          entityType: filters.entityType,
          entityId: filters.entityId,
          actorId: filters.actorId,
        },
      }),
    ),
  );

  return {
    logs: query.data?.data ?? [],
    meta: query.data?.meta as ResponseMeta | undefined,
    isLoading: query.isLoading,
  };
};
