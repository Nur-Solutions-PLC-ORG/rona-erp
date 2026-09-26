import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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

@Controller('faces')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
@RequirePermissions('hr.attendance.clock')
export class EmployeeFacesController {
  constructor(private readonly faceService: FaceService) {}

  @Get()
  async listFaces(): Promise<ApiResponse<EmployeeFacesResult>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Face enrollments retrieved successfully.',
      data: await this.faceService.listFaces(),
    };
  }

  @Post('enroll')
  async enrollFace(
    @Body(new ZodValidationPipe(faceEnrollSchema))
    body: FaceEnrollInput,
  ): Promise<ApiResponse<EmployeeFaceEnrollResult>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Face enrolled successfully.',
      data: await this.faceService.enrollFace(body),
    };
  }

  @Post('revoke')
  @HttpCode(HttpStatus.OK)
  async revokeFace(): Promise<ApiResponse<EmployeeFaceRevokeResult>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Face revoked successfully.',
      data: await this.faceService.revokeFace(),
    };
  }
}
