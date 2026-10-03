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
  BatchCreateSchema,
  ProductionOrderCreateSchema,
  ProductionOrderListSearchParamsSchema,
} from '@rona/types/manufacturing';
import {
  batchCreateSchema,
  productionOrderCreateSchema,
  productionOrderListSearchParamsSchema,
} from '@rona/validation/manufacturing';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { TenantGuard } from '@/modules/tenancy/tenant.guard';
import { PermissionGuard } from '@/modules/rbac/permission.guard';
import { RequirePermissions } from '@/modules/rbac/require-permissions.decorator';
import { ProductionBatchesService } from './production-batches.service';
import { ProductionOrdersService } from './production-orders.service';

@Controller('production-orders')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class ProductionOrdersController {
  constructor(
    private readonly productionOrdersService: ProductionOrdersService,
    private readonly batchesService: ProductionBatchesService,
  ) {}

  @Get()
  @RequirePermissions('manufacturing.production.read')
  async listOrders(
    @Query(new ZodValidationPipe(productionOrderListSearchParamsSchema))
    query: ProductionOrderListSearchParamsSchema,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.productionOrdersService.listOrders(query);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Production orders retrieved successfully.',
      data: result.data,
      meta: result.pagination,
    };
  }

  @Post()
  @RequirePermissions('manufacturing.production.create')
  async createOrder(
    @Body(new ZodValidationPipe(productionOrderCreateSchema))
    body: ProductionOrderCreateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Production order created successfully.',
      data: await this.productionOrdersService.createOrder(body),
    };
  }

  @Get(':id')
  @RequirePermissions('manufacturing.production.read')
  async getOrder(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Production order retrieved successfully.',
      data: await this.productionOrdersService.getOrder(id),
    };
  }

  @Get(':id/materials')
  @RequirePermissions('manufacturing.production.read')
  async getOrderMaterials(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Production order materials retrieved successfully.',
      data: await this.productionOrdersService.getOrderMaterials(id),
    };
  }

  @Post(':id/batches')
  @RequirePermissions('manufacturing.production.execute')
  async createBatch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(batchCreateSchema))
    body: BatchCreateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Production batch created successfully.',
      data: await this.batchesService.createBatch(id, body),
    };
  }

  @Post(':id/approve')
  @RequirePermissions('manufacturing.production.approve')
  async approveOrder(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Production order approved successfully.',
      data: await this.productionOrdersService.approveOrder(id),
    };
  }

  @Post(':id/start')
  @RequirePermissions('manufacturing.production.execute')
  async startOrder(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Production order started successfully.',
      data: await this.productionOrdersService.startOrder(id),
    };
  }

  @Post(':id/complete')
  @RequirePermissions('manufacturing.production.execute')
  async completeOrder(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Production order completed successfully.',
      data: await this.productionOrdersService.completeOrder(id),
    };
  }

  @Post(':id/cancel')
  @RequirePermissions('manufacturing.production.approve')
  async cancelOrder(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Production order cancelled successfully.',
      data: await this.productionOrdersService.cancelOrder(id),
    };
  }
}
