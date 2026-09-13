import { Injectable } from '@nestjs/common';
import { pooledDb } from '@/db';
import { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import { HR_DEFAULT_PAGE, HR_DEFAULT_PAGE_SIZE } from '@rona/config/hr';
import type {
  AttendanceEventType,
  AttendanceListParams,
  AttendanceListSearchParams,
  AttendanceManageInput,
  AttendanceSelfInput,
  PaginatedResult,
} from '@rona/types/hr';
import {
  AttendanceFutureEventException,
  AttendanceManagePermissionException,
  AttendanceSequenceConflictException,
  EmployeeArchivedException,
  EmployeeNotFoundException,
  EmployeeSelfNotFoundException,
} from './hr.exception';
import { AttendanceRepository } from './attendance.repository';
import { EmployeesRepository } from './employees.repository';

const ATTENDANCE_TRANSITIONS: Record<
  AttendanceEventType,
  readonly AttendanceEventType[]
> = {
  CLOCK_IN: ['BREAK_START', 'CLOCK_OUT'],
  BREAK_START: ['BREAK_END'],
  BREAK_END: ['BREAK_START', 'CLOCK_OUT'],
  CLOCK_OUT: ['CLOCK_IN'],
};

@Injectable()
export class AttendanceService {
  constructor(
    private readonly attendanceRepository: AttendanceRepository,
    private readonly employeesRepository: EmployeesRepository,
    private readonly auditService: AuditService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async punchSelf(input: AttendanceSelfInput) {
    const employee = await this.employeesRepository.findByUserId(
      this.tenantContext.userId,
    );
    if (!employee) throw new EmployeeSelfNotFoundException();
    return this.punch(employee.id, input.eventType, new Date(), input.notes);
  }

  async punchManaged(input: AttendanceManageInput) {
    if (!this.tenantContext.has('hr.attendance.manage')) {
      throw new AttendanceManagePermissionException();
    }

    const eventAt = input.eventAt ?? new Date();
    if (eventAt.getTime() > Date.now()) {
      throw new AttendanceFutureEventException();
    }
    return this.punch(input.employeeId, input.eventType, eventAt, input.notes);
  }

  async listEvents(
    params: AttendanceListSearchParams,
  ): Promise<PaginatedResult<unknown>> {
    const resolved: AttendanceListParams = {
      ...params,
      page: params.page ?? HR_DEFAULT_PAGE,
      limit: params.limit ?? HR_DEFAULT_PAGE_SIZE,
    };
    const { rows, total } = await this.attendanceRepository.list(resolved);
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

  async getSelfStatus() {
    const employee = await this.employeesRepository.findByUserId(
      this.tenantContext.userId,
    );
    if (!employee) throw new EmployeeSelfNotFoundException();
    return this.statusFor(employee.id);
  }

  async getStatusForEmployee(employeeId: string) {
    const employee = await this.employeesRepository.findById(employeeId);
    if (!employee) throw new EmployeeNotFoundException();
    return this.statusFor(employeeId);
  }

  async punchKiosk(employeeId: string, eventType: AttendanceEventType) {
    return this.punch(employeeId, eventType, new Date(), 'Kiosk');
  }

  private async punch(
    employeeId: string,
    eventType: AttendanceEventType,
    eventAt: Date,
    notes?: string,
  ) {
    return pooledDb.transaction(async (tx) => {
      const employee = await this.employeesRepository.findByIdForUpdate(
        employeeId,
        tx,
      );
      if (!employee) throw new EmployeeNotFoundException();
      if (employee.archivedAt) throw new EmployeeArchivedException();

      const events =
        await this.attendanceRepository.listEventsForEmployee(employeeId);

      const merged = [
        ...events.map((e) => ({
          eventAt: e.eventAt.getTime(),
          eventType: e.eventType,
          isNew: false,
        })),
        { eventAt: eventAt.getTime(), eventType, isNew: true },
      ];
      merged.sort((a, b) => a.eventAt - b.eventAt || (a.isNew ? 1 : -1));
      this.validateSequence(merged.map((e) => e.eventType));

      const created = await this.attendanceRepository.create(
        {
          employeeId,
          eventType,
          eventAt,
          recordedBy: this.tenantContext.userIdOrNull,
          notes,
        },
        tx,
      );

      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'hr.attendance.record',
          entityType: 'attendance_event',
          entityId: created.id,
          after: {
            employeeId,
            eventType,
            eventAt: eventAt.toISOString(),
          },
        },
        tx,
      );

      return created;
    });
  }

  private validateSequence(eventTypes: readonly AttendanceEventType[]) {
    const [first, ...rest] = eventTypes;
    if (first !== 'CLOCK_IN') {
      throw new AttendanceSequenceConflictException(
        'Attendance sequence must start with CLOCK_IN',
      );
    }
    let previous: AttendanceEventType = first;
    for (const current of rest) {
      if (!ATTENDANCE_TRANSITIONS[previous].includes(current)) {
        throw new AttendanceSequenceConflictException(
          `Invalid attendance sequence: ${current} cannot follow ${previous}`,
        );
      }
      previous = current;
    }
  }

  private async statusFor(employeeId: string) {
    const events =
      await this.attendanceRepository.listEventsForEmployee(employeeId);
    const lastEvent = events.length > 0 ? events[events.length - 1] : null;
    return {
      employeeId,
      currentState: lastEvent ? lastEvent.eventType : 'none',
      lastEvent,
    };
  }
}
