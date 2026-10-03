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
  ShiftCreateInput,
  ShiftListSearchParams,
  ShiftUpdateInput,
} from '@rona/types/hr';
import {
  shiftCreateSchema,
  shiftListSearchParamsSchema,
  shiftUpdateSchema,
} from '@rona/validation/hr';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { TenantGuard } from '@/modules/tenancy/tenant.guard';
import { PermissionGuard } from '@/modules/rbac/permission.guard';
import { RequirePermissions } from '@/modules/rbac/require-permissions.decorator';
import { ShiftsService } from './shifts.service';

@Controller('shifts')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get()
  @RequirePermissions('hr.schedule.read')
  async listShifts(
    @Query(new ZodValidationPipe(shiftListSearchParamsSchema))
    query: ShiftListSearchParams,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.shiftsService.listShifts(query);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Shifts retrieved successfully.',
      data: result.data,
      meta: result.pagination,
    };
  }

  @Post()
  @RequirePermissions('hr.schedule.create')
  async createShift(
    @Body(new ZodValidationPipe(shiftCreateSchema)) body: ShiftCreateInput,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Shift created successfully.',
      data: await this.shiftsService.createShift(body),
    };
  }

  @Get(':id')
  @RequirePermissions('hr.schedule.read')
  async getShift(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Shift retrieved successfully.',
      data: await this.shiftsService.getShift(id),
    };
  }

  @Patch(':id')
  @RequirePermissions('hr.schedule.update')
  async updateShift(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(shiftUpdateSchema)) body: ShiftUpdateInput,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Shift updated successfully.',
      data: await this.shiftsService.updateShift(id, body),
    };
  }
}
