import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { pooledDb } from '@/db';
import { patchRequestContext } from '@/context/request-context';
import { rateLimit } from '@/redis';
import { KIOSK_PUNCH_ATTEMPT_LIMIT, KIOSK_PUNCH_WINDOW_SECONDS } from '@rona/config/kiosk';
import type {
  EmployeeFaceEnrollResult,
  EmployeeFaceMetadata,
  EmployeeFaceRevokeResult,
  EmployeeFacesResult,
  FaceEnrollInput,
  KioskFaceDescriptorsResult,
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
  EmployeeFaceNotFoundException,
  EmployeeNotFoundException,
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

  async listFaces(employeeId: string): Promise<EmployeeFacesResult> {
    await this.requireActiveEmployee(employeeId);
    const rows = await this.faceRepository.list(employeeId);
    return { faces: rows.map((row) => this.toMetadata(row)) };
  }

  async listKioskDescriptors(
    organizationId: string,
  ): Promise<KioskFaceDescriptorsResult> {
    const rows = await this.faceRepository.listDescriptorsByOrganization(
      organizationId,
    );
    return {
      faces: rows
        .map((row) => ({
          id: row.id,
          descriptor: this.parseDescriptor(row.descriptor),
        }))
        .filter(
          (
            face,
          ): face is { id: string; descriptor: number[] } =>
            face.descriptor.length === 128,
        ),
    };
  }

  async enrollFace(
    employeeId: string,
    input: FaceEnrollInput,
  ): Promise<EmployeeFaceEnrollResult> {
    await this.requireActiveEmployee(employeeId);

    const organizationId = this.tenantContext.organizationId;

    const face = await pooledDb.transaction(async (tx) => {
      await this.faceRepository.revokeExisting(employeeId, tx);
      const row = await this.faceRepository.insertEnrollment(
        {
          organizationId,
          employeeId,
          descriptor: JSON.stringify(input.descriptor),
        },
        tx,
      );
      await this.auditService.record(
        {
          organizationId,
          action: 'hr.face.enroll',
          entityType: 'employee_face',
          entityId: row.id,
          after: { employeeId },
        },
        tx,
      );
      return row;
    });

    return { face: this.toMetadata(face) };
  }

  async revokeFace(
    employeeId: string,
    faceId: string,
  ): Promise<EmployeeFaceRevokeResult> {
    await this.requireActiveEmployee(employeeId);

    const organizationId = this.tenantContext.organizationId;

    const face = await pooledDb.transaction(async (tx) => {
      const row = await this.faceRepository.revoke(faceId, employeeId, tx);
      if (!row) throw new EmployeeFaceNotFoundException();
      await this.auditService.record(
        {
          organizationId,
          action: 'hr.face.revoke',
          entityType: 'employee_face',
          entityId: faceId,
          after: { employeeId, faceId },
        },
        tx,
      );
      return row;
    });

    return { face: this.toMetadata(face) };
  }

  async punchKiosk(
    device: KioskDeviceContext,
    input: KioskFacePunchInput,
  ): Promise<KioskPunchResult> {
    const allowed = await rateLimit(
      `kiosk:face:attempts:${device.kioskId}`,
      KIOSK_PUNCH_ATTEMPT_LIMIT,
      KIOSK_PUNCH_WINDOW_SECONDS,
    );
    if (!allowed) {
      throw new HttpException(
        'Too many attempts. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const match = await this.faceRepository.findActiveById(input.faceId);

    if (!match || match.organizationId !== device.organizationId) {
      await this.auditKioskPunch(
        device.organizationId,
        device.kioskId,
        'kiosk.attendance.face_not_recognized',
        { reason: 'no_active_matching_face' },
      );
      throw new KioskFaceNotRecognizedException();
    }

    if (match.employeeStatus !== 'active' || match.employeeArchivedAt) {
      await this.auditKioskPunch(
        device.organizationId,
        device.kioskId,
        'kiosk.attendance.employee_inactive',
        { employeeId: match.employeeId },
      );
      throw new KioskEmployeeInactiveException();
    }

    const event = await this.withKioskTenant(device.organizationId, () =>
      this.attendanceService.punchKiosk(match.employeeId, input.eventType),
    );

    await this.faceRepository.markUsed(match.id);

    return {
      employeeName: match.employeeFullName,
      eventType: event.eventType,
      eventAt: event.eventAt.toISOString(),
    };
  }

  private async requireActiveEmployee(employeeId: string) {
    const employee = await this.employeesRepository.findById(employeeId);
    if (!employee) throw new EmployeeNotFoundException();
    if (employee.archivedAt) throw new EmployeeArchivedException();
    return employee;
  }

  private async withKioskTenant<T>(
    organizationId: string,
    callback: () => Promise<T>,
  ): Promise<T> {
    patchRequestContext({ organizationId });
    try {
      return await callback();
    } finally {
      patchRequestContext({
        organizationId: undefined,
        userId: undefined,
        membershipId: undefined,
      });
    }
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
    } catch (error) {
      this.logger.warn(`kiosk face audit failed: ${String(error)}`);
    }
  }

  private parseDescriptor(raw: string): number[] {
    try {
      const parsed = JSON.parse(raw);
      if (
        Array.isArray(parsed) &&
        parsed.length === 128 &&
        parsed.every((value) => typeof value === 'number' && isFinite(value))
      ) {
        return parsed;
      }
    } catch {
      // fall through to empty result
    }
    return [];
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