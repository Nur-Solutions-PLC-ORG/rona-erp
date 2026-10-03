import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type {
  OrganizationDto,
  OrganizationListSearchParamsSchema,
  OrganizationSchema,
  OrganizationUpdateSchema,
} from '@rona/types/admin';
import {
  AdminOrganizationNotFoundException,
  AdminOrganizationSlugExistsException,
} from './organizations.exception';
import { OrganizationsRepository } from './organizations.repository';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@rona/config';
import { pooledDb } from '@/db';
import { organizationMemberships } from '@/db/schemas/tenancy';
import { RbacRepository } from '@/modules/rbac/rbac.repository';
import { AuditService } from '@/modules/audit/audit.service';
import { getRequestContext } from '@/context/request-context';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly rbacRepository: RbacRepository,
    private readonly auditService: AuditService,
  ) {}

  async listOrganizations(params: OrganizationListSearchParamsSchema) {
    const { records, total } =
      await this.organizationsRepository.findMany(params);
    const page = params.page ?? DEFAULT_PAGE;
    const limit = params.limit ?? DEFAULT_PAGE_SIZE;
    return {
      organizations: records,
      meta: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrganization(id: string): Promise<OrganizationDto> {
    const organization = await this.organizationsRepository.findById(id);
    if (!organization) throw new AdminOrganizationNotFoundException();
    return organization;
  }

  async createOrganization(data: OrganizationSchema): Promise<OrganizationDto> {
    if (await this.organizationsRepository.findBySlug(data.slug))
      throw new AdminOrganizationSlugExistsException();

    const actorId = getRequestContext()?.userId;

    const organization = await pooledDb.transaction(async (tx) => {
      const created = await this.organizationsRepository.create(data, tx);

      await this.rbacRepository.upsertPermissions(tx);
      await this.rbacRepository.upsertDefaultRoles(created.id, tx);

      if (data.ownerUserId) {
        const [membership] = await tx
          .insert(organizationMemberships)
          .values({
            organizationId: created.id,
            userId: data.ownerUserId,
            status: 'active',
          })
          .returning();

        await this.rbacRepository.assignRoleToMembership(
          membership.id,
          'OWNER',
          created.id,
          tx,
        );
      }

      await this.auditService.record(
        {
          organizationId: created.id,
          actorId,
          action: 'organization.created',
          entityType: 'organization',
          entityId: created.id,
          after: {
            name: created.name,
            slug: created.slug,
            ownerUserId: data.ownerUserId ?? null,
          },
        },
        tx,
      );

      return created;
    });

    return organization;
  }

  async updateOrganization(
    id: string,
    data: OrganizationUpdateSchema,
  ): Promise<OrganizationDto> {
    const existing = await this.getOrganization(id);
    if (
      data.slug &&
      (await this.organizationsRepository.findBySlug(data.slug, id))
    )
      throw new AdminOrganizationSlugExistsException();

    const actorId = getRequestContext()?.userId;

    const organization = await pooledDb.transaction(async (tx) => {
      const updated = await this.organizationsRepository.update(id, data, tx);

      await this.auditService.record(
        {
          organizationId: id,
          actorId,
          action: 'organization.updated',
          entityType: 'organization',
          entityId: id,
          before: {
            name: existing.name,
            slug: existing.slug,
            status: existing.status,
          },
          after: {
            name: updated.name,
            slug: updated.slug,
            status: updated.status,
          },
        },
        tx,
      );

      return updated;
    });

    if (!organization) throw new AdminOrganizationNotFoundException();
    return organization;
  }

  async deleteOrganization(id: string): Promise<void> {
    const existing = await this.getOrganization(id);
    const actorId = getRequestContext()?.userId;

    await pooledDb.transaction(async (tx) => {
      await this.auditService.record(
        {
          organizationId: id,
          actorId,
          action: 'organization.deleted',
          entityType: 'organization',
          entityId: id,
          before: {
            name: existing.name,
            slug: existing.slug,
          },
        },
        tx,
      );

      await tx.execute(
        sql`select set_config('rona.allow_audit_delete', 'on', true)`,
      );

      await this.organizationsRepository.delete(id, tx);
    });
  }
}
