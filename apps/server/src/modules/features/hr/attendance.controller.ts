import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse } from '@rona/types/api';
import type {
  AttendanceListSearchParams,
  AttendanceManageInput,
  AttendanceSelfInput,
} from '@rona/types/hr';
import {
  attendanceListSearchParamsSchema,
  attendanceManageSchema,
  attendanceSelfSchema,
} from '@rona/validation/hr';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { TenantGuard } from '@/modules/tenancy/tenant.guard';
import { PermissionGuard } from '@/modules/rbac/permission.guard';
import { RequirePermissions } from '@/modules/rbac/require-permissions.decorator';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  @RequirePermissions('hr.attendance.read')
  async listEvents(
    @Query(new ZodValidationPipe(attendanceListSearchParamsSchema))
    query: AttendanceListSearchParams,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.attendanceService.listEvents(query);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Attendance events retrieved successfully.',
      data: result.data,
      meta: result.pagination,
    };
  }

  @Post('self')
  @RequirePermissions('hr.attendance.clock')
  async punchSelf(
    @Body(new ZodValidationPipe(attendanceSelfSchema))
    body: AttendanceSelfInput,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Attendance event recorded successfully.',
      data: await this.attendanceService.punchSelf(body),
    };
  }

  @Get('status')
  @RequirePermissions('hr.attendance.clock')
  async getSelfStatus(): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Attendance status retrieved successfully.',
      data: await this.attendanceService.getSelfStatus(),
    };
  }

  @Get('status/:employeeId')
  @RequirePermissions('hr.attendance.read')
  async getStatusForEmployee(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Attendance status retrieved successfully.',
      data: await this.attendanceService.getStatusForEmployee(employeeId),
    };
  }

  @Post()
  @RequirePermissions('hr.attendance.manage')
  async punchManaged(
    @Body(new ZodValidationPipe(attendanceManageSchema))
    body: AttendanceManageInput,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Attendance event recorded successfully.',
      data: await this.attendanceService.punchManaged(body),
    };
  }
}
