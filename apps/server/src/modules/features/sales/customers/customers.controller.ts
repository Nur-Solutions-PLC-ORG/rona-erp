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
  CustomerCreateSchema,
  CustomerUpdateSchema,
  CustomerContactCreateSchema,
  CustomerContactUpdateSchema,
  CustomerAddressCreateSchema,
  CustomerAddressUpdateSchema,
  CustomerListSearchParamsSchema,
} from '@rona/types/sales';
import {
  customerCreateSchema,
  customerUpdateSchema,
  customerContactCreateSchema,
  customerContactUpdateSchema,
  customerAddressCreateSchema,
  customerAddressUpdateSchema,
  customerListSearchParamsSchema,
} from '@rona/validation/sales';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { TenantGuard } from '@/modules/tenancy/tenant.guard';
import { PermissionGuard } from '@/modules/rbac/permission.guard';
import { RequirePermissions } from '@/modules/rbac/require-permissions.decorator';
import { CustomerService } from './customers.service';

@Controller('sales/customers')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class CustomerController {
  constructor(private readonly service: CustomerService) {}

  @Post()
  @RequirePermissions('sales.customer.create')
  async createCustomer(
    @Body(new ZodValidationPipe(customerCreateSchema))
    body: CustomerCreateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Customer created successfully.',
      data: await this.service.create(body),
    };
  }

  @Get()
  @RequirePermissions('sales.customer.read')
  async listCustomers(
    @Query(new ZodValidationPipe(customerListSearchParamsSchema))
    query: CustomerListSearchParamsSchema,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.service.list({
      ...query,
      page: Number(query.page ?? 1),
      limit: Number(query.limit ?? 25),
    });
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Customers retrieved successfully.',
      data: result.rows,
      meta: {
        totalItems: result.total,
        page: query.page ?? 1,
        limit: query.limit ?? 25,
        totalPages: Math.ceil(result.total / (Number(query.limit ?? 25) || 25)),
      },
    };
  }

  @Get(':id')
  @RequirePermissions('sales.customer.read')
  async getCustomer(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Customer retrieved successfully.',
      data: await this.service.findById(id),
    };
  }

  @Patch(':id')
  @RequirePermissions('sales.customer.update')
  async updateCustomer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(customerUpdateSchema))
    body: CustomerUpdateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Customer updated successfully.',
      data: await this.service.update(id, body),
    };
  }

  @Post(':customerId/contacts')
  @RequirePermissions('sales.customer.read', 'sales.customer.create')
  async addContact(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Body(new ZodValidationPipe(customerContactCreateSchema))
    body: CustomerContactCreateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Contact added.',
      data: await this.service.addContact(customerId, body),
    };
  }

  @Patch('contacts/:contactId')
  @RequirePermissions('sales.customer.update')
  async updateContact(
    @Param('contactId', ParseUUIDPipe) contactId: string,
    @Body(new ZodValidationPipe(customerContactUpdateSchema))
    body: CustomerContactUpdateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Contact updated.',
      data: await this.service.updateContact(contactId, body),
    };
  }

  @Post(':customerId/addresses')
  @RequirePermissions('sales.customer.read', 'sales.customer.create')
  async addAddress(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Body(new ZodValidationPipe(customerAddressCreateSchema))
    body: CustomerAddressCreateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Address added.',
      data: await this.service.addAddress(customerId, body),
    };
  }

  @Patch('addresses/:addressId')
  @RequirePermissions('sales.customer.update')
  async updateAddress(
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @Body(new ZodValidationPipe(customerAddressUpdateSchema))
    body: CustomerAddressUpdateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Address updated.',
      data: await this.service.updateAddress(addressId, body),
    };
  }
}
