import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse } from '@rona/types/api';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { TenantGuard } from '@/modules/tenancy/tenant.guard';
import { PermissionGuard } from '@/modules/rbac/permission.guard';
import { RequirePermissions } from '@/modules/rbac/require-permissions.decorator';
import { TraceabilityService } from './traceability.service';

@Controller('lots')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class TraceabilityController {
  constructor(private readonly traceabilityService: TraceabilityService) {}

  @Get(':lotId')
  @RequirePermissions('traceability.read')
  async getLotDetail(
    @Param('lotId', ParseUUIDPipe) lotId: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Lot detail retrieved successfully.',
      data: await this.traceabilityService.getLotDetail(lotId),
    };
  }

  @Get(':lotId/forward')
  @RequirePermissions('traceability.read')
  async getForwardTrace(
    @Param('lotId', ParseUUIDPipe) lotId: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Forward trace retrieved successfully.',
      data: await this.traceabilityService.getForwardTrace(lotId),
    };
  }

  @Get(':lotId/reverse')
  @RequirePermissions('traceability.read')
  async getReverseTrace(
    @Param('lotId', ParseUUIDPipe) lotId: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Reverse trace retrieved successfully.',
      data: await this.traceabilityService.getReverseTrace(lotId),
    };
  }
}
