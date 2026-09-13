import { and, eq, inArray, count } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { pooledDb } from '@/db';
import type { Executor } from '@/db/executor';
import {
  membershipRoles,
  organizationMemberships,
  permissions,
  rolePermissions,
  roles,
} from '@/db/schemas/tenancy';
import {
  DEFAULT_ROLE_LIST,
  DEFAULT_ROLE_NAMES,
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_DESCRIPTIONS,
} from '@rona/config/tenancy';
import type { Permission, RoleKey } from '@rona/types/tenancy';

export interface MembershipAccess {
  membershipId: string;
  organizationId: string;
  roles: RoleKey[];
  permissions: Permission[];
}

@Injectable()
export class RbacRepository {
  async resolveMembershipAccess(
    membershipId: string,
    organizationId: string,
  ): Promise<MembershipAccess | undefined> {
    const roleRows = await pooledDb
      .select({
        roleId: roles.id,
        roleKey: roles.key,
      })
      .from(membershipRoles)
      .innerJoin(roles, eq(roles.id, membershipRoles.roleId))
      .where(
        and(
          eq(membershipRoles.membershipId, membershipId),
          eq(roles.organizationId, organizationId),
        ),
      );

    if (roleRows.length === 0) {
      return { membershipId, organizationId, roles: [], permissions: [] };
    }

    const permissionRows = await pooledDb
      .selectDistinct({ permissionKey: rolePermissions.permissionKey })
      .from(rolePermissions)
      .where(
        inArray(
          rolePermissions.roleId,
          roleRows.map((row) => row.roleId),
        ),
      );

    return {
      membershipId,
      organizationId,
      roles: roleRows.map((row) => row.roleKey),
      permissions: permissionRows.map((row) => row.permissionKey),
    };
  }

  async listOrganizationRoles(organizationId: string) {
    return pooledDb
      .select()
      .from(roles)
      .where(eq(roles.organizationId, organizationId));
  }

  async findRoleById(organizationId: string, roleId: string) {
    const [row] = await pooledDb
      .select()
      .from(roles)
      .where(
        and(eq(roles.id, roleId), eq(roles.organizationId, organizationId)),
      )
      .limit(1);
    return row;
  }

  async listRolePermissions(
    roleIds: string[],
  ): Promise<Map<string, Permission[]>> {
    if (roleIds.length === 0) return new Map();

    const rows = await pooledDb
      .select({
        roleId: rolePermissions.roleId,
        permissionKey: rolePermissions.permissionKey,
      })
      .from(rolePermissions)
      .where(inArray(rolePermissions.roleId, roleIds));

    const map = new Map<string, Permission[]>();
    for (const row of rows) {
      const list = map.get(row.roleId) ?? [];
      list.push(row.permissionKey);
      map.set(row.roleId, list);
    }
    return map;
  }

