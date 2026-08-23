import { Injectable } from '@nestjs/common';
import type {
  OrganizationSettingsDto,
  OrganizationSettingsListSearchParamsSchema,
  OrganizationSettingsSchema,
  OrganizationSettingsUpdateSchema,
} from '@rona/types/admin';
import {
  AdminOrganizationSettingsExistsException,
  AdminOrganizationSettingsNotFoundException,
} from './organization-settings.exception';
import { OrganizationSettingsRepository } from './organization-settings.repository';

@Injectable()
export class OrganizationSettingsService {
  constructor(private readonly repository: OrganizationSettingsRepository) {}

  async listOrganizationSettings(
    params: OrganizationSettingsListSearchParamsSchema,
  ) {
    const { records, total } = await this.repository.findMany(params);
    const page = params.page ?? 1;
    const limit = params.limit ?? 25;
    return {
      settings: records,
      meta: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrganizationSettings(id: string): Promise<OrganizationSettingsDto> {
    const settings = await this.repository.findById(id);
    if (!settings) throw new AdminOrganizationSettingsNotFoundException();
    return settings;
  }

  async createOrganizationSettings(
    data: OrganizationSettingsSchema,
  ): Promise<OrganizationSettingsDto> {
    if (await this.repository.findByOrganizationId(data.organizationId))
      throw new AdminOrganizationSettingsExistsException();
    return this.repository.create(data);
  }

  async updateOrganizationSettings(
    id: string,
    data: OrganizationSettingsUpdateSchema,
  ): Promise<OrganizationSettingsDto> {
    await this.getOrganizationSettings(id);
    if (
      data.organizationId &&
      (await this.repository.findByOrganizationId(data.organizationId, id))
    )
      throw new AdminOrganizationSettingsExistsException();
    const settings = await this.repository.update(id, data);
    if (!settings) throw new AdminOrganizationSettingsNotFoundException();
    return settings;
  }

  async deleteOrganizationSettings(id: string): Promise<void> {
    if (!(await this.repository.delete(id)))
      throw new AdminOrganizationSettingsNotFoundException();
  }
}
