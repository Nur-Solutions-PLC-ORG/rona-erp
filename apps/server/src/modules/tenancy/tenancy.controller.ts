import { Controller, Get, HttpStatus, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiResponse } from '@rona/types/api';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { TenancyService } from './tenancy.service';
import type { MembershipWithUserDto } from '@rona/types/tenancy';
import type { Session } from '@rona/types/auth';

interface AuthenticatedRequest extends Request {
  session: Session;
}

@Controller('me')
@UseGuards(AuthGuard)
export class TenancyController {
  constructor(private readonly tenancyService: TenancyService) {}

  @Get('memberships')
  async getMyMemberships(
    @Req() req: AuthenticatedRequest,
  ): Promise<ApiResponse<MembershipWithUserDto[]>> {
    const memberships = await this.tenancyService.listUserMemberships(
      req.session.user.id,
    );
    return {
      success: true,
      message: 'Memberships retrieved.',
      data: memberships,
      statusCode: HttpStatus.OK,
    };
  }
}
