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
  EmergencyContactCreateInput,
  EmergencyContactUpdateInput,
  EmployeeCreateInput,
  EmployeeListSearchParams,
  EmployeeShiftAssignInput,
  EmployeeShiftEndInput,
  EmployeeUpdateInput,
} from '@rona/types/hr';
import {
  emergencyContactCreateSchema,
  emergencyContactUpdateSchema,
  employeeCreateSchema,
  employeeListSearchParamsSchema,
  employeeShiftAssignSchema,
  employeeShiftEndSchema,
  employeeUpdateSchema,
} from '@rona/validation/hr';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { TenantGuard } from '@/modules/tenancy/tenant.guard';
import { PermissionGuard } from '@/modules/rbac/permission.guard';
import { RequirePermissions } from '@/modules/rbac/require-permissions.decorator';
import { EmployeesService } from './employees.service';
import { EmergencyContactsService } from './contacts.service';
import { ShiftsService } from './shifts.service';

@Controller('employees')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class EmployeesController {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly contactsService: EmergencyContactsService,
    private readonly shiftsService: ShiftsService,
  ) {}

  @Get()
  @RequirePermissions('hr.employee.read')
  async listEmployees(
    @Query(new ZodValidationPipe(employeeListSearchParamsSchema))
    query: EmployeeListSearchParams,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.employeesService.listEmployees(query);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Employees retrieved successfully.',
      data: result.data,
      meta: result.pagination,
    };
  }

  @Post()
  @RequirePermissions('hr.employee.create')
  async createEmployee(
    @Body(new ZodValidationPipe(employeeCreateSchema))
    body: EmployeeCreateInput,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Employee created successfully.',
      data: await this.employeesService.createEmployee(body),
    };
  }

  @Get(':id')
  @RequirePermissions('hr.employee.read')
  async getEmployee(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Employee retrieved successfully.',
      data: await this.employeesService.getEmployee(id),
    };
  }

  @Patch(':id')
  @RequirePermissions('hr.employee.update')
  async updateEmployee(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(employeeUpdateSchema))
    body: EmployeeUpdateInput,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Employee updated successfully.',
      data: await this.employeesService.updateEmployee(id, body),
    };
  }

  @Patch(':id/archive')
  @RequirePermissions('hr.employee.archive')
  async archiveEmployee(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Employee archived successfully.',
      data: await this.employeesService.archiveEmployee(id),
    };
  }

  @Patch(':id/restore')
  @RequirePermissions('hr.employee.archive')
  async restoreEmployee(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Employee restored successfully.',
      data: await this.employeesService.restoreEmployee(id),
    };
  }

  @Get(':id/emergency-contacts')
  @RequirePermissions('hr.employee.read')
  async listContacts(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Emergency contacts retrieved successfully.',
      data: await this.contactsService.listContacts(id),
    };
  }

  @Post(':id/emergency-contacts')
  @RequirePermissions('hr.employee.update')
  async createContact(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(emergencyContactCreateSchema))
    body: EmergencyContactCreateInput,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Emergency contact created successfully.',
      data: await this.contactsService.createContact(id, body),
    };
  }

  @Patch(':id/emergency-contacts/:contactId')
  @RequirePermissions('hr.employee.update')
  async updateContact(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('contactId', ParseUUIDPipe) contactId: string,
    @Body(new ZodValidationPipe(emergencyContactUpdateSchema))
    body: EmergencyContactUpdateInput,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Emergency contact updated successfully.',
      data: await this.contactsService.updateContact(id, contactId, body),
    };
  }

  @Delete(':id/emergency-contacts/:contactId')
  @RequirePermissions('hr.employee.update')
  async deleteContact(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('contactId', ParseUUIDPipe) contactId: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Emergency contact deleted successfully.',
      data: await this.contactsService.deleteContact(id, contactId),
    };
  }

  @Get(':id/shifts')
  @RequirePermissions('hr.schedule.read')
  async listShiftAssignments(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Shift assignments retrieved successfully.',
      data: await this.shiftsService.listAssignments(id),
    };
  }

  @Post(':id/shifts')
  @RequirePermissions('hr.schedule.create')
  async assignShift(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(employeeShiftAssignSchema))
    body: EmployeeShiftAssignInput,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Shift assignment created successfully.',
      data: await this.shiftsService.assignShift(id, body),
    };
  }

  @Post(':id/shifts/:assignmentId/end')
  @RequirePermissions('hr.schedule.update')
  async endShiftAssignment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
    @Body(new ZodValidationPipe(employeeShiftEndSchema))
    body: EmployeeShiftEndInput,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Shift assignment ended successfully.',
      data: await this.shiftsService.endAssignment(id, assignmentId, body),
    };
  }
}