  async replaceRolePermissions(
    roleId: string,
    permissionKeys: Permission[],
    tx?: Executor,
  ): Promise<void> {
    const executor = tx ?? pooledDb;
    await executor
      .delete(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));
    if (permissionKeys.length > 0) {
      await executor.insert(rolePermissions).values(
        permissionKeys.map((permissionKey) => ({
          roleId,
          permissionKey,
        })),
      );
    }
  }

  async listPermissions() {
    return pooledDb.select().from(permissions);
  }

  async upsertPermissions(tx?: Executor): Promise<void> {
    const executor = tx ?? pooledDb;
    await executor
      .insert(permissions)
      .values(
        (Object.keys(PERMISSION_DESCRIPTIONS) as Permission[]).map((key) => ({
          key,
          description: PERMISSION_DESCRIPTIONS[key],
        })),
      )
      .onConflictDoNothing({ target: permissions.key });
  }

  async upsertDefaultRoles(
    organizationId: string,
    tx?: Executor,
  ): Promise<void> {
    const executor = tx ?? pooledDb;

    await executor
      .insert(roles)
      .values(
        DEFAULT_ROLE_LIST.map((key) => ({
          organizationId,
          key,
          name: DEFAULT_ROLE_NAMES[key],
          isSystem: true,
        })),
      )
      .onConflictDoNothing({
        target: [roles.organizationId, roles.key],
      });

    const insertedRoles = await executor
      .select({ id: roles.id, key: roles.key })
      .from(roles)
      .where(eq(roles.organizationId, organizationId));

    const existingAssignments = await executor
      .select({ roleId: rolePermissions.roleId })
      .from(rolePermissions)
      .where(
        inArray(
          rolePermissions.roleId,
          insertedRoles.map((role) => role.id),
        ),
      );
    const rolesWithPermissions = new Set(
      existingAssignments.map((row) => row.roleId),
    );

    const values = insertedRoles.flatMap((role) => {
      if (rolesWithPermissions.has(role.id)) return [];
      return DEFAULT_ROLE_PERMISSIONS[role.key].map((permissionKey) => ({
        roleId: role.id,
        permissionKey,
      }));
    });

    if (values.length > 0) {
      await executor
        .insert(rolePermissions)
        .values(values)
        .onConflictDoNothing();
    }
  }

  async syncDefaultRolePermissions(
    organizationId: string,
    tx?: Executor,
  ): Promise<number> {
    const executor = tx ?? pooledDb;

    const systemRoles = await executor
      .select({ id: roles.id, key: roles.key })
      .from(roles)
      .where(
        and(eq(roles.organizationId, organizationId), eq(roles.isSystem, true)),
      );

    if (systemRoles.length === 0) return 0;

    const desired = new Map<string, Set<Permission>>();
    for (const role of systemRoles) {
      if (role.key in DEFAULT_ROLE_PERMISSIONS) {
        desired.set(role.id, new Set(DEFAULT_ROLE_PERMISSIONS[role.key]));
      }
    }

    const existing = await executor
      .select({
        roleId: rolePermissions.roleId,
        permissionKey: rolePermissions.permissionKey,
      })
      .from(rolePermissions)
      .where(
        inArray(
          rolePermissions.roleId,
          systemRoles.map((role) => role.id),
        ),
      );

    const existingByRole = new Map<string, Set<Permission>>();
    for (const row of existing) {
      const set = existingByRole.get(row.roleId) ?? new Set<Permission>();
      set.add(row.permissionKey);
      existingByRole.set(row.roleId, set);
    }

    const values = systemRoles.flatMap((role) => {
      const wanted = desired.get(role.id);
      if (!wanted) return [];
      const have = existingByRole.get(role.id) ?? new Set<Permission>();
      return [...wanted]
        .filter((permissionKey) => !have.has(permissionKey))
        .map((permissionKey) => ({ roleId: role.id, permissionKey }));
    });

    if (values.length > 0) {
      await executor
        .insert(rolePermissions)
        .values(values)
        .onConflictDoNothing();
    }
    return values.length;
  }

  async findRoleIdByKey(
    organizationId: string,
    roleKey: RoleKey,
    tx?: Executor,
  ): Promise<string | undefined> {
    const executor = tx ?? pooledDb;
    const [role] = await executor
      .select({ id: roles.id })
      .from(roles)
      .where(
        and(eq(roles.organizationId, organizationId), eq(roles.key, roleKey)),
      )
      .limit(1);
    return role?.id;
  }

  async assignRoleToMembership(
    membershipId: string,
    roleKey: RoleKey,
    organizationId: string,
    tx?: Executor,
  ): Promise<void> {
    const executor = tx ?? pooledDb;
    const roleId = await this.findRoleIdByKey(
      organizationId,
      roleKey,
      executor,
    );
    if (!roleId) return;

    await executor
      .insert(membershipRoles)
      .values({ membershipId, roleId })
      .onConflictDoNothing();
  }

  async replaceMembershipRoles(
    membershipId: string,
    roleKeys: RoleKey[],
    organizationId: string,
    tx?: Executor,
  ): Promise<void> {
    const executor = tx ?? pooledDb;

    const orgRoleIds = await executor
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.organizationId, organizationId));

    if (orgRoleIds.length > 0) {
      await executor.delete(membershipRoles).where(
        and(
          eq(membershipRoles.membershipId, membershipId),
          inArray(
            membershipRoles.roleId,
            orgRoleIds.map((role) => role.id),
          ),
        ),
      );
    }

    if (roleKeys.length === 0) return;

    const roleRows = await executor
      .select({ id: roles.id })
      .from(roles)
      .where(
        and(
          eq(roles.organizationId, organizationId),
          inArray(roles.key, roleKeys),
        ),
      );

    if (roleRows.length === 0) return;

    await executor
      .insert(membershipRoles)
      .values(roleRows.map((role) => ({ membershipId, roleId: role.id })))
      .onConflictDoNothing();
  }

  async countActiveOwnerMemberships(organizationId: string): Promise<number> {
    const [row] = await pooledDb
      .select({ value: count() })
      .from(membershipRoles)
      .innerJoin(roles, eq(roles.id, membershipRoles.roleId))
      .innerJoin(
        organizationMemberships,
        eq(organizationMemberships.id, membershipRoles.membershipId),
      )
      .where(
        and(
          eq(roles.organizationId, organizationId),
          eq(roles.key, 'OWNER'),
          eq(organizationMemberships.status, 'active'),
        ),
      );
    return row?.value ?? 0;
  }

  async findMembershipRoleKeys(
    membershipId: string,
    organizationId: string,
  ): Promise<RoleKey[]> {
    const rows = await pooledDb
      .select({ roleKey: roles.key })
      .from(membershipRoles)
      .innerJoin(roles, eq(roles.id, membershipRoles.roleId))
      .where(
        and(
          eq(membershipRoles.membershipId, membershipId),
          eq(roles.organizationId, organizationId),
        ),
      );
    return rows.map((row) => row.roleKey);
  }

  async findMembershipRoleKeysBatch(
    membershipIds: string[],
    organizationId: string,
  ): Promise<Map<string, RoleKey[]>> {
    if (membershipIds.length === 0) return new Map();

    const rows = await pooledDb
      .select({
        membershipId: membershipRoles.membershipId,
        roleKey: roles.key,
      })
      .from(membershipRoles)
      .innerJoin(roles, eq(roles.id, membershipRoles.roleId))
      .where(
        and(
          inArray(membershipRoles.membershipId, membershipIds),
          eq(roles.organizationId, organizationId),
        ),
      );

    const byMembership = new Map<string, RoleKey[]>();
    for (const row of rows) {
      const list = byMembership.get(row.membershipId) ?? [];
      list.push(row.roleKey);
      byMembership.set(row.membershipId, list);
    }
    return byMembership;
  }
}
