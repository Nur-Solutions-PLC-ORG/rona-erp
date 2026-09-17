import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse } from '@rona/types/api';
import type {
  EmployeeFaceEnrollResult,
  EmployeeFaceRevokeResult,
  EmployeeFacesResult,
  FaceEnrollInput,
} from '@rona/types/kiosk';
import { faceEnrollSchema } from '@rona/validation/kiosk';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { TenantGuard } from '@/modules/tenancy/tenant.guard';
import { PermissionGuard } from '@/modules/rbac/permission.guard';
import { RequirePermissions } from '@/modules/rbac/require-permissions.decorator';
import { FaceService } from './face.service';

@Controller('employees/:employeeId/faces')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class EmployeeFacesController {
  constructor(private readonly faceService: FaceService) {}

  @Get()
  @RequirePermissions('hr.employee.update')
  async listFaces(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ): Promise<ApiResponse<EmployeeFacesResult>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Face enrollments retrieved successfully.',
      data: await this.faceService.listFaces(employeeId),
    };
  }

  @Post()
  @RequirePermissions('hr.employee.update')
  async enrollFace(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body(new ZodValidationPipe(faceEnrollSchema))
    body: FaceEnrollInput,
  ): Promise<ApiResponse<EmployeeFaceEnrollResult>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Face enrolled successfully.',
      data: await this.faceService.enrollFace(employeeId, body),
    };
  }

  @Post(':faceId/revoke')
  @RequirePermissions('hr.employee.update')
  async revokeFace(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('faceId', ParseUUIDPipe) faceId: string,
  ): Promise<ApiResponse<EmployeeFaceRevokeResult>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Face revoked successfully.',
      data: await this.faceService.revokeFace(employeeId, faceId),
    };
  }
}