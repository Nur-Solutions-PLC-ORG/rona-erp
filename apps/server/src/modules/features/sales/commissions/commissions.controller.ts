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
  CommissionRecordListSearchParamsSchema,
  CommissionRuleCreateSchema,
  CommissionRuleListSearchParamsSchema,
  CommissionRuleUpdateSchema,
} from '@rona/types/sales';
import {
  commissionRecordListSearchParamsSchema,
  commissionRuleCreateSchema,
  commissionRuleListSearchParamsSchema,
  commissionRuleUpdateSchema,
} from '@rona/validation/sales';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { TenantGuard } from '@/modules/tenancy/tenant.guard';
import { PermissionGuard } from '@/modules/rbac/permission.guard';
import { RequirePermissions } from '@/modules/rbac/require-permissions.decorator';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { CommissionService } from './commissions.service';

@Controller('sales/commissions')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class CommissionController {
  constructor(private readonly service: CommissionService) {}

  @Post('rules')
  @RequirePermissions('sales.commission.approve')
  async createRule(
    @Body(new ZodValidationPipe(commissionRuleCreateSchema))
    body: CommissionRuleCreateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Rule created.',
      data: await this.service.createRule(body),
    };
  }

  @Get('rules')
  @RequirePermissions('sales.commission.read')
  async listRules(
    @Query(new ZodValidationPipe(commissionRuleListSearchParamsSchema))
    query: CommissionRuleListSearchParamsSchema,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.service.listRules({
      ...query,
      page: Number(query.page ?? 1),
      limit: Number(query.limit ?? 25),
    });

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Rules retrieved.',
      data: result.rows,
      meta: {
        totalItems: result.total,
        page: query.page ?? 1,
        limit: query.limit ?? 25,
        totalPages: Math.ceil(result.total / (Number(query.limit ?? 25) || 25)),
      },
    };
  }

  @Get('rules/:id')
  @RequirePermissions('sales.commission.read')
  async getRule(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Rule retrieved.',
      data: await this.service.findRule(id),
    };
  }

  @Patch('rules/:id')
  @RequirePermissions('sales.commission.approve')
  async updateRule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(commissionRuleUpdateSchema))
    body: CommissionRuleUpdateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Rule updated.',
      data: await this.service.updateRule(id, body),
    };
  }

  @Get('records')
  @RequirePermissions('sales.commission.read')
  async listRecords(
    @Query(new ZodValidationPipe(commissionRecordListSearchParamsSchema))
    query: CommissionRecordListSearchParamsSchema,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.service.listRecords({
      ...query,
      page: Number(query.page ?? 1),
      limit: Number(query.limit ?? 25),
    });

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Records retrieved.',
      data: result.rows,
      meta: {
        totalItems: result.total,
        page: query.page ?? 1,
        limit: query.limit ?? 25,
        totalPages: Math.ceil(result.total / (Number(query.limit ?? 25) || 25)),
      },
    };
  }

  @Post('records/:id/approve')
  @RequirePermissions('sales.commission.approve')
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Record approved.',
      data: await this.service.approveRecord(id),
    };
  }

  @Post('records/:id/mark-paid')
  @RequirePermissions('sales.commission.approve')
  async markPaid(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Record marked paid.',
      data: await this.service.payRecord(id),
    };
  }
}
