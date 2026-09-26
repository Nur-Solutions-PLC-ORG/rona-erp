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
  AdjustStockSchema,
  IssueStockSchema,
  MovementListSearchParamsSchema,
  ReceiveStockSchema,
  ReturnStockSchema,
  StockQueryParamsSchema,
  TransferStockSchema,
} from '@rona/types/inventory';
import {
  adjustStockSchema,
  issueStockSchema,
  movementListSearchParamsSchema,
  receiveStockSchema,
  returnStockSchema,
  stockQueryParamsSchema,
  transferStockSchema,
} from '@rona/validation/inventory';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { TenantGuard } from '@/modules/tenancy/tenant.guard';
import { PermissionGuard } from '@/modules/rbac/permission.guard';
import { RequirePermissions } from '@/modules/rbac/require-permissions.decorator';
import { StockInboundService } from './stock-inbound.service';
import { StockOutboundService } from './stock-outbound.service';
import { StockQueryService } from './stock-query.service';

@Controller('stock')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class StockController {
  constructor(
    private readonly inbound: StockInboundService,
    private readonly outbound: StockOutboundService,
    private readonly query: StockQueryService,
  ) {}

  @Get()
  @RequirePermissions('inventory.stock.read')
  async listBalances(
    @Query(new ZodValidationPipe(stockQueryParamsSchema))
    query: StockQueryParamsSchema,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.query.listBalances(query);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Stock balances retrieved successfully.',
      data: result.data,
      meta: result.pagination,
    };
  }

  @Get('movements')
  @RequirePermissions('inventory.movement.read')
  async listMovements(
    @Query(new ZodValidationPipe(movementListSearchParamsSchema))
    query: MovementListSearchParamsSchema,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.query.listMovements(query);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Stock movements retrieved successfully.',
      data: result.data,
      meta: result.pagination,
    };
  }

  @Get('items/:itemId/on-hand')
  @RequirePermissions('inventory.stock.read')
  async getOnHandByItem(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Query('warehouseId') warehouseId?: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'On-hand quantity retrieved successfully.',
      data: await this.query.sumOnHandByItem(itemId, warehouseId),
    };
  }

  @Post('receive')
  @RequirePermissions('inventory.stock.receive')
  async receiveStock(
    @Body(new ZodValidationPipe(receiveStockSchema))
    body: ReceiveStockSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Stock received successfully.',
      data: await this.inbound.receiveStock(body),
    };
  }

  @Post('return')
  @RequirePermissions('inventory.stock.return')
  async returnStock(
    @Body(new ZodValidationPipe(returnStockSchema))
    body: ReturnStockSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Stock returned successfully.',
      data: await this.inbound.returnStock(body),
    };
  }

  @Post('issue')
  @RequirePermissions('inventory.stock.issue')
  async issueStock(
    @Body(new ZodValidationPipe(issueStockSchema))
    body: IssueStockSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Stock issued successfully.',
      data: await this.outbound.issueStock(body),
    };
  }

  @Post('transfer')
  @RequirePermissions('inventory.stock.transfer')
  async transferStock(
    @Body(new ZodValidationPipe(transferStockSchema))
    body: TransferStockSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Stock transferred successfully.',
      data: await this.outbound.transferStock(body),
    };
  }

  @Post('adjust')
  @RequirePermissions('inventory.stock.adjust')
  async adjustStock(
    @Body(new ZodValidationPipe(adjustStockSchema))
    body: AdjustStockSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Stock adjusted successfully.',
      data: await this.outbound.adjustStock(body),
    };
  }
}
