import {
  Body,
  Controller,
  Delete,
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
  CostCreateSchema,
  CostListSearchParamsSchema,
  CostUpdateSchema,
  InvoiceCreateSchema,
  InvoiceListSearchParamsSchema,
  PaymentCreateSchema,
  PaymentListSearchParamsSchema,
  PaymentUpdateSchema,
} from '@rona/types/finance';
import {
  costCreateSchema,
  costListSearchParamsSchema,
  costUpdateSchema,
  invoiceCreateSchema,
  invoiceListSearchParamsSchema,
  paymentCreateSchema,
  paymentListSearchParamsSchema,
  paymentUpdateSchema,
} from '@rona/validation/finance';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { TenantGuard } from '@/modules/tenancy/tenant.guard';
import { PermissionGuard } from '@/modules/rbac/permission.guard';
import { RequirePermissions } from '@/modules/rbac/require-permissions.decorator';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { FinanceService } from './finance.service';

@Controller()
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class FinanceController {
  constructor(private readonly service: FinanceService) {}

  @Post('finance/invoices')
  @RequirePermissions('finance.invoice.create')
  async createInvoice(
    @Body(new ZodValidationPipe(invoiceCreateSchema))
    body: InvoiceCreateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Invoice created.',
      data: await this.service.createInvoice(body),
    };
  }

  @Get('finance/invoices')
  @RequirePermissions('finance.invoice.read')
  async listInvoices(
    @Query(new ZodValidationPipe(invoiceListSearchParamsSchema))
    query: InvoiceListSearchParamsSchema,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.service.listInvoices({
      ...query,
      page: Number(query.page ?? 1),
      limit: Number(query.limit ?? 25),
    });

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Invoices retrieved.',
      data: result.rows,
      meta: {
        totalItems: result.total,
        page: query.page ?? 1,
        limit: query.limit ?? 25,
        totalPages: Math.ceil(result.total / (Number(query.limit ?? 25) || 25)),
      },
    };
  }

  @Get('finance/invoices/:id')
  @RequirePermissions('finance.invoice.read')
  async getInvoice(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Invoice retrieved.',
      data: await this.service.findInvoice(id),
    };
  }

  @Post('finance/invoices/:id/issue')
  @RequirePermissions('finance.invoice.issue')
  async issue(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Invoice issued.',
      data: await this.service.issueInvoice(id),
    };
  }

  @Post('finance/invoices/:id/void')
  @RequirePermissions('finance.invoice.void')
  async void(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Invoice voided.',
      data: await this.service.voidInvoice(id),
    };
  }

  @Post('finance/payments')
  @RequirePermissions('finance.payment.create')
  async createPayment(
    @Body(new ZodValidationPipe(paymentCreateSchema))
    body: PaymentCreateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Payment recorded.',
      data: await this.service.createPayment(body),
    };
  }

  @Patch('finance/payments/:id')
  @RequirePermissions('finance.payment.create')
  async updatePayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(paymentUpdateSchema))
    body: PaymentUpdateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Payment updated.',
      data: await this.service.updatePayment(id, body),
    };
  }

  @Delete('finance/payments/:id')
  @RequirePermissions('finance.payment.create')
  async deletePayment(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Payment deleted.',
      data: await this.service.deletePayment(id),
    };
  }

  @Get('finance/payments')
  @RequirePermissions('finance.payment.read')
  async listPayments(
    @Query(new ZodValidationPipe(paymentListSearchParamsSchema))
    query: PaymentListSearchParamsSchema,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.service.listAllPayments({
      page: Number(query.page ?? 1),
      limit: Number(query.limit ?? 25),
    });

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Payments retrieved.',
      data: result.rows,
      meta: {
        totalItems: result.total,
        page: Number(query.page ?? 1),
        limit: Number(query.limit ?? 25),
        totalPages: Math.ceil(result.total / (Number(query.limit ?? 25) || 25)),
      },
    };
  }

  @Get('finance/invoices/:id/payments')
  @RequirePermissions('finance.payment.read')
  async invoicePayments(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Payments retrieved.',
      data: await this.service.listInvoicePayments(id),
    };
  }

  @Post('finance/costs')
  @RequirePermissions('finance.cost.create')
  async createCost(
    @Body(new ZodValidationPipe(costCreateSchema))
    body: CostCreateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Cost created.',
      data: await this.service.createCost(body),
    };
  }

  @Get('finance/costs')
  @RequirePermissions('finance.cost.read')
  async listCosts(
    @Query(new ZodValidationPipe(costListSearchParamsSchema))
    query: CostListSearchParamsSchema,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.service.listCosts({
      ...query,
      page: Number(query.page ?? 1),
      limit: Number(query.limit ?? 25),
    });

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Costs retrieved.',
      data: result.rows,
      meta: {
        totalItems: result.total,
        page: query.page ?? 1,
        limit: query.limit ?? 25,
        totalPages: Math.ceil(result.total / (Number(query.limit ?? 25) || 25)),
      },
    };
  }

  @Get('finance/costs/:id')
  @RequirePermissions('finance.cost.read')
  async getCost(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Cost retrieved.',
      data: await this.service.findCost(id),
    };
  }

  @Patch('finance/costs/:id')
  @RequirePermissions('finance.cost.update')
  async updateCost(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(costUpdateSchema))
    body: CostUpdateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Cost updated.',
      data: await this.service.updateCost(id, body),
    };
  }
}
