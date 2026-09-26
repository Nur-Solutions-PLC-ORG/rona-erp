import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { pooledDb } from '@/db';
import {
  getRequestContext,
  runWithRequestContext,
} from '@/context/request-context';
import { generateRequestId } from '@/logger';
import { rateLimit } from '@/redis';
import {
  KIOSK_FACE_MATCH_DISTANCE,
  KIOSK_PUNCH_ATTEMPT_LIMIT,
  KIOSK_PUNCH_WINDOW_SECONDS,
} from '@rona/config/kiosk';
import {
  faceDescriptorSchema,
  kioskFacePunchSchema,
} from '@rona/validation/kiosk';
import type {
  EmployeeFaceEnrollResult,
  EmployeeFaceMetadata,
  EmployeeFaceRevokeResult,
  EmployeeFacesResult,
  FaceEnrollInput,
  KioskFacePunchInput,
  KioskPunchResult,
} from '@rona/types/kiosk';
import { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import { AttendanceService } from './attendance.service';
import { EmployeesRepository } from './employees.repository';
import { FaceRepository } from './face.repository';
import {
  EmployeeArchivedException,
  EmployeeSelfNotFoundException,
} from './hr.exception';
import {
  KioskEmployeeInactiveException,
  KioskFaceNotRecognizedException,
} from '../kiosk/kiosk.exception';
import type { KioskDeviceContext } from '../kiosk/kiosk.service';

@Injectable()
export class FaceService {
  private readonly logger = new Logger(FaceService.name);

  constructor(
    private readonly faceRepository: FaceRepository,
    private readonly employeesRepository: EmployeesRepository,
    private readonly attendanceService: AttendanceService,
    private readonly tenantContext: TenantContextService,
    private readonly auditService: AuditService,
  ) {}

  async listFaces(): Promise<EmployeeFacesResult> {
    const employee = await this.requireSelfEmployee();
    const rows = await this.faceRepository.list(employee.id);
    return { faces: rows.map((row) => this.toMetadata(row)) };
  }

  async enrollFace(input: FaceEnrollInput): Promise<EmployeeFaceEnrollResult> {
    const employee = await this.requireSelfEmployee();
    const descriptor = faceDescriptorSchema.safeParse(input?.descriptor);
    if (!descriptor.success) {
      throw new BadRequestException('Invalid face descriptor.');
    }
    const organizationId = this.tenantContext.organizationId;

    const face = await pooledDb.transaction(async (tx) => {
      const locked = await this.employeesRepository.findByIdForUpdate(
        employee.id,
        tx,
      );
      this.assertSelfEmployee(locked);
      if (locked.archivedAt) throw new EmployeeArchivedException();
      if (locked.status !== 'active') {
        throw new HttpException(
          'Inactive employees cannot enroll a face.',
          HttpStatus.FORBIDDEN,
        );
      }
      await this.faceRepository.revokeExisting(employee.id, tx);
      const row = await this.faceRepository.insertEnrollment(
        {
          organizationId,
          employeeId: employee.id,
          descriptor: JSON.stringify(descriptor.data),
        },
        tx,
      );
      await this.auditService.record(
        {
          organizationId,
          action: 'hr.face.enroll',
          entityType: 'employee_face',
          entityId: row.id,
          after: { employeeId: employee.id },
        },
        tx,
      );
      return row;
    });

    return { face: this.toMetadata(face) };
  }

  async revokeFace(): Promise<EmployeeFaceRevokeResult> {
    const employee = await this.requireSelfEmployee();

    return this.withKioskTenant(employee.organizationId, async () => {
      const face = await pooledDb.transaction(async (tx) => {
        const locked = await this.employeesRepository.findByIdForUpdate(
          employee.id,
          tx,
        );
        this.assertSelfEmployee(locked, {
          organizationId: employee.organizationId,
          userId: employee.userId,
        });
        const [row] = await this.faceRepository.revokeExisting(employee.id, tx);
        if (!row) return null;
        await this.auditService.record(
          {
            organizationId: employee.organizationId,
            action: 'hr.face.revoke',
            entityType: 'employee_face',
            entityId: row.id,
            after: { employeeId: employee.id, faceId: row.id },
          },
          tx,
        );
        return row;
      });

      return { face: face ? this.toMetadata(face) : null };
    });
  }

  async punchKiosk(
    device: KioskDeviceContext,
    input: KioskFacePunchInput,
  ): Promise<KioskPunchResult> {
    return this.withKioskTenant(device.organizationId, async () => {
      const allowed = await rateLimit(
        `kiosk:face:attempts:${device.kioskId}`,
        KIOSK_PUNCH_ATTEMPT_LIMIT,
        KIOSK_PUNCH_WINDOW_SECONDS,
      );
      if (!allowed) {
        await this.auditKioskPunch(
          device.organizationId,
          device.kioskId,
          'kiosk.attendance.face_rate_limited',
          { reason: 'attempt_limit' },
        );
        throw new HttpException(
          'Too many attempts. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      const parsed = kioskFacePunchSchema.safeParse(input);
      if (!parsed.success) {
        await this.rejectKioskFace(device, 'invalid_input');
        throw new KioskFaceNotRecognizedException();
      }
      const employee = await this.employeesRepository.findByEid(
        parsed.data.eid,
      );
      const match =
        employee?.organizationId === device.organizationId &&
        employee.eid === parsed.data.eid
          ? await this.faceRepository.findActiveForEmployee(
              device.organizationId,
              employee.id,
            )
          : undefined;
      const enrolledDescriptor = match
        ? this.parseDescriptor(match.descriptor)
        : [];
      const distanceSquared = enrolledDescriptor.reduce(
        (sum, value, index) =>
          sum + (value - parsed.data.descriptor[index]) ** 2,
        0,
      );

      if (
        !match ||
        match.organizationId !== device.organizationId ||
        match.employeeId !== employee?.id ||
        match.revokedAt !== null ||
        enrolledDescriptor.length !== 128 ||
        !Number.isFinite(distanceSquared) ||
        distanceSquared >= KIOSK_FACE_MATCH_DISTANCE ** 2
      ) {
        await this.rejectKioskFace(device, 'no_active_matching_face');
        throw new KioskFaceNotRecognizedException();
      }

      if (
        employee?.status !== 'active' ||
        employee.archivedAt ||
        match.employeeStatus !== 'active' ||
        match.employeeArchivedAt
      ) {
        await this.auditKioskPunch(
          device.organizationId,
          device.kioskId,
          'kiosk.attendance.employee_inactive',
          { employeeId: match.employeeId },
        );
        throw new KioskEmployeeInactiveException();
      }

      const event = await this.attendanceService.punchKiosk(
        match.employeeId,
        parsed.data.eventType,
      );
      await this.faceRepository.markUsed(device.organizationId, match.id);

      return {
        employeeName: match.employeeFullName,
        eventType: event.eventType,
        eventAt: event.eventAt.toISOString(),
      };
    });
  }

  private async requireSelfEmployee() {
    const employee = await this.employeesRepository.findByUserId(
      this.tenantContext.userId,
    );
    this.assertSelfEmployee(employee);
    return employee;
  }

  private assertSelfEmployee(
    employee:
      Awaited<ReturnType<EmployeesRepository['findByUserId']>> | undefined,
    expected?: { organizationId: string; userId: string | null },
  ): asserts employee is NonNullable<typeof employee> {
    const { organizationId, userId } = expected ?? {
      organizationId: this.tenantContext.organizationId,
      userId: this.tenantContext.userId,
    };
    if (
      !employee ||
      employee.organizationId !== organizationId ||
      employee.userId !== userId
    ) {
      throw new EmployeeSelfNotFoundException();
    }
  }

  private withKioskTenant<T>(
    organizationId: string,
    callback: () => Promise<T>,
  ): Promise<T> {
    const original = getRequestContext();
    return runWithRequestContext(
      {
        ...original,
        requestId: original?.requestId ?? generateRequestId(),
        organizationId,
        userId: undefined,
        membershipId: undefined,
        roles: [],
        permissions: [],
        modules: [],
      },
      callback,
    );
  }

  private rejectKioskFace(
    device: KioskDeviceContext,
    reason: string,
  ): Promise<void> {
    return this.auditKioskPunch(
      device.organizationId,
      device.kioskId,
      'kiosk.attendance.face_not_recognized',
      { reason },
    );
  }

  private async auditKioskPunch(
    organizationId: string,
    kioskId: string,
    action: string,
    details: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.auditService.record({
        organizationId,
        entityId: kioskId,
        action,
        entityType: 'kiosk',
        after: details,
      });
    } catch {
      this.logger.warn('Kiosk face audit failed.');
    }
  }

  private parseDescriptor(raw: string): number[] {
    try {
      const parsed = faceDescriptorSchema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : [];
    } catch {
      return [];
    }
  }

  private toMetadata(row: {
    id: string;
    enrolledAt: Date;
    lastUsedAt: Date | null;
    revokedAt: Date | null;
  }): EmployeeFaceMetadata {
    return {
      id: row.id,
      enrolledAt: row.enrolledAt.toISOString(),
      lastUsedAt: row.lastUsedAt ? row.lastUsedAt.toISOString() : null,
      revokedAt: row.revokedAt ? row.revokedAt.toISOString() : null,
    };
  }
}
