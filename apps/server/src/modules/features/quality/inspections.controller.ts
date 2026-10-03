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
  InspectionCompleteSchema,
  InspectionCreateSchema,
  InspectionListSearchParamsSchema,
  InspectionReviewSchema,
  InspectionTestCreateSchema,
  TestResultCreateSchema,
} from '@rona/types/quality';
import {
  inspectionCompleteSchema,
  inspectionCreateSchema,
  inspectionListSearchParamsSchema,
  inspectionReviewSchema,
  inspectionTestCreateSchema,
  testResultCreateSchema,
} from '@rona/validation/quality';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { TenantGuard } from '@/modules/tenancy/tenant.guard';
import { PermissionGuard } from '@/modules/rbac/permission.guard';
import { RequirePermissions } from '@/modules/rbac/require-permissions.decorator';
import { InspectionsService } from './inspections.service';
import { QualityReviewsService } from './quality-reviews.service';

@Controller('inspections')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class InspectionsController {
  constructor(
    private readonly inspectionsService: InspectionsService,
    private readonly qualityReviewsService: QualityReviewsService,
  ) {}

  @Get()
  @RequirePermissions('quality.inspection.read')
  async listInspections(
    @Query(new ZodValidationPipe(inspectionListSearchParamsSchema))
    query: InspectionListSearchParamsSchema,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.inspectionsService.listInspections(query);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Inspections retrieved successfully.',
      data: result.data,
      meta: result.pagination,
    };
  }

  @Post()
  @RequirePermissions('quality.inspection.create')
  async createInspection(
    @Body(new ZodValidationPipe(inspectionCreateSchema))
    body: InspectionCreateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Inspection created successfully.',
      data: await this.inspectionsService.createInspection(body),
    };
  }

  @Get(':id')
  @RequirePermissions('quality.inspection.read')
  async getInspection(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Inspection retrieved successfully.',
      data: await this.inspectionsService.getInspection(id),
    };
  }

  @Get(':id/tests')
  @RequirePermissions('quality.inspection.read')
  async getInspectionTests(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Inspection tests retrieved successfully.',
      data: await this.inspectionsService.getInspectionTests(id),
    };
  }

  @Post(':id/tests')
  @RequirePermissions('quality.inspection.create')
  async addTest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(inspectionTestCreateSchema))
    body: InspectionTestCreateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Inspection test created successfully.',
      data: await this.inspectionsService.addTest(id, body),
    };
  }

  @Post(':id/tests/:testId/results')
  @RequirePermissions('quality.inspection.create')
  async recordResult(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('testId', ParseUUIDPipe) testId: string,
    @Body(new ZodValidationPipe(testResultCreateSchema))
    body: TestResultCreateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Test result recorded successfully.',
      data: await this.inspectionsService.recordResult(id, testId, body),
    };
  }

  @Post(':id/complete')
  @RequirePermissions('quality.inspection.create')
  async completeInspection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(inspectionCompleteSchema))
    body: InspectionCompleteSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Inspection completed successfully.',
      data: await this.inspectionsService.completeInspection(id, body.notes),
    };
  }

  @Post(':id/release')
  @RequirePermissions('quality.inspection.review', 'quality.inventory.release')
  async releaseInspection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(inspectionReviewSchema))
    body: InspectionReviewSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Inspection reviewed and lot released successfully.',
      data: await this.qualityReviewsService.release(id, body.notes),
    };
  }

  @Post(':id/reject')
  @RequirePermissions('quality.inspection.review', 'quality.inventory.reject')
  async rejectInspection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(inspectionReviewSchema))
    body: InspectionReviewSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Inspection reviewed and lot rejected successfully.',
      data: await this.qualityReviewsService.reject(id, body.notes),
    };
  }
}
