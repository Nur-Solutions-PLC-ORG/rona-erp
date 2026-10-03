import { Injectable } from '@nestjs/common';
import { pooledDb } from '@/db';
import { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import { HR_DEFAULT_PAGE, HR_DEFAULT_PAGE_SIZE } from '@rona/config/hr';
import type {
  EmployeeShiftAssignInput,
  EmployeeShiftEndInput,
  PaginatedResult,
  ShiftCreateInput,
  ShiftListParams,
  ShiftListSearchParams,
  ShiftUpdateInput,
} from '@rona/types/hr';
import {
  EmployeeArchivedException,
  EmployeeNotFoundException,
  EmployeeShiftConflictException,
  EmployeeShiftNotFoundException,
  ShiftCodeConflictException,
  ShiftNotFoundException,
} from './hr.exception';
import { EmployeesRepository } from './employees.repository';
import { ShiftsRepository } from './shifts.repository';

@Injectable()
export class ShiftsService {
  constructor(
    private readonly shiftsRepository: ShiftsRepository,
    private readonly employeesRepository: EmployeesRepository,
    private readonly auditService: AuditService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async createShift(input: ShiftCreateInput) {
    const existing = await this.shiftsRepository.findShiftByCode(input.code);
    if (existing) throw new ShiftCodeConflictException();

    return pooledDb.transaction(async (tx) => {
      const created = await this.shiftsRepository.createShift(input, tx);
      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'hr.shift.create',
          entityType: 'shift',
          entityId: created.id,
          after: {
            code: created.code,
            name: created.name,
            startTime: created.startTime,
            endTime: created.endTime,
          },
        },
        tx,
      );
      return created;
    });
  }

  async getShift(shiftId: string) {
    const shift = await this.shiftsRepository.findShiftById(shiftId);
    if (!shift) throw new ShiftNotFoundException();
    return shift;
  }

  async listShifts(
    params: ShiftListSearchParams,
  ): Promise<PaginatedResult<unknown>> {
    const resolved: ShiftListParams = {
      ...params,
      page: params.page ?? HR_DEFAULT_PAGE,
      limit: params.limit ?? HR_DEFAULT_PAGE_SIZE,
    };
    const { rows, total } = await this.shiftsRepository.listShifts(resolved);
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

  async updateShift(shiftId: string, input: ShiftUpdateInput) {
    const shift = await this.shiftsRepository.findShiftById(shiftId);
    if (!shift) throw new ShiftNotFoundException();

    if (input.code && input.code !== shift.code) {
      const existing = await this.shiftsRepository.findShiftByCode(input.code);
      if (existing && existing.id !== shiftId) {
        throw new ShiftCodeConflictException();
      }
    }

    return pooledDb.transaction(async (tx) => {
      const updated = await this.shiftsRepository.updateShift(
        shiftId,
        input,
        tx,
      );
      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'hr.shift.update',
          entityType: 'shift',
          entityId: shiftId,
          before: {
            code: shift.code,
            name: shift.name,
            startTime: shift.startTime,
            endTime: shift.endTime,
          },
          after: {
            code: updated.code,
            name: updated.name,
            startTime: updated.startTime,
            endTime: updated.endTime,
          },
        },
        tx,
      );
      return updated;
    });
  }

  async assignShift(employeeId: string, input: EmployeeShiftAssignInput) {
    const employee = await this.employeesRepository.findById(employeeId);
    if (!employee) throw new EmployeeNotFoundException();
    if (employee.archivedAt) throw new EmployeeArchivedException();

    const shift = await this.shiftsRepository.findShiftById(input.shiftId);
    if (!shift) throw new ShiftNotFoundException();

    const overlapping = await this.shiftsRepository.findOverlappingAssignment(
      employeeId,
      input.effectiveFrom,
      input.effectiveTo,
    );
    if (overlapping) {
      throw new EmployeeShiftConflictException(
        'Employee already has a shift assignment overlapping this date range',
      );
    }

    return pooledDb.transaction(async (tx) => {
      const created = await this.shiftsRepository.assignShift(
        { ...input, employeeId },
        tx,
      );
      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'hr.shift.assign',
          entityType: 'employee_shift',
          entityId: created.id,
          after: {
            employeeId,
            shiftId: input.shiftId,
            effectiveFrom: input.effectiveFrom,
            effectiveTo: input.effectiveTo ?? null,
          },
        },
        tx,
      );
      return created;
    });
  }

  async endAssignment(
    employeeId: string,
    assignmentId: string,
    input: EmployeeShiftEndInput,
  ) {
    const assignment =
      await this.shiftsRepository.findAssignmentById(assignmentId);
    if (!assignment || assignment.employeeId !== employeeId) {
      throw new EmployeeShiftNotFoundException();
    }
    if (assignment.effectiveTo !== null) {
      throw new EmployeeShiftConflictException(
        'Shift assignment is already ended',
      );
    }
    if (input.effectiveTo < assignment.effectiveFrom) {
      throw new EmployeeShiftConflictException(
        'effectiveTo cannot be before the assignment start date',
      );
    }

    return pooledDb.transaction(async (tx) => {
      const updated = await this.shiftsRepository.endAssignment(
        assignmentId,
        input.effectiveTo,
        tx,
      );
      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'hr.shift.assign.end',
          entityType: 'employee_shift',
          entityId: assignmentId,
          before: { effectiveTo: null },
          after: { effectiveTo: input.effectiveTo },
        },
        tx,
      );
      return updated;
    });
  }

  async listAssignments(employeeId: string) {
    const employee = await this.employeesRepository.findById(employeeId);
    if (!employee) throw new EmployeeNotFoundException();
    return this.shiftsRepository.listAssignmentsForEmployee(employeeId);
  }
}
