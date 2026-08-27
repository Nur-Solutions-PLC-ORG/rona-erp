import { Controller, Get, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiResponse } from '@rona/types/api';
import type { AdminDashboardStatus } from '@rona/types/admin';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { Roles } from '@/modules/auth/guards/roles.decorator';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { DashboardService } from './dashboard.service';

@Controller()
@UseGuards(AuthGuard, RolesGuard)
@Roles('super_admin')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getStatus(): Promise<ApiResponse<AdminDashboardStatus>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Admin dashboard status retrieved successfully.',
      data: await this.dashboardService.getStatus(),
    };
  }
}
