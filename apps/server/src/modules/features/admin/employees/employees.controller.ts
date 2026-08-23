import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse } from '@rona/types/api';
import type {
  EmployeeDto,
  EmployeeListSearchParamsSchema,
  EmployeeSchema,
  EmployeeUpdateSchema,
} from '@rona/types/admin';
import {
  employeeListSearchParamsSchema,
  employeeSchema,
  employeeUpdateSchema,
} from '@rona/validation/admin';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { Roles } from '@/modules/auth/guards/roles.decorator';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { EmployeesService } from './employees.service';

@Controller()
@UseGuards(AuthGuard, RolesGuard)
@Roles('super_admin')
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}
  @Get() async list(
    @Query(new ZodValidationPipe(employeeListSearchParamsSchema))
    query: EmployeeListSearchParamsSchema,
  ): Promise<ApiResponse<EmployeeDto[]>> {
    const { employees, meta } = await this.service.listEmployees(query);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Employees retrieved successfully.',
      data: employees,
      meta,
    };
  }
  @Post() async create(
    @Body(new ZodValidationPipe(employeeSchema)) body: EmployeeSchema,
  ): Promise<ApiResponse<EmployeeDto>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Employee created successfully.',
      data: await this.service.createEmployee(body),
    };
  }
  @Get(':id') async get(
    @Param('id') id: string,
  ): Promise<ApiResponse<EmployeeDto>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Employee retrieved successfully.',
      data: await this.service.getEmployee(id),
    };
  }
  @Patch(':id') async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(employeeUpdateSchema))
    body: EmployeeUpdateSchema,
  ): Promise<ApiResponse<EmployeeDto>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Employee updated successfully.',
      data: await this.service.updateEmployee(id, body),
    };
  }
  @Delete(':id') async delete(
    @Param('id') id: string,
  ): Promise<ApiResponse<never>> {
    await this.service.deleteEmployee(id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Employee deleted successfully.',
    };
  }
}
