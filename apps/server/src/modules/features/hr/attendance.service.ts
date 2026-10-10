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
  AttendanceSource,
  PaginatedResult,
} from '@rona/types/hr';
import type { KioskVerificationMethod } from '@rona/types/kiosk';
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

/** Events that may follow the current state ('none' = no events yet). */
export function allowedNextAttendanceEvents(
  current: AttendanceEventType | 'none',
): AttendanceEventType[] {
  return current === 'none'
    ? ['CLOCK_IN']
    : [...ATTENDANCE_TRANSITIONS[current]];
}

/** Where an attendance event came from and how the employee was verified. */
export interface AttendanceProvenance {
  source: AttendanceSource;
  kioskId?: string | null;
  methods?: KioskVerificationMethod[] | null;
  matchScore?: number | null;
  clientEventId?: string | null;
  deviceEventAt?: Date | null;
}

export interface AttendanceDevicePunch {
  employeeId: string;
  eventType: AttendanceEventType;
  eventAt: Date;
  kioskId: string;
  methods: KioskVerificationMethod[];
  matchScore?: number | null;
  clientEventId: string;
  deviceEventAt: Date;
}

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
    return this.punch(employee.id, input.eventType, new Date(), input.notes, {
      source: 'SELF',
    });
  }

  async punchManaged(input: AttendanceManageInput) {
    if (!this.tenantContext.has('hr.attendance.manage')) {
      throw new AttendanceManagePermissionException();
    }

    const eventAt = input.eventAt ?? new Date();
    if (eventAt.getTime() > Date.now()) {
      throw new AttendanceFutureEventException();
    }
    return this.punch(input.employeeId, input.eventType, eventAt, input.notes, {
      source: 'MANUAL',
    });
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

  async punchKiosk(
    employeeId: string,
    eventType: AttendanceEventType,
    kiosk?: { kioskId: string; methods: KioskVerificationMethod[] },
  ) {
    return this.punch(employeeId, eventType, new Date(), 'Kiosk', {
      source: 'KIOSK',
      kioskId: kiosk?.kioskId ?? null,
      methods: kiosk?.methods ?? null,
    });
  }

  /** Punch verified on a native terminal (Rona Kiosk app). */
  async punchDevice(input: AttendanceDevicePunch) {
    return this.punch(
      input.employeeId,
      input.eventType,
      input.eventAt,
      'Kiosk',
      {
        source: 'KIOSK',
        kioskId: input.kioskId,
        methods: input.methods,
        matchScore: input.matchScore ?? null,
        clientEventId: input.clientEventId,
        deviceEventAt: input.deviceEventAt,
      },
    );
  }

  async findByClientEventId(clientEventId: string) {
    return this.attendanceRepository.findByClientEventId(clientEventId);
  }

  async getCurrentState(employeeId: string) {
    return this.statusFor(employeeId);
  }

  private async punch(
    employeeId: string,
    eventType: AttendanceEventType,
    eventAt: Date,
    notes: string | undefined,
    provenance: AttendanceProvenance,
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
          source: provenance.source,
          kioskId: provenance.kioskId ?? null,
          methods: provenance.methods ?? null,
          matchScore: provenance.matchScore ?? null,
          clientEventId: provenance.clientEventId ?? null,
          deviceEventAt: provenance.deviceEventAt ?? null,
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
            source: provenance.source,
            ...(provenance.kioskId ? { kioskId: provenance.kioskId } : {}),
            ...(provenance.methods ? { methods: provenance.methods } : {}),
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
    const currentState: AttendanceEventType | 'none' = lastEvent
      ? lastEvent.eventType
      : 'none';
    return {
      employeeId,
      currentState,
      lastEvent,
    };
  }
}
