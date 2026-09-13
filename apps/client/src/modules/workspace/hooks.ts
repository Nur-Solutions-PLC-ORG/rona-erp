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
import type { Module } from "@rona/types/auth";
import { useSession } from "@/modules/auth/hooks";

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

const PERMISSION_MODULE: Record<string, Module> = {
  hr: "workforce",
  inventory: "inventory",
  manufacturing: "manufacturing",
  quality: "quality",
  traceability: "traceability",
  sales: "sales",
  finance: "finance",
  organization: "organization",
  membership: "organization",
  role: "organization",
  audit: "organization",
  kiosk: "kiosk",
};

function permissionModule(permission: Permission): Module | null {
  const prefix = permission.split(".")[0];
  return PERMISSION_MODULE[prefix] ?? null;
}

export const usePermissions = () => {
  const { membership } = useCurrentOrganization();
  const { role } = useSession();

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

    const allowedModules =
      role?.modules && role.modules.length > 0
        ? new Set<Module>(role.modules)
        : null;

    if (allowedModules) {
      for (const permission of [...set]) {
        const module = permissionModule(permission);
        if (module && !allowedModules.has(module)) {
          set.delete(permission);
        }
      }
    }

    return set;
  }, [membership, role]);

  return {
    permissions,
    hasPermission: (permission: Permission) => permissions.has(permission),
    hasAnyPermission: (required: Permission[]) =>
      required.some((permission) => permissions.has(permission)),
  };
};
