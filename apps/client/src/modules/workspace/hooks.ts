import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Request, TryCatchNullWrap } from "@/api";
import { useOrganizationStore } from "@/store/organization";
import { API_ME_MEMBERSHIPS_URL } from "@rona/routes/workspace";
import { DEFAULT_ROLE_PERMISSIONS } from "@rona/config/tenancy";
import type {
  MembershipWithUserDto,
  Permission,
  RoleKey,
} from "@rona/types/tenancy";

export const ApiGetMyMemberships = Request<MembershipWithUserDto[]>(
  "get",
  API_ME_MEMBERSHIPS_URL,
);

export const useMyMemberships = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["me-memberships"],
    queryFn: TryCatchNullWrap(ApiGetMyMemberships),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const memberships = data?.data ?? [];

  return {
    memberships,
    isLoading,
  };
};

export const useCurrentOrganization = () => {
  const { memberships, isLoading } = useMyMemberships();
  const organizationId = useOrganizationStore((s) => s.organizationId);

  const activeMemberships = useMemo(
    () => memberships.filter((m) => m.status === "active"),
    [memberships],
  );

  const current = useMemo(() => {
    const fromStore = activeMemberships.find(
      (m) => m.organizationId === organizationId,
    );
    return fromStore ?? activeMemberships[0];
  }, [activeMemberships, organizationId]);

  return {
    organization: current?.organization,
    membership: current,
    memberships: activeMemberships,
    organizationId: current?.organizationId ?? null,
    isLoading,
  };
};

export const usePermissions = () => {
  const { membership } = useCurrentOrganization();

  // Authorize strictly from the active organization membership, mirroring the
  // server-side PermissionGuard. The user's global `session.role.modules` list
  // is a separate, platform-level setting that must not veto permissions granted
  // by an organization role (e.g. assigning "Manufacturing" previously had no
  // effect because `manufacturing.*` was stripped for users whose global module
  // list did not include "manufacturing").
  const permissions = useMemo(() => {
    const set = new Set<Permission>();

    if (membership?.permissions && membership.permissions.length > 0) {
      for (const permission of membership.permissions) {
        set.add(permission);
      }
    } else {
      const roleKeys = (membership?.roles ?? []) as RoleKey[];
      for (const roleKey of roleKeys) {
        const rolePermissions = DEFAULT_ROLE_PERMISSIONS[roleKey];
        if (rolePermissions) {
          for (const permission of rolePermissions) {
            set.add(permission);
          }
        }
      }
    }

    return set;
  }, [membership]);

  return {
    permissions,
    hasPermission: (permission: Permission) => permissions.has(permission),
    hasAnyPermission: (required: Permission[]) =>
      required.some((permission) => permissions.has(permission)),
  };
};
