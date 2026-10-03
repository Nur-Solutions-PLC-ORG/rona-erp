import { Injectable } from '@nestjs/common';
import { pooledDb } from '@/db';
import { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import { HR_DEFAULT_PAGE, HR_DEFAULT_PAGE_SIZE } from '@rona/config/hr';
import type {
  DepartmentCreateInput,
  DepartmentListParams,
  DepartmentListSearchParams,
  DepartmentUpdateInput,
  PaginatedResult,
  PositionCreateInput,
  PositionListParams,
  PositionListSearchParams,
  PositionUpdateInput,
} from '@rona/types/hr';
import {
  DepartmentCodeConflictException,
  DepartmentNotFoundException,
  PositionArchivedException,
  PositionCodeConflictException,
  PositionInUseException,
  PositionNotFoundException,
  PositionNotArchivedException,
} from './hr.exception';
import { DepartmentsRepository } from './departments.repository';
import { EmployeesRepository } from './employees.repository';

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly departmentsRepository: DepartmentsRepository,
    private readonly employeesRepository: EmployeesRepository,
    private readonly auditService: AuditService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async createDepartment(input: DepartmentCreateInput) {
    if (input.code) {
      const existing = await this.departmentsRepository.findDepartmentByCode(
        input.code,
      );
      if (existing) throw new DepartmentCodeConflictException();
    }

    return pooledDb.transaction(async (tx) => {
      const created = await this.departmentsRepository.createDepartment(
        input,
        tx,
      );
      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'hr.department.create',
          entityType: 'department',
          entityId: created.id,
          after: { name: created.name, code: created.code },
        },
        tx,
      );
      return created;
    });
  }

  async getDepartment(departmentId: string) {
    const department =
      await this.departmentsRepository.findDepartmentById(departmentId);
    if (!department) throw new DepartmentNotFoundException();
    return department;
  }

  async listDepartments(
    params: DepartmentListSearchParams,
  ): Promise<PaginatedResult<unknown>> {
    const resolved: DepartmentListParams = {
      ...params,
      page: params.page ?? HR_DEFAULT_PAGE,
      limit: params.limit ?? HR_DEFAULT_PAGE_SIZE,
    };
    const { rows, total } =
      await this.departmentsRepository.listDepartments(resolved);
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

  async updateDepartment(departmentId: string, input: DepartmentUpdateInput) {
    const department =
      await this.departmentsRepository.findDepartmentById(departmentId);
    if (!department) throw new DepartmentNotFoundException();

    if (input.code && input.code !== department.code) {
      const existing = await this.departmentsRepository.findDepartmentByCode(
        input.code,
      );
      if (existing && existing.id !== departmentId) {
        throw new DepartmentCodeConflictException();
      }
    }

    return pooledDb.transaction(async (tx) => {
      const updated = await this.departmentsRepository.updateDepartment(
        departmentId,
        input,
        tx,
      );
      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'hr.department.update',
          entityType: 'department',
          entityId: departmentId,
          before: { name: department.name, code: department.code },
          after: { name: updated.name, code: updated.code },
        },
        tx,
      );
      return updated;
    });
  }

  async createPosition(input: PositionCreateInput) {
    if (input.departmentId) {
      const department = await this.departmentsRepository.findDepartmentById(
        input.departmentId,
      );
      if (!department) throw new DepartmentNotFoundException();
    }

    const existing = await this.departmentsRepository.findPositionByCode(
      input.code,
    );
    if (existing) throw new PositionCodeConflictException();

    return pooledDb.transaction(async (tx) => {
      const created = await this.departmentsRepository.createPosition(
        input,
        tx,
      );
      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'hr.position.create',
          entityType: 'position',
          entityId: created.id,
          after: {
            title: created.title,
            code: created.code,
            departmentId: created.departmentId,
          },
        },
        tx,
      );
      return created;
    });
  }

  async getPosition(positionId: string) {
    const position =
      await this.departmentsRepository.findPositionById(positionId);
    if (!position) throw new PositionNotFoundException();
    return position;
  }

  async listPositions(
    params: PositionListSearchParams,
  ): Promise<PaginatedResult<unknown>> {
    const resolved: PositionListParams = {
      ...params,
      page: params.page ?? HR_DEFAULT_PAGE,
      limit: params.limit ?? HR_DEFAULT_PAGE_SIZE,
    };
    const { rows, total } =
      await this.departmentsRepository.listPositions(resolved);
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

  async updatePosition(positionId: string, input: PositionUpdateInput) {
    const position =
      await this.departmentsRepository.findPositionById(positionId);
    if (!position) throw new PositionNotFoundException();

    if (input.code && input.code !== position.code) {
      const existing = await this.departmentsRepository.findPositionByCode(
        input.code,
      );
      if (existing && existing.id !== positionId) {
        throw new PositionCodeConflictException();
      }
    }

    if (input.departmentId && input.departmentId !== position.departmentId) {
      const department = await this.departmentsRepository.findDepartmentById(
        input.departmentId,
      );
      if (!department) throw new DepartmentNotFoundException();
    }

    return pooledDb.transaction(async (tx) => {
      const updated = await this.departmentsRepository.updatePosition(
        positionId,
        input,
        tx,
      );
      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'hr.position.update',
          entityType: 'position',
          entityId: positionId,
          before: {
            title: position.title,
            code: position.code,
            departmentId: position.departmentId,
          },
          after: {
            title: updated.title,
            code: updated.code,
            departmentId: updated.departmentId,
          },
        },
        tx,
      );
      return updated;
    });
  }

  async archivePosition(positionId: string) {
    const position =
      await this.departmentsRepository.findPositionById(positionId);
    if (!position) throw new PositionNotFoundException();
    if (position.archivedAt) throw new PositionArchivedException();

    const employeeCount =
      await this.employeesRepository.countEmployeesInPosition(positionId);
    if (employeeCount > 0) throw new PositionInUseException();

    return pooledDb.transaction(async (tx) => {
      const archived = await this.departmentsRepository.archivePosition(
        positionId,
        tx,
      );
      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'hr.position.archive',
          entityType: 'position',
          entityId: positionId,
          before: { archivedAt: null },
          after: { archivedAt: new Date().toISOString() },
        },
        tx,
      );
      return archived;
    });
  }

  async restorePosition(positionId: string) {
    const position =
      await this.departmentsRepository.findPositionById(positionId);
    if (!position) throw new PositionNotFoundException();
    if (!position.archivedAt) throw new PositionNotArchivedException();
    const archivedAt = position.archivedAt.toISOString();

    return pooledDb.transaction(async (tx) => {
      const restored = await this.departmentsRepository.restorePosition(
        positionId,
        tx,
      );
      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'hr.position.restore',
          entityType: 'position',
          entityId: positionId,
          before: { archivedAt },
          after: { archivedAt: null },
        },
        tx,
      );
      return restored;
    });
  }
}
