import { Injectable } from '@nestjs/common';
import { TenancyRepository } from './tenancy.repository';
import type { MembershipWithUserDto } from '@rona/types/tenancy';

@Injectable()
export class TenancyService {
  constructor(private readonly tenancyRepository: TenancyRepository) {}

  async listUserMemberships(userId: string): Promise<MembershipWithUserDto[]> {
    return this.tenancyRepository.listUserMemberships(userId);
  }
}
