import { Injectable } from '@nestjs/common';
import type {
  MembershipCreateSchema,
  MembershipUpdateSchema,
} from '@rona/types/tenancy';
import { AuditService } from '@/modules/audit/audit.service';
import { RbacService } from '@/modules/rbac/rbac.service';
import { RbacRepository } from '@/modules/rbac/rbac.repository';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import { OrganizationRepository } from './organization.repository';
import {
  LastOwnerMembershipException,
  MembershipAlreadyExistsException,
  MembershipNotFoundException,
  UserNotFoundException,
} from '@/modules/tenancy/tenancy.exception';
import { pooledDb } from '@/db';

@Injectable()
export class MembershipsService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly rbacRepository: RbacRepository,
    private readonly rbacService: RbacService,
    private readonly auditService: AuditService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async listMemberships() {
    const rows = await this.organizationRepository.listMemberships();

    const rolesByMembership =
      await this.rbacRepository.findMembershipRoleKeysBatch(
        rows.map((row) => row.id),
        this.tenantContext.organizationId,
      );

    return rows.map((row) => ({
      id: row.id,
      organizationId: row.organizationId,
      userId: row.userId,
      status: row.status,
      roles: rolesByMembership.get(row.id) ?? [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      user: {
        id: row.userId,
        fullName: row.userFullName,
        email: row.userEmail,
      },
    }));
  }

  async searchCandidateUsers(searchQuery: string) {
    return this.organizationRepository.searchCandidateUsers(searchQuery);
  }

  async getMembership(id: string) {
    const membership = await this.organizationRepository.findMembershipById(id);
    if (!membership) throw new MembershipNotFoundException();

    return {
      id: membership.id,
      organizationId: membership.organizationId,
      userId: membership.userId,
      status: membership.status,
      roles: await this.rbacRepository.findMembershipRoleKeys(
        membership.id,
        this.tenantContext.organizationId,
      ),
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt,
      user: {
        id: membership.userId,
        fullName: membership.userFullName,
        email: membership.userEmail,
      },
    };
  }

  async createMembership(data: MembershipCreateSchema) {
    const organizationId = this.tenantContext.organizationId;
    const userId = this.tenantContext.userId;

    const targetUser = await this.organizationRepository.findUserById(
      data.userId,
    );
    if (!targetUser) throw new UserNotFoundException();

    const existing = await this.organizationRepository.findMembershipByUser(
      data.userId,
    );
    if (existing) throw new MembershipAlreadyExistsException();

    const created = await pooledDb.transaction(async (tx) => {
      const membership = await this.organizationRepository.createMembership(
        data.userId,
        'active',
        tx,
      );
      if (!membership) throw new MembershipAlreadyExistsException();

      for (const roleKey of data.roleKeys) {
        await this.rbacRepository.assignRoleToMembership(
          membership.id,
          roleKey,
          organizationId,
          tx,
        );
      }

      await this.auditService.record(
        {
          organizationId,
          actorId: userId,
          action: 'membership.created',
          entityType: 'membership',
          entityId: membership.id,
          after: {
            userId: data.userId,
            status: membership.status,
            roles: data.roleKeys,
          },
        },
        tx,
      );

      return membership;
    });

    await this.rbacService.invalidateMembership(created.id, organizationId);

    return created;
  }

  async updateMembership(id: string, data: MembershipUpdateSchema) {
    const organizationId = this.tenantContext.organizationId;
    const userId = this.tenantContext.userId;

    const existing = await this.organizationRepository.findMembershipById(id);
    if (!existing) throw new MembershipNotFoundException();

    const existingRoles = await this.rbacRepository.findMembershipRoleKeys(
      id,
      organizationId,
    );

    if (
      existing.status === 'active' &&
      existingRoles.includes('OWNER') &&
      data.status !== undefined &&
      data.status !== 'active' &&
      (await this.rbacRepository.countActiveOwnerMemberships(organizationId)) <=
        1
    ) {
      throw new LastOwnerMembershipException();
    }

    if (
      existingRoles.includes('OWNER') &&
      data.roleKeys !== undefined &&
      !data.roleKeys.includes('OWNER') &&
      (await this.rbacRepository.countActiveOwnerMemberships(organizationId)) <=
        1
    ) {
      throw new LastOwnerMembershipException();
    }

    const updated = await pooledDb.transaction(async (tx) => {
      const membership =
        data.status !== undefined
          ? await this.organizationRepository.updateMembership(
              id,
              { status: data.status },
              tx,
            )
          : existing;

      if (data.roleKeys !== undefined) {
        await this.rbacRepository.replaceMembershipRoles(
          id,
          data.roleKeys,
          organizationId,
          tx,
        );
      }

      await this.auditService.record(
        {
          organizationId,
          actorId: userId,
          action: 'membership.updated',
          entityType: 'membership',
          entityId: id,
          before: {
            status: existing.status,
            roles: existingRoles,
          },
          after: {
            status: data.status ?? existing.status,
            roles: data.roleKeys ?? existingRoles,
          },
        },
        tx,
      );

      return membership ?? existing;
    });

    await this.rbacService.invalidateMembership(id, organizationId);
    return updated;
  }

  async deleteMembership(id: string) {
    const organizationId = this.tenantContext.organizationId;
    const userId = this.tenantContext.userId;

    const existing = await this.organizationRepository.findMembershipById(id);
    if (!existing) throw new MembershipNotFoundException();

    const existingRoles = await this.rbacRepository.findMembershipRoleKeys(
      id,
      organizationId,
    );

    if (
      existing.status === 'active' &&
      existingRoles.includes('OWNER') &&
      (await this.rbacRepository.countActiveOwnerMemberships(organizationId)) <=
        1
    ) {
      throw new LastOwnerMembershipException();
    }

    await pooledDb.transaction(async (tx) => {
      await this.organizationRepository.deleteMembership(id, tx);
      await this.auditService.record(
        {
          organizationId,
          actorId: userId,
          action: 'membership.deleted',
          entityType: 'membership',
          entityId: id,
          before: {
            status: existing.status,
            roles: existingRoles,
            userId: existing.userId,
          },
        },
        tx,
      );
    });

    await this.rbacService.invalidateMembership(id, organizationId);
  }
}
