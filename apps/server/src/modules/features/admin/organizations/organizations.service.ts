import { Injectable } from '@nestjs/common';
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

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly organizationsRepository: OrganizationsRepository,
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
    return this.organizationsRepository.create(data);
  }

  async updateOrganization(
    id: string,
    data: OrganizationUpdateSchema,
  ): Promise<OrganizationDto> {
    await this.getOrganization(id);
    if (
      data.slug &&
      (await this.organizationsRepository.findBySlug(data.slug, id))
    )
      throw new AdminOrganizationSlugExistsException();
    const organization = await this.organizationsRepository.update(id, data);
    if (!organization) throw new AdminOrganizationNotFoundException();
    return organization;
  }

  async deleteOrganization(id: string): Promise<void> {
    if (!(await this.organizationsRepository.delete(id)))
      throw new AdminOrganizationNotFoundException();
  }
}
