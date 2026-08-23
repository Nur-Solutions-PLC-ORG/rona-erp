import { Injectable } from '@nestjs/common';
import type {
  PlatformConfigDto,
  PlatformConfigKey,
  PlatformConfigSchema,
} from '@rona/types/admin';
import { PlatformConfigsRepository } from './platform-configs.repository';

@Injectable()
export class PlatformConfigsService {
  constructor(private readonly repository: PlatformConfigsRepository) {}

  async list(): Promise<PlatformConfigDto[]> {
    return this.repository.findMany();
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
