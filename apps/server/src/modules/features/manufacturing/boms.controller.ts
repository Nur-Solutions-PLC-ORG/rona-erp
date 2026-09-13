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
  BomCreateSchema,
  BomListSearchParamsSchema,
  BomUpdateSchema,
  BomVersionCreateSchema,
  BomVersionLinesUpdateSchema,
  BomVersionListSearchParamsSchema,
} from '@rona/types/manufacturing';
import {
  bomCreateSchema,
  bomListSearchParamsSchema,
  bomUpdateSchema,
  bomVersionCreateSchema,
  bomVersionLinesUpdateSchema,
  bomVersionListSearchParamsSchema,
} from '@rona/validation/manufacturing';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { TenantGuard } from '@/modules/tenancy/tenant.guard';
import { PermissionGuard } from '@/modules/rbac/permission.guard';
import { RequirePermissions } from '@/modules/rbac/require-permissions.decorator';
import { BomsService } from './boms.service';

@Controller('boms')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class BomsController {
  constructor(private readonly bomsService: BomsService) {}

  @Get()
  @RequirePermissions('manufacturing.bom.read')
  async listBoms(
    @Query(new ZodValidationPipe(bomListSearchParamsSchema))
    query: BomListSearchParamsSchema,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.bomsService.listBoms(query);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'BOMs retrieved successfully.',
      data: result.data,
      meta: result.pagination,
    };
  }

  @Post()
  @RequirePermissions('manufacturing.bom.create')
  async createBom(
    @Body(new ZodValidationPipe(bomCreateSchema)) body: BomCreateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'BOM created successfully.',
      data: await this.bomsService.createBom(body),
    };
  }

  @Get(':id')
  @RequirePermissions('manufacturing.bom.read')
  async getBom(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'BOM retrieved successfully.',
      data: await this.bomsService.getBom(id),
    };
  }

  @Patch(':id')
  @RequirePermissions('manufacturing.bom.update')
  async updateBom(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(bomUpdateSchema)) body: BomUpdateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'BOM updated successfully.',
      data: await this.bomsService.updateBom(id, body),
    };
  }

  @Get(':id/versions')
  @RequirePermissions('manufacturing.bom.read')
  async listVersions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query(new ZodValidationPipe(bomVersionListSearchParamsSchema))
    query: BomVersionListSearchParamsSchema,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.bomsService.listVersions(id, query);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'BOM versions retrieved successfully.',
      data: result.data,
      meta: result.pagination,
    };
  }

  @Post(':id/versions')
  @RequirePermissions('manufacturing.bom.update')
  async createDraftVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(bomVersionCreateSchema))
    body: BomVersionCreateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'BOM draft version created successfully.',
      data: await this.bomsService.createDraftVersion(id, body),
    };
  }

  @Get('versions/:versionId')
  @RequirePermissions('manufacturing.bom.read')
  async getVersion(
    @Param('versionId', ParseUUIDPipe) versionId: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'BOM version retrieved successfully.',
      data: await this.bomsService.getVersion(versionId),
    };
  }

  @Get('versions/:versionId/lines')
  @RequirePermissions('manufacturing.bom.read')
  async getVersionLines(
    @Param('versionId', ParseUUIDPipe) versionId: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'BOM version lines retrieved successfully.',
      data: await this.bomsService.getVersionLines(versionId),
    };
  }

  @Patch('versions/:versionId/lines')
  @RequirePermissions('manufacturing.bom.update')
  async updateDraftVersionLines(
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Body(new ZodValidationPipe(bomVersionLinesUpdateSchema))
    body: BomVersionLinesUpdateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'BOM version lines updated successfully.',
      data: await this.bomsService.updateDraftVersionLines(versionId, body),
    };
  }

  @Post('versions/:versionId/approve')
  @RequirePermissions('manufacturing.bom.approve')
  async approveVersion(
    @Param('versionId', ParseUUIDPipe) versionId: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'BOM version approved successfully.',
      data: await this.bomsService.approveVersion(versionId),
    };
  }

  @Post('versions/:versionId/retire')
  @RequirePermissions('manufacturing.bom.approve')
  async retireVersion(
    @Param('versionId', ParseUUIDPipe) versionId: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'BOM version retired successfully.',
      data: await this.bomsService.retireVersion(versionId),
    };
  }
}
