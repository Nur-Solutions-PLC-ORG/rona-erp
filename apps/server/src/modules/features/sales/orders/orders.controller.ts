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
  SalesOrderCreateSchema,
  SalesOrderListSearchParamsSchema,
  StockAvailabilityParams,
} from '@rona/types/sales';
import {
  salesOrderCreateSchema,
  salesOrderListSearchParamsSchema,
  stockAvailabilityParamsSchema,
} from '@rona/validation/sales';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { TenantGuard } from '@/modules/tenancy/tenant.guard';
import { PermissionGuard } from '@/modules/rbac/permission.guard';
import { RequirePermissions } from '@/modules/rbac/require-permissions.decorator';
import { SalesOrderService } from './orders.service';

@Controller('sales/orders')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class SalesOrderController {
  constructor(private readonly service: SalesOrderService) {}

  @Post()
  @RequirePermissions('sales.order.create')
  async create(
    @Body(new ZodValidationPipe(salesOrderCreateSchema))
    body: SalesOrderCreateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Sales order created.',
      data: await this.service.create(body),
    };
  }

  @Get()
  @RequirePermissions('sales.order.read')
  async list(
    @Query(new ZodValidationPipe(salesOrderListSearchParamsSchema))
    query: SalesOrderListSearchParamsSchema,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.service.list({
      ...query,
      page: Number(query.page ?? 1),
      limit: Number(query.limit ?? 25),
    });

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Orders retrieved.',
      data: result.rows,
      meta: {
        totalItems: result.total,
        page: query.page ?? 1,
        limit: query.limit ?? 25,
        totalPages: Math.ceil(result.total / (Number(query.limit ?? 25) || 25)),
      },
    };
  }

  @Get('availability')
  @RequirePermissions('sales.order.read')
  async availability(
    @Query(new ZodValidationPipe(stockAvailabilityParamsSchema))
    query: StockAvailabilityParams,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Stock availability retrieved.',
      data: await this.service.getAvailability(query),
    };
  }

  @Get(':id')
  @RequirePermissions('sales.order.read')
  async get(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Order retrieved.',
      data: await this.service.findById(id),
    };
  }

  @Post(':id/confirm')
  @RequirePermissions('sales.order.confirm')
  async confirm(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Order confirmed.',
      data: await this.service.confirm(id),
    };
  }

  @Post(':id/fulfill')
  @RequirePermissions('sales.order.confirm')
  async fulfill(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Order fulfilled.',
      data: await this.service.fulfill(id),
    };
  }

  @Post(':id/cancel')
  @RequirePermissions('sales.order.cancel')
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Order cancelled.',
      data: await this.service.cancel(id),
    };
  }
}
