import { and, asc, eq, sql } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db } from '@/db';
import {
  branches,
  departments,
  employees,
  positions,
} from '@/db/schemas/admin';
import { users } from '@/db/schemas/auth';
import {
  membershipRoles,
  organizationMemberships,
  roles,
} from '@/db/schemas/tenancy';
import { TenantScopedRepository } from '@/modules/tenancy/tenant-scoped.repository';
import type {
  DepartmentRecord,
  OrganizationContext,
  OrganizationMemberRecord,
  PeriodSpec,
  PositionRecord,
} from '../types/ai-contexts.types.js';

@Injectable()
export class AiOrganizationRepository extends TenantScopedRepository {
  async fetchOrganization(period: PeriodSpec): Promise<OrganizationContext> {
    const [membershipRows, roleRows, deptRows, positionRows, branchRows] =
      await Promise.all([
        this.loadMemberships(),
        this.loadMemberRoles(),
        this.loadDepartments(),
        this.loadPositions(),
        this.loadBranches(),
      ]);

    const rolesByMembership = new Map<string, string[]>();
    for (const row of roleRows) {
      const list = rolesByMembership.get(row.membershipId) ?? [];
      list.push(row.roleKey);
      rolesByMembership.set(row.membershipId, list);
    }

    const members = membershipRows.map<OrganizationMemberRecord>((m) => ({
      userId: m.userId,
      fullName: m.fullName,
      email: m.email,
      membershipStatus: m.membershipStatus,
      roles: rolesByMembership.get(m.id) ?? [],
    }));

    const totalMemberCount = members.length;
    const activeMemberCount = members.filter(
      (m) => m.membershipStatus === 'active',
    ).length;
    const suspendedMemberCount = members.filter(
      (m) => m.membershipStatus === 'suspended',
    ).length;

    const departments: DepartmentRecord[] = deptRows.map((d) => ({
      name: d.name,
      code: d.code,
      headcount: d.headcount,
    }));

    const positionsList: PositionRecord[] = positionRows.map((p) => ({
      title: p.title,
      code: p.code,
      department: p.departmentName,
    }));

    return {
      tenantId: this.organizationId,
      domain: 'organization',
      periodLabel: period.label,
      periodStart: period.start,
      periodEnd: period.end,
      generatedAt: new Date(),
      sourceSystem: 'rona-erp',
      recordCountTruncated: false,
      totalMemberCount,
      activeMemberCount,
      suspendedMemberCount,
      totalRoleCount: new Set([...rolesByMembership.values()].flat()).size,
      departmentCount: departments.length,
      branchCount: branchRows.length,
      members,
      departments,
      positions: positionsList,
      branches: branchRows.map((b) => b.name),
    };
  }

  private loadMemberships() {
    return db
      .select({
        id: organizationMemberships.id,
        userId: users.id,
        fullName: users.fullName,
        email: users.email,
        membershipStatus: organizationMemberships.status,
      })
      .from(organizationMemberships)
      .innerJoin(users, eq(users.id, organizationMemberships.userId))
      .where(eq(organizationMemberships.organizationId, this.organizationId))
      .orderBy(asc(users.fullName));
  }

  private loadMemberRoles() {
    return db
      .select({
        membershipId: membershipRoles.membershipId,
        roleKey: roles.key,
      })
      .from(membershipRoles)
      .innerJoin(
        roles,
        and(
          eq(roles.id, membershipRoles.roleId),
          eq(roles.organizationId, this.organizationId),
        ),
      )
      .innerJoin(
        organizationMemberships,
        eq(organizationMemberships.id, membershipRoles.membershipId),
      )
      .where(eq(organizationMemberships.organizationId, this.organizationId));
  }

  private loadDepartments() {
    return db
      .select({
        name: departments.name,
        code: departments.code,
        headcount: sql<number>`coalesce(count(${employees.id}), 0)`,
      })
      .from(departments)
      .leftJoin(
        employees,
        and(
          eq(employees.departmentId, departments.id),
          eq(employees.organizationId, this.organizationId),
          sql`${employees.archivedAt} is null`,
        ),
      )
      .where(eq(departments.organizationId, this.organizationId))
      .groupBy(departments.id)
      .orderBy(asc(departments.name));
  }

  private loadPositions() {
    return db
      .select({
        title: positions.title,
        code: positions.code,
        departmentName: departments.name,
      })
      .from(positions)
      .leftJoin(
        departments,
        and(
          eq(departments.id, positions.departmentId),
          eq(departments.organizationId, this.organizationId),
        ),
      )
      .where(
        and(
          eq(positions.organizationId, this.organizationId),
          sql`${positions.archivedAt} is null`,
        ),
      )
      .orderBy(asc(positions.title));
  }

  private loadBranches() {
    return db
      .select({ name: branches.name })
      .from(branches)
      .where(eq(branches.organizationId, this.organizationId))
      .orderBy(asc(branches.name));
  }
}
