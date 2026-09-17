import { Injectable } from '@nestjs/common';
import { pooledDb } from '@/db';
import { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import { HR_DEFAULT_PAGE, HR_DEFAULT_PAGE_SIZE } from '@rona/config/hr';
import type {
  EmployeeCreateInput,
  EmployeeListParams,
  EmployeeListSearchParams,
  EmployeeUpdateInput,
  PaginatedResult,
} from '@rona/types/hr';
import {
  DepartmentNotFoundException,
  EmployeeArchivedException,
  EmployeeEidConflictException,
  EmployeeNotFoundException,
  EmployeeNotArchivedException,
  EmployeeUserConflictException,
  LinkedUserNotFoundException,
  PositionArchivedException,
  PositionNotFoundException,
} from './hr.exception';
import { EmployeesRepository } from './employees.repository';

function resolveUpdate<T>(
  incoming: T | undefined,
  previous: T | null,
): T | null {
  return incoming !== undefined ? incoming : previous;
}

@Injectable()
export class EmployeesService {
  constructor(
    private readonly employeesRepository: EmployeesRepository,
    private readonly auditService: AuditService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async createEmployee(input: EmployeeCreateInput) {
    const existing = await this.employeesRepository.findByEid(input.eId);
    if (existing) throw new EmployeeEidConflictException();

    if (input.departmentId) {
      const department = await this.employeesRepository.findDepartment(
        input.departmentId,
      );
      if (!department) throw new DepartmentNotFoundException();
    }

    if (input.positionId) {
      const position = await this.employeesRepository.findPosition(
        input.positionId,
      );
      if (!position) throw new PositionNotFoundException();
      if (position.archivedAt) throw new PositionArchivedException();
    }

    if (input.userId) {
      const userExists = await this.employeesRepository.userExists(
        input.userId,
      );
      if (!userExists) throw new LinkedUserNotFoundException();

      const linked = await this.employeesRepository.findEmployeeByUser(
        input.userId,
      );
      if (linked) throw new EmployeeUserConflictException();
    }

    const employeeId = await pooledDb.transaction(async (tx) => {
      const created = await this.employeesRepository.create(input, tx);
      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'hr.employee.create',
          entityType: 'employee',
          entityId: created.id,
          after: {
            eId: created.eid,
            fullName: created.fullName,
            status: created.status,
            departmentId: created.departmentId,
            positionId: created.positionId,
            userId: created.userId,
          },
        },
        tx,
      );
      return created.id;
    });

    return this.employeesRepository.findById(employeeId);
  }

  async getEmployee(employeeId: string) {
    const employee = await this.employeesRepository.findById(employeeId);
    if (!employee) throw new EmployeeNotFoundException();
    return employee;
  }

  async listEmployees(
    params: EmployeeListSearchParams,
  ): Promise<PaginatedResult<unknown>> {
    const resolved: EmployeeListParams = {
      ...params,
      page: params.page ?? HR_DEFAULT_PAGE,
      limit: params.limit ?? HR_DEFAULT_PAGE_SIZE,
    };
    const { rows, total } = await this.employeesRepository.list(resolved);
    return {
      data: rows,
      pagination: {
        page: resolved.page,
        limit: resolved.limit,
        totalItems: total,
        totalPages: Math.ceil(total / resolved.limit),
      },
    };
  }

  async updateEmployee(employeeId: string, input: EmployeeUpdateInput) {
    const employee = await this.employeesRepository.findById(employeeId);
    if (!employee) throw new EmployeeNotFoundException();
    if (employee.archivedAt) throw new EmployeeArchivedException();

    if (input.departmentId && input.departmentId !== employee.departmentId) {
      const department = await this.employeesRepository.findDepartment(
        input.departmentId,
      );
      if (!department) throw new DepartmentNotFoundException();
    }

    if (input.positionId && input.positionId !== employee.positionId) {
      const position = await this.employeesRepository.findPosition(
        input.positionId,
      );
      if (!position) throw new PositionNotFoundException();
      if (position.archivedAt) throw new PositionArchivedException();
    }

    if (input.userId && input.userId !== employee.userId) {
      const userExists = await this.employeesRepository.userExists(
        input.userId,
      );
      if (!userExists) throw new LinkedUserNotFoundException();

      const linked = await this.employeesRepository.findEmployeeByUser(
        input.userId,
      );
      if (linked && linked.id !== employeeId) {
        throw new EmployeeUserConflictException();
      }
    }

    await pooledDb.transaction(async (tx) => {
      await this.employeesRepository.update(employeeId, input, tx);
      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'hr.employee.update',
          entityType: 'employee',
          entityId: employeeId,
          before: {
            fullName: employee.fullName,
            phone: employee.phone,
            email: employee.email,
            status: employee.status,
            departmentId: employee.departmentId,
            positionId: employee.positionId,
            userId: employee.userId,
          },
          after: {
            fullName: resolveUpdate(input.fullName, employee.fullName),
            phone: resolveUpdate(input.phone, employee.phone),
            email: resolveUpdate(input.email, employee.email),
            status: resolveUpdate(input.status, employee.status),
            departmentId: resolveUpdate(
              input.departmentId,
              employee.departmentId,
            ),
            positionId: resolveUpdate(input.positionId, employee.positionId),
            userId: resolveUpdate(input.userId, employee.userId),
          },
        },
        tx,
      );
    });

    return this.employeesRepository.findById(employeeId);
  }

  async archiveEmployee(employeeId: string) {
    const employee = await this.employeesRepository.findById(employeeId);
    if (!employee) throw new EmployeeNotFoundException();
    if (employee.archivedAt) throw new EmployeeArchivedException();

    await pooledDb.transaction(async (tx) => {
      await this.employeesRepository.archive(employeeId, tx);
      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'hr.employee.archive',
          entityType: 'employee',
          entityId: employeeId,
          before: { archivedAt: null },
          after: { archivedAt: new Date().toISOString() },
        },
        tx,
      );
    });

    return this.employeesRepository.findById(employeeId);
  }

  async restoreEmployee(employeeId: string) {
    const employee = await this.employeesRepository.findById(employeeId);
    if (!employee) throw new EmployeeNotFoundException();
    if (!employee.archivedAt) throw new EmployeeNotArchivedException();
    const archivedAt = employee.archivedAt.toISOString();

    await pooledDb.transaction(async (tx) => {
      await this.employeesRepository.restore(employeeId, tx);
      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'hr.employee.restore',
          entityType: 'employee',
          entityId: employeeId,
          before: { archivedAt },
          after: { archivedAt: null },
        },
        tx,
      );
    });

    return this.employeesRepository.findById(employeeId);
  }
}
