import { and, asc, eq, inArray } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db } from '@/db';
import { organizations } from '@/db/schemas/admin';
import { users } from '@/db/schemas/auth';
import {
  membershipRoles,
  organizationMemberships,
  rolePermissions,
  roles,
} from '@/db/schemas/tenancy';
import type { MembershipWithUserDto } from '@rona/types/tenancy';

export interface MembershipAccess {
  membershipId: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  userId: string;
}

export interface ActiveMembershipWithOrganization {
  membershipId: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
}

@Injectable()
export class TenancyRepository {
  async findActiveMembershipAccess(
    userId: string,
    organizationId: string,
  ): Promise<MembershipAccess | undefined> {
    const [row] = await db
      .select({
        membershipId: organizationMemberships.id,
        organizationId: organizations.id,
        organizationName: organizations.name,
        organizationSlug: organizations.slug,
        userId: organizationMemberships.userId,
      })
      .from(organizationMemberships)
      .innerJoin(
        organizations,
        eq(organizations.id, organizationMemberships.organizationId),
      )
      .where(
        and(
          eq(organizationMemberships.userId, userId),
          eq(organizationMemberships.organizationId, organizationId),
          eq(organizationMemberships.status, 'active'),
          eq(organizations.status, 'active'),
        ),
      )
      .limit(1);

    return row;
  }

  async findDefaultMembership(
    userId: string,
  ): Promise<ActiveMembershipWithOrganization | undefined> {
    const [row] = await db
      .select({
        membershipId: organizationMemberships.id,
        organizationId: organizations.id,
        organizationName: organizations.name,
        organizationSlug: organizations.slug,
      })
      .from(organizationMemberships)
      .innerJoin(
        organizations,
        eq(organizations.id, organizationMemberships.organizationId),
      )
      .where(
        and(
          eq(organizationMemberships.userId, userId),
          eq(organizationMemberships.status, 'active'),
          eq(organizations.status, 'active'),
        ),
      )
      .orderBy(asc(organizationMemberships.createdAt))
      .limit(1);

    return row;
  }

  async listUserMemberships(userId: string): Promise<MembershipWithUserDto[]> {
    const rows = await db
      .select({
        id: organizationMemberships.id,
        organizationId: organizationMemberships.organizationId,
        userId: organizationMemberships.userId,
        status: organizationMemberships.status,
        createdAt: organizationMemberships.createdAt,
        updatedAt: organizationMemberships.updatedAt,
        organizationName: organizations.name,
        organizationSlug: organizations.slug,
        userFullName: users.fullName,
        userEmail: users.email,
      })
      .from(organizationMemberships)
      .innerJoin(
        organizations,
        eq(organizations.id, organizationMemberships.organizationId),
      )
      .innerJoin(users, eq(users.id, organizationMemberships.userId))
      .where(eq(organizationMemberships.userId, userId))
      .orderBy(asc(organizationMemberships.createdAt));

    if (rows.length === 0) return [];

    const roleRows = await db
      .select({
        membershipId: membershipRoles.membershipId,
        roleKey: roles.key,
      })
      .from(membershipRoles)
      .innerJoin(roles, eq(roles.id, membershipRoles.roleId))
      .where(
        inArray(
          membershipRoles.membershipId,
          rows.map((row) => row.id),
        ),
      );

    const rolesByMembership = new Map<string, string[]>();
    for (const roleRow of roleRows) {
      const list = rolesByMembership.get(roleRow.membershipId) ?? [];
      list.push(roleRow.roleKey);
      rolesByMembership.set(roleRow.membershipId, list);
    }

    const permissionRows = await db
      .selectDistinct({
        membershipId: membershipRoles.membershipId,
        permissionKey: rolePermissions.permissionKey,
      })
      .from(membershipRoles)
      .innerJoin(roles, eq(roles.id, membershipRoles.roleId))
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .where(
        inArray(
          membershipRoles.membershipId,
          rows.map((row) => row.id),
        ),
      );

    const permissionsByMembership = new Map<string, Set<string>>();
    for (const permissionRow of permissionRows) {
      const set =
        permissionsByMembership.get(permissionRow.membershipId) ??
        new Set<string>();
      set.add(permissionRow.permissionKey);
      permissionsByMembership.set(permissionRow.membershipId, set);
    }

    return rows.map((row) => ({
      id: row.id,
      organizationId: row.organizationId,
      userId: row.userId,
      status: row.status,
      roles: rolesByMembership.get(row.id) ?? [],
      permissions: [
        ...(permissionsByMembership.get(row.id) ?? []),
      ] as MembershipWithUserDto['permissions'],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      organization: {
        id: row.organizationId,
        name: row.organizationName,
        slug: row.organizationSlug,
      },
      user: {
        id: row.userId,
        fullName: row.userFullName,
        email: row.userEmail,
      },
    })) as MembershipWithUserDto[];
  }
}
