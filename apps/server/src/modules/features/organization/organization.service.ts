import { Injectable } from '@nestjs/common';
import { pooledDb } from '@/db';
import { AuditService } from '@/modules/audit/audit.service';
import { RbacRepository } from '@/modules/rbac/rbac.repository';
import { RbacService } from '@/modules/rbac/rbac.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import { OrganizationRepository } from './organization.repository';
import type {
  OrganizationUpdateSchema,
  RoleDto,
  RoleUpdateSchema,
} from '@rona/types/tenancy';
import {
  OrganizationNotFoundException,
  RoleNotFoundException,
  SystemRoleModificationException,
} from '@/modules/tenancy/tenancy.exception';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly rbacRepository: RbacRepository,
    private readonly rbacService: RbacService,
    private readonly auditService: AuditService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async getCurrentOrganization() {
    const organization =
      await this.organizationRepository.findCurrentOrganization();
    if (!organization) {
      throw new OrganizationNotFoundException();
    }
    return organization;
  }

  async getSettings() {
    return this.organizationRepository.findSettings();
  }

  async updateOrganization(data: OrganizationUpdateSchema) {
    const organizationId = this.tenantContext.organizationId;
    const actorId = this.tenantContext.userId;

    const existing =
      await this.organizationRepository.findCurrentOrganization();
    if (!existing) throw new OrganizationNotFoundException();

    const updated = await pooledDb.transaction(async (tx) => {
      const organization = await this.organizationRepository.updateOrganization(
        data,
        tx,
      );

      await this.auditService.record(
        {
          organizationId,
          actorId,
          action: 'organization.updated',
          entityType: 'organization',
          entityId: organizationId,
          before: {
            name: existing.name,
            slug: existing.slug,
            email: existing.email,
            phone: existing.phone,
            country: existing.country,
            status: existing.status,
          },
          after: {
            name: organization.name,
            slug: organization.slug,
            email: organization.email,
            phone: organization.phone,
            country: organization.country,
            status: organization.status,
          },
        },
        tx,
      );

      return organization;
    });

    return updated;
  }

  async listRoles(): Promise<RoleDto[]> {
    const organizationId = this.tenantContext.organizationId;
    const roleRows =
      await this.rbacRepository.listOrganizationRoles(organizationId);
    const permissionsByRole = await this.rbacRepository.listRolePermissions(
      roleRows.map((role) => role.id),
    );

    return roleRows.map((role) => ({
      id: role.id,
      organizationId: role.organizationId,
      key: role.key,
      name: role.name,
      permissions: permissionsByRole.get(role.id) ?? [],
      isSystem: role.isSystem,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }));
  }

  async updateRolePermissions(id: string, data: RoleUpdateSchema) {
    const organizationId = this.tenantContext.organizationId;
    const actorId = this.tenantContext.userId;

    const role = await this.rbacRepository.findRoleById(organizationId, id);
    if (!role) throw new RoleNotFoundException();

    if (role.isSystem && role.key === 'OWNER') {
      throw new SystemRoleModificationException(
        'The OWNER role permissions cannot be modified.',
      );
    }

    const beforePermissions =
      (await this.rbacRepository.listRolePermissions([role.id])).get(role.id) ??
      [];

    await pooledDb.transaction(async (tx) => {
      await this.rbacRepository.replaceRolePermissions(
        role.id,
        data.permissions,
        tx,
      );

      await this.auditService.record(
        {
          organizationId,
          actorId,
          action: 'role.updated',
          entityType: 'role',
          entityId: role.id,
          before: { key: role.key, permissions: beforePermissions },
          after: { key: role.key, permissions: data.permissions },
        },
        tx,
      );
    });

    await this.rbacService.invalidateOrganization(organizationId);

    return this.rbacRepository.findRoleById(organizationId, id);
  }

  async listAuditLogs(filters: {
    action?: string;
    entityType?: string;
    entityId?: string;
    actorId?: string;
    limit: number;
    offset: number;
  }) {
    const organizationId = this.tenantContext.organizationId;

    const [records, total] = await Promise.all([
      this.auditService.list(organizationId, filters),
      this.auditService.count(organizationId, filters),
    ]);

    return {
      records,
      meta: {
        totalItems: total,
        limit: filters.limit,
        offset: filters.offset,
      },
    };
  }
}
