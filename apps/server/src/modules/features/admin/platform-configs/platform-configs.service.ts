import { Injectable } from '@nestjs/common';
import type {
  PlatformConfigDto,
  PlatformConfigKey,
  PlatformConfigSchema,
  ConfigsListSearchParamsSchema,
} from '@rona/types/admin';
import { PlatformConfigsRepository } from './platform-configs.repository';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@rona/config';

@Injectable()
export class PlatformConfigsService {
  constructor(private readonly repository: PlatformConfigsRepository) {}

  async list(params: ConfigsListSearchParamsSchema) {
    const { records, total } = await this.repository.findMany(params);
    const page = params.page ?? DEFAULT_PAGE;
    const limit = params.limit ?? DEFAULT_PAGE_SIZE;
    return {
      configs: records,
      meta: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async get(key: PlatformConfigKey): Promise<PlatformConfigDto | undefined> {
    return this.repository.findByKey(key);
  }

  async reset(): Promise<PlatformConfigDto[]> {
    return this.repository.reset();
  }

  async update(
    key: PlatformConfigKey,
    data: Partial<PlatformConfigSchema>,
  ): Promise<PlatformConfigDto | undefined> {
    if (!data.value || !data.type) return undefined;
    return this.repository.update(key, { value: data.value, type: data.type });
  }
}
