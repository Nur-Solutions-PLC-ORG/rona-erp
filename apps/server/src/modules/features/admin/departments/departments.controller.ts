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
  DepartmentDto,
  DepartmentListSearchParamsSchema,
  DepartmentSchema,
  DepartmentUpdateSchema,
} from '@rona/types/admin';
import {
  departmentListSearchParamsSchema,
  departmentSchema,
  departmentUpdateSchema,
} from '@rona/validation/admin';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { Roles } from '@/modules/auth/guards/roles.decorator';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { DepartmentsService } from './departments.service';

@Controller()
@UseGuards(AuthGuard, RolesGuard)
@Roles('super_admin')
export class DepartmentsController {
  constructor(private readonly service: DepartmentsService) {}
  @Get() async list(
    @Query(new ZodValidationPipe(departmentListSearchParamsSchema))
    query: DepartmentListSearchParamsSchema,
  ): Promise<ApiResponse<DepartmentDto[]>> {
    const { departments, meta } = await this.service.listDepartments(query);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Departments retrieved successfully.',
      data: departments,
      meta,
    };
  }
  @Post() async create(
    @Body(new ZodValidationPipe(departmentSchema)) body: DepartmentSchema,
  ): Promise<ApiResponse<DepartmentDto>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Department created successfully.',
      data: await this.service.createDepartment(body),
    };
  }
  @Get(':id') async get(
    @Param('id') id: string,
  ): Promise<ApiResponse<DepartmentDto>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Department retrieved successfully.',
      data: await this.service.getDepartment(id),
    };
  }
  @Patch(':id') async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(departmentUpdateSchema))
    body: DepartmentUpdateSchema,
  ): Promise<ApiResponse<DepartmentDto>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Department updated successfully.',
      data: await this.service.updateDepartment(id, body),
    };
  }
  @Delete(':id') async delete(
    @Param('id') id: string,
  ): Promise<ApiResponse<never>> {
    await this.service.deleteDepartment(id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Department deleted successfully.',
    };
  }
}
