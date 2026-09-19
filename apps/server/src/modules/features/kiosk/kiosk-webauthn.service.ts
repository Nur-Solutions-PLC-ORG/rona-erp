import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';
import {
  getRequestContext,
  runWithRequestContext,
} from '@/context/request-context';
import { generateRequestId } from '@/logger';
import { rateLimit } from '@/redis';
import {
  KIOSK_PUNCH_ATTEMPT_LIMIT,
  KIOSK_PUNCH_WINDOW_SECONDS,
} from '@rona/config/kiosk';
import type {
  KioskWebAuthnVerifyInput,
  KioskWebAuthnVerifyResult,
} from '@rona/types/kiosk';
import { AuditService } from '@/modules/audit/audit.service';
import { AttendanceService } from '@/modules/features/hr/attendance.service';
import { EmployeesRepository } from '@/modules/features/hr/employees.repository';
import {
  KioskEmployeeInactiveException,
  KioskEmployeeNotFoundException,
  WebAuthnChallengeInvalidException,
  WebAuthnCredentialNotFoundException,
} from './kiosk.exception';
import type { KioskDeviceContext } from './kiosk.service';
import type {
  WebAuthnAuthenticationChallengeResult,
  WebAuthnAuthenticatedSession,
  WebAuthnService,
} from './webauthn.service';

@Injectable()
export class KioskWebAuthnService {
  private readonly logger = new Logger(KioskWebAuthnService.name);

  constructor(
    private readonly webAuthnService: WebAuthnService,
    private readonly employeesRepository: EmployeesRepository,
    private readonly attendanceService: AttendanceService,
    private readonly auditService: AuditService,
  ) {}

  createAuthOptions(
    device: KioskDeviceContext,
  ): Promise<WebAuthnAuthenticationChallengeResult> {
    return this.webAuthnService.createAuthenticationChallenge({
      organizationId: device.organizationId,
    });
  }

  async verifyAuthAndPunch(
    device: KioskDeviceContext,
    input: KioskWebAuthnVerifyInput,
  ): Promise<KioskWebAuthnVerifyResult> {
    const allowed = await rateLimit(
      `kiosk:webauthn:attempts:${device.kioskId}`,
      KIOSK_PUNCH_ATTEMPT_LIMIT,
      KIOSK_PUNCH_WINDOW_SECONDS,
    );
    if (!allowed) {
      await this.auditKioskAuth(
        device,
        'kiosk.attendance.webauthn_rate_limited',
        { reason: 'attempt_limit' },
      );
      throw new HttpException(
        'Too many attempts. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    let session: WebAuthnAuthenticatedSession;
    try {
      session = await this.webAuthnService.verifyAuthentication({
        organizationId: device.organizationId,
        challenge: input.challenge,
        response: input.response as unknown as AuthenticationResponseJSON,
      });
    } catch (error) {
      await this.auditKioskAuth(
        device,
        'kiosk.attendance.webauthn_auth_failed',
        { reason: this.authFailureReason(error) },
      );
      throw error;
    }

    const employee = await this.withKioskTenant(device.organizationId, () =>
      this.employeesRepository.findById(session.employeeId),
    );

    if (!employee) {
      await this.auditKioskAuth(device, 'kiosk.attendance.employee_not_found', {
        reason: 'employee_not_found',
        employeeId: session.employeeId,
      });
      throw new KioskEmployeeNotFoundException();
    }

    if (employee.status !== 'active' || employee.archivedAt) {
      await this.auditKioskAuth(device, 'kiosk.attendance.employee_inactive', {
        employeeId: employee.id,
      });
      throw new KioskEmployeeInactiveException();
    }

    const event = await this.withKioskTenant(device.organizationId, () =>
      this.attendanceService.punchKiosk(employee.id, input.eventType),
    );

    return {
      employeeId: employee.id,
      employeeName: employee.fullName,
      credentialId: session.credentialId,
      eventType: event.eventType,
      eventAt: event.eventAt.toISOString(),
    };
  }

  private authFailureReason(error: unknown): string {
    if (error instanceof WebAuthnChallengeInvalidException) {
      return 'challenge_invalid';
    }
    if (error instanceof WebAuthnCredentialNotFoundException) {
      return 'credential_not_found';
    }
    return 'verification_failed';
  }

  private async auditKioskAuth(
    device: KioskDeviceContext,
    action: string,
    details: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.auditService.record({
        organizationId: device.organizationId,
        entityId: device.kioskId,
        action,
        entityType: 'kiosk',
        after: details,
      });
    } catch {
      this.logger.warn('Kiosk WebAuthn audit failed.');
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
}
