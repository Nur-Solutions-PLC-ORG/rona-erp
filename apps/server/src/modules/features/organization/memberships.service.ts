import { Injectable, Logger } from '@nestjs/common';
import type {
  MemberCreateSchema,
  MembershipCreateSchema,
  MembershipUpdateSchema,
} from '@rona/types/tenancy';
import type { Position } from '@rona/types/auth';
import type { RoleKey } from '@rona/types/tenancy';
import { MODULE_LIST } from '@rona/config/auth';
import { AuditService } from '@/modules/audit/audit.service';
import { RbacService } from '@/modules/rbac/rbac.service';
import { RbacRepository } from '@/modules/rbac/rbac.repository';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import { OrganizationRepository } from './organization.repository';
import {
  LastOwnerMembershipException,
  MemberEmailExistsException,
  MembershipAlreadyExistsException,
  MembershipNotFoundException,
  UserNotFoundException,
} from '@/modules/tenancy/tenancy.exception';
import { pooledDb } from '@/db';
import * as bcrypt from 'bcrypt';
import { generateCombinations } from '@/lib/combinations';
import { sendAccountCredentialsEmail } from '@/emails/mailer';
import { sendTelegramCredentialsToChat } from '@/emails/telegram';

@Injectable()
export class MembershipsService {
  private readonly logger = new Logger(MembershipsService.name);

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

    await this.rbacRepository.upsertDefaultRoles(organizationId);

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

  async createMemberAccount(data: MemberCreateSchema) {
    const organizationId = this.tenantContext.organizationId;
    const actorId = this.tenantContext.userId;

    const existingUser = await this.organizationRepository.findUserByEmail(
      data.email,
    );
    if (existingUser) throw new MemberEmailExistsException();

    const password = this.generatePassword();
    const passwordHash = await bcrypt.hash(password, 10);

    const newUserId = await this.organizationRepository.createUserWithRole(
      {
        fullName: data.fullName,
        email: data.email.toLowerCase(),
        passwordHash,
        status: 'active',
        mustChangePassword: true,
        isEmailVerified: true,
      },
      {
        position: this.derivePosition(data.roleKeys),
        module: [...MODULE_LIST],
      },
    );

    await this.rbacRepository.upsertDefaultRoles(organizationId);

    const created = await pooledDb.transaction(async (tx) => {
      const membership = await this.organizationRepository.createMembership(
        newUserId,
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
          actorId,
          action: 'member.created',
          entityType: 'membership',
          entityId: membership.id,
          after: {
            userId: newUserId,
            fullName: data.fullName,
            email: data.email,
            roles: data.roleKeys,
          },
        },
        tx,
      );

      return membership;
    });

    await this.rbacService.invalidateMembership(created.id, organizationId);

    void this.deliverMemberCredentials(
      data.email,
      password,
      data.fullName ?? undefined,
    );

    return { email: data.email };
  }

  private derivePosition(roleKeys: RoleKey[]): Position {
    if (roleKeys.includes('OWNER')) return 'owner';
    if (roleKeys.includes('ADMIN')) return 'admin';
    if (
      roleKeys.includes('MANAGER') ||
      roleKeys.includes('WAREHOUSE_MANAGER') ||
      roleKeys.includes('PRODUCTION_MANAGER') ||
      roleKeys.includes('QUALITY_MANAGER') ||
      roleKeys.includes('HR_MANAGER') ||
      roleKeys.includes('SALES_MANAGER') ||
      roleKeys.includes('FINANCE_MANAGER')
    ) {
      return 'manager';
    }
    return 'staff';
  }

  private generatePassword(): string {
    return generateCombinations({
      length: 10,
      includeNumbers: true,
      includeUppercase: true,
      includeLowercase: true,
      includeSymbols: false,
    });
  }

  private async deliverMemberCredentials(
    email: string,
    password: string,
    fullName?: string,
  ) {
    const chatId =
      await this.organizationRepository.findTelegramChatIdByEmail(email);

    sendAccountCredentialsEmail(email, password, fullName).catch((error) => {
      this.logger.warn(`Member credential email failed: ${String(error)}`);
    });

    if (chatId) {
      void sendTelegramCredentialsToChat(
        chatId,
        email,
        password,
        fullName ?? '',
      ).catch((error) => {
        this.logger.warn(`Member credential telegram failed: ${String(error)}`);
      });
    }
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
