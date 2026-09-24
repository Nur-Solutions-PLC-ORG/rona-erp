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
  ItemCreateSchema,
  ItemListSearchParamsSchema,
  ItemUpdateSchema,
  UnitOfMeasureCreateSchema,
} from '@rona/types/inventory';
import {
  itemCreateSchema,
  itemListSearchParamsSchema,
  itemUpdateSchema,
  unitOfMeasureCreateSchema,
} from '@rona/validation/inventory';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { TenantGuard } from '@/modules/tenancy/tenant.guard';
import { PermissionGuard } from '@/modules/rbac/permission.guard';
import { RequirePermissions } from '@/modules/rbac/require-permissions.decorator';
import { ItemsService } from './items.service';

@Controller('items')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  @RequirePermissions('inventory.item.read')
  async listItems(
    @Query(new ZodValidationPipe(itemListSearchParamsSchema))
    query: ItemListSearchParamsSchema,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.itemsService.listItems(query);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Items retrieved successfully.',
      data: result.data,
      meta: result.pagination,
    };
  }

  @Post()
  @RequirePermissions('inventory.item.create')
  async createItem(
    @Body(new ZodValidationPipe(itemCreateSchema)) body: ItemCreateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Item created successfully.',
      data: await this.itemsService.createItem(body),
    };
  }

  @Get('units-of-measure')
  @RequirePermissions('inventory.item.read')
  async listUnitsOfMeasure(): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Units of measure retrieved successfully.',
      data: await this.itemsService.listUnitsOfMeasure(),
    };
  }

  @Post('units-of-measure')
  @RequirePermissions('inventory.item.create')
  async createUnitOfMeasure(
    @Body(new ZodValidationPipe(unitOfMeasureCreateSchema))
    body: UnitOfMeasureCreateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Unit of measure created successfully.',
      data: await this.itemsService.createUnitOfMeasure(body),
    };
  }

  @Get(':id')
  @RequirePermissions('inventory.item.read')
  async getItem(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Item retrieved successfully.',
      data: await this.itemsService.getItem(id),
    };
  }

  @Patch(':id')
  @RequirePermissions('inventory.item.update')
  async updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(itemUpdateSchema)) body: ItemUpdateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Item updated successfully.',
      data: await this.itemsService.updateItem(id, body),
    };
  }

  @Patch(':id/archive')
  @RequirePermissions('inventory.item.archive')
  async archiveItem(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Item archived successfully.',
      data: await this.itemsService.archiveItem(id),
    };
  }
}
