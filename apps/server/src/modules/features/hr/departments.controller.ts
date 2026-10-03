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
  DepartmentCreateInput,
  DepartmentListSearchParams,
  DepartmentUpdateInput,
  PositionCreateInput,
  PositionListSearchParams,
  PositionUpdateInput,
} from '@rona/types/hr';
import {
  departmentCreateSchema,
  departmentListSearchParamsSchema,
  departmentUpdateSchema,
  positionCreateSchema,
  positionListSearchParamsSchema,
  positionUpdateSchema,
} from '@rona/validation/hr';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { TenantGuard } from '@/modules/tenancy/tenant.guard';
import { PermissionGuard } from '@/modules/rbac/permission.guard';
import { RequirePermissions } from '@/modules/rbac/require-permissions.decorator';
import { DepartmentsService } from './departments.service';

@Controller('departments')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @RequirePermissions('hr.employee.read')
  async listDepartments(
    @Query(new ZodValidationPipe(departmentListSearchParamsSchema))
    query: DepartmentListSearchParams,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.departmentsService.listDepartments(query);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Departments retrieved successfully.',
      data: result.data,
      meta: result.pagination,
    };
  }

  @Post()
  @RequirePermissions('hr.employee.create')
  async createDepartment(
    @Body(new ZodValidationPipe(departmentCreateSchema))
    body: DepartmentCreateInput,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Department created successfully.',
      data: await this.departmentsService.createDepartment(body),
    };
  }

  @Get('positions')
  @RequirePermissions('hr.employee.read')
  async listPositions(
    @Query(new ZodValidationPipe(positionListSearchParamsSchema))
    query: PositionListSearchParams,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.departmentsService.listPositions(query);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Positions retrieved successfully.',
      data: result.data,
      meta: result.pagination,
    };
  }

  @Post('positions')
  @RequirePermissions('hr.employee.create')
  async createPosition(
    @Body(new ZodValidationPipe(positionCreateSchema))
    body: PositionCreateInput,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Position created successfully.',
      data: await this.departmentsService.createPosition(body),
    };
  }

  @Get('positions/:id')
  @RequirePermissions('hr.employee.read')
  async getPosition(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Position retrieved successfully.',
      data: await this.departmentsService.getPosition(id),
    };
  }

  @Patch('positions/:id')
  @RequirePermissions('hr.employee.update')
  async updatePosition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(positionUpdateSchema))
    body: PositionUpdateInput,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Position updated successfully.',
      data: await this.departmentsService.updatePosition(id, body),
    };
  }

  @Patch('positions/:id/archive')
  @RequirePermissions('hr.employee.archive')
  async archivePosition(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Position archived successfully.',
      data: await this.departmentsService.archivePosition(id),
    };
  }

  @Patch('positions/:id/restore')
  @RequirePermissions('hr.employee.archive')
  async restorePosition(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Position restored successfully.',
      data: await this.departmentsService.restorePosition(id),
    };
  }

  @Get(':id')
  @RequirePermissions('hr.employee.read')
  async getDepartment(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Department retrieved successfully.',
      data: await this.departmentsService.getDepartment(id),
    };
  }

  @Patch(':id')
  @RequirePermissions('hr.employee.update')
  async updateDepartment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(departmentUpdateSchema))
    body: DepartmentUpdateInput,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Department updated successfully.',
      data: await this.departmentsService.updateDepartment(id, body),
    };
  }
}
