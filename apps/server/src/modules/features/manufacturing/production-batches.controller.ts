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
  BatchListSearchParamsSchema,
  MaterialConsumptionSchema,
  MaterialReturnSchema,
  ProductionOutputSchema,
} from '@rona/types/manufacturing';
import {
  batchListSearchParamsSchema,
  materialConsumptionSchema,
  materialReturnSchema,
  productionOutputSchema,
} from '@rona/validation/manufacturing';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { TenantGuard } from '@/modules/tenancy/tenant.guard';
import { PermissionGuard } from '@/modules/rbac/permission.guard';
import { RequirePermissions } from '@/modules/rbac/require-permissions.decorator';
import { ProductionBatchesService } from './production-batches.service';
import { ProductionMaterialsService } from './production-materials.service';
import { ProductionOutputService } from './production-output.service';

@Controller('batches')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class ProductionBatchesController {
  constructor(
    private readonly batchesService: ProductionBatchesService,
    private readonly materialsService: ProductionMaterialsService,
    private readonly outputService: ProductionOutputService,
  ) {}

  @Get()
  @RequirePermissions('manufacturing.production.read')
  async listBatches(
    @Query(new ZodValidationPipe(batchListSearchParamsSchema))
    query: BatchListSearchParamsSchema,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.batchesService.listBatches(query);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Production batches retrieved successfully.',
      data: result.data,
      meta: result.pagination,
    };
  }

  @Get(':id')
  @RequirePermissions('manufacturing.production.read')
  async getBatch(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Production batch retrieved successfully.',
      data: await this.batchesService.getBatch(id),
    };
  }

  @Get(':id/consumptions')
  @RequirePermissions('manufacturing.production.read')
  async getBatchConsumptions(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Batch material consumptions retrieved successfully.',
      data: await this.batchesService.getBatchConsumptions(id),
    };
  }

  @Get(':id/returns')
  @RequirePermissions('manufacturing.production.read')
  async getBatchReturns(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Batch material returns retrieved successfully.',
      data: await this.batchesService.getBatchReturns(id),
    };
  }

  @Get(':id/outputs')
  @RequirePermissions('manufacturing.production.read')
  async getBatchOutputs(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Batch outputs retrieved successfully.',
      data: await this.batchesService.getBatchOutputs(id),
    };
  }

  @Post(':id/consume')
  @RequirePermissions('manufacturing.production.execute')
  async consumeMaterial(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(materialConsumptionSchema))
    body: MaterialConsumptionSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Material consumed successfully.',
      data: await this.materialsService.consumeMaterial(id, body),
    };
  }

  @Post(':id/return')
  @RequirePermissions('manufacturing.production.execute')
  async returnMaterial(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(materialReturnSchema))
    body: MaterialReturnSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Material returned to stock successfully.',
      data: await this.materialsService.returnMaterial(id, body),
    };
  }

  @Post(':id/output')
  @RequirePermissions('manufacturing.production.execute')
  async recordOutput(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(productionOutputSchema))
    body: ProductionOutputSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Production output recorded successfully.',
      data: await this.outputService.recordOutput(id, body),
    };
  }

  @Post(':id/complete')
  @RequirePermissions('manufacturing.production.execute')
  async completeBatch(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Production batch completed successfully.',
      data: await this.batchesService.completeBatch(id),
    };
  }
}
