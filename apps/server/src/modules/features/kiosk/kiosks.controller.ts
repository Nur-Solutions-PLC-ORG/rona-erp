import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse } from '@rona/types/api';
import type {
  Kiosk,
  KioskCreateInput,
  KioskEnrollCodeResult,
  KioskListSearchParams,
  KioskRegistrationResult,
  KioskUpdateInput,
  KioskUpdateResult,
} from '@rona/types/kiosk';
import {
  kioskCreateSchema,
  kioskListSearchParamsSchema,
  kioskUpdateSchema,
} from '@rona/validation/kiosk';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { TenantGuard } from '@/modules/tenancy/tenant.guard';
import { PermissionGuard } from '@/modules/rbac/permission.guard';
import { RequirePermissions } from '@/modules/rbac/require-permissions.decorator';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import { KioskService } from './kiosk.service';
import { KioskDeviceService } from './kiosk-device.service';

@Controller('kiosks')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class KiosksController {
  constructor(
    private readonly kioskService: KioskService,
    private readonly kioskDeviceService: KioskDeviceService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Post('enroll-codes')
  @RequirePermissions('hr.credential.enroll')
  async createEnrollCode(): Promise<ApiResponse<KioskEnrollCodeResult>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Enrollment code created. It can be used once on any kiosk.',
      data: await this.kioskDeviceService.createEnrollCode(
        this.tenantContext.organizationId,
        this.tenantContext.userId,
      ),
    };
  }

  @Post()
  @RequirePermissions('kiosk.create')
  async registerKiosk(
    @Body(new ZodValidationPipe(kioskCreateSchema))
    body: KioskCreateInput,
  ): Promise<ApiResponse<KioskRegistrationResult>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Kiosk registered successfully.',
      data: await this.kioskService.registerKiosk(body),
    };
  }

  @Get()
  @RequirePermissions('kiosk.read')
  async listKiosks(
    @Query(new ZodValidationPipe(kioskListSearchParamsSchema))
    query: KioskListSearchParams,
  ): Promise<ApiResponse<Kiosk[]>> {
    const result = await this.kioskService.listKiosks(query);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Kiosks retrieved successfully.',
      data: result.data,
      meta: result.pagination,
    };
  }

  @Get(':id')
  @RequirePermissions('kiosk.read')
  async getKiosk(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<Kiosk>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Kiosk retrieved successfully.',
      data: await this.kioskService.getKiosk(id),
    };
  }

  @Patch(':id')
  @RequirePermissions('kiosk.create')
  async updateKiosk(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(kioskUpdateSchema))
    body: KioskUpdateInput,
  ): Promise<ApiResponse<KioskUpdateResult>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Kiosk updated successfully.',
      data: await this.kioskService.updateKiosk(id, body),
    };
  }

  @Post(':id/unpair')
  @RequirePermissions('kiosk.create')
  async unpairKiosk(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<Kiosk>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Kiosk terminal unpaired. Pair the terminal again to use it.',
      data: await this.kioskService.unpairKiosk(id),
    };
  }

  @Post(':id/activate')
  @RequirePermissions('kiosk.activate')
  async activateKiosk(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<Kiosk>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Kiosk activated successfully.',
      data: await this.kioskService.activateKiosk(id),
    };
  }

  @Post(':id/deactivate')
  @RequirePermissions('kiosk.deactivate')
  async deactivateKiosk(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<Kiosk>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Kiosk deactivated successfully.',
      data: await this.kioskService.deactivateKiosk(id),
    };
  }
}
