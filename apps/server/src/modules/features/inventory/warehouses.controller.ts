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
  LotCreateSchema,
  LotListSearchParamsSchema,
  LotQualityStatusUpdateSchema,
  WarehouseCreateSchema,
  WarehouseListSearchParamsSchema,
  WarehouseLocationCreateSchema,
  WarehouseUpdateSchema,
} from '@rona/types/inventory';
import {
  lotCreateSchema,
  lotListSearchParamsSchema,
  lotQualityStatusUpdateSchema,
  warehouseCreateSchema,
  warehouseListSearchParamsSchema,
  warehouseLocationCreateSchema,
  warehouseUpdateSchema,
} from '@rona/validation/inventory';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { TenantGuard } from '@/modules/tenancy/tenant.guard';
import { PermissionGuard } from '@/modules/rbac/permission.guard';
import { RequirePermissions } from '@/modules/rbac/require-permissions.decorator';
import { WarehousesService } from './warehouses.service';

@Controller()
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Get('warehouses')
  @RequirePermissions('inventory.warehouse.read')
  async listWarehouses(
    @Query(new ZodValidationPipe(warehouseListSearchParamsSchema))
    query: WarehouseListSearchParamsSchema,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.warehousesService.listWarehouses(query);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Warehouses retrieved successfully.',
      data: result.data,
      meta: result.pagination,
    };
  }

  @Post('warehouses')
  @RequirePermissions('inventory.warehouse.create')
  async createWarehouse(
    @Body(new ZodValidationPipe(warehouseCreateSchema))
    body: WarehouseCreateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Warehouse created successfully.',
      data: await this.warehousesService.createWarehouse(body),
    };
  }

  @Get('warehouses/:id')
  @RequirePermissions('inventory.warehouse.read')
  async getWarehouse(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Warehouse retrieved successfully.',
      data: await this.warehousesService.getWarehouse(id),
    };
  }

  @Patch('warehouses/:id')
  @RequirePermissions('inventory.warehouse.update')
  async updateWarehouse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(warehouseUpdateSchema))
    body: WarehouseUpdateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Warehouse updated successfully.',
      data: await this.warehousesService.updateWarehouse(id, body),
    };
  }

  @Get('warehouses/:id/locations')
  @RequirePermissions('inventory.warehouse.read')
  async listLocations(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Warehouse locations retrieved successfully.',
      data: await this.warehousesService.listLocations(id),
    };
  }

  @Post('warehouses/:id/locations')
  @RequirePermissions('inventory.warehouse.create')
  async createLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(warehouseLocationCreateSchema))
    body: WarehouseLocationCreateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Warehouse location created successfully.',
      data: await this.warehousesService.createLocation({
        ...body,
        warehouseId: id,
      }),
    };
  }

  @Get('warehouses/locations/:id')
  @RequirePermissions('inventory.warehouse.read')
  async getLocation(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Warehouse location retrieved successfully.',
      data: await this.warehousesService.getLocation(id),
    };
  }

  @Get('lots')
  @RequirePermissions('inventory.lot.read')
  async listLots(
    @Query(new ZodValidationPipe(lotListSearchParamsSchema))
    query: LotListSearchParamsSchema,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.warehousesService.listLots(query);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Lots retrieved successfully.',
      data: result.data,
      meta: result.pagination,
    };
  }

  @Post('lots')
  @RequirePermissions('inventory.lot.create')
  async createLot(
    @Body(new ZodValidationPipe(lotCreateSchema)) body: LotCreateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Lot created successfully.',
      data: await this.warehousesService.createLot(body),
    };
  }

  @Get('lots/:id')
  @RequirePermissions('inventory.lot.read')
  async getLot(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Lot retrieved successfully.',
      data: await this.warehousesService.getLot(id),
    };
  }

  @Patch('lots/:id/quality-status')
  @RequirePermissions('inventory.lot.update')
  async updateLotQualityStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(lotQualityStatusUpdateSchema))
    body: LotQualityStatusUpdateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Lot quality status updated successfully.',
      data: await this.warehousesService.updateLotQualityStatus(id, body),
    };
  }
}
