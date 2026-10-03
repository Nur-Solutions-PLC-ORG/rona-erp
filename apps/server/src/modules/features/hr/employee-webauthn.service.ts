import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import type { RegistrationResponseJSON } from '@simplewebauthn/server';
import type { WebAuthnRegistrationVerifyInput } from '@rona/types/hr';
import { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import {
  WebAuthnService,
  type WebAuthnRegisteredCredential,
  type WebAuthnRegistrationChallengeResult,
} from '../kiosk/webauthn.service';
import {
  WebAuthnChallengeInvalidException,
  WebAuthnCredentialAlreadyExistsException,
} from '../kiosk/kiosk.exception';
import { EmployeesRepository } from './employees.repository';
import {
  EmployeeArchivedException,
  EmployeeNotFoundException,
} from './hr.exception';

@Injectable()
export class EmployeeWebAuthnService {
  private readonly logger = new Logger(EmployeeWebAuthnService.name);

  constructor(
    private readonly employeesRepository: EmployeesRepository,
    private readonly tenantContext: TenantContextService,
    private readonly webAuthnService: WebAuthnService,
    private readonly auditService: AuditService,
  ) {}

  async createRegistrationOptions(
    employeeId: string,
  ): Promise<WebAuthnRegistrationChallengeResult> {
    const employee = await this.requireEnrollableEmployee(employeeId);
    return this.webAuthnService.createRegistrationChallenge({
      organizationId: this.tenantContext.organizationId,
      employeeId: employee.id,
      employeeName: employee.fullName,
    });
  }

  async verifyRegistration(
    employeeId: string,
    input: WebAuthnRegistrationVerifyInput,
  ): Promise<WebAuthnRegisteredCredential> {
    const employee = await this.requireEnrollableEmployee(employeeId);
    const organizationId = this.tenantContext.organizationId;
    try {
      return await this.webAuthnService.verifyRegistration({
        organizationId,
        employeeId: employee.id,
        challenge: input.challenge,
        response: input.response as unknown as RegistrationResponseJSON,
      });
    } catch (error) {
      await this.auditEnrollmentFailure(employeeId, error);
      throw error;
    }
  }

  private async requireEnrollableEmployee(employeeId: string) {
    const employee = await this.employeesRepository.findById(employeeId);
    if (!employee) throw new EmployeeNotFoundException();
    if (employee.archivedAt) throw new EmployeeArchivedException();
    if (employee.status !== 'active') {
      throw new HttpException(
        'Inactive employees cannot enroll a fingerprint credential.',
        HttpStatus.FORBIDDEN,
      );
    }
    return employee;
  }

  private async auditEnrollmentFailure(
    employeeId: string,
    error: unknown,
  ): Promise<void> {
    try {
      await this.auditService.record({
        organizationId: this.tenantContext.organizationId,
        action: 'hr.webauthn.enroll.failed',
        entityType: 'employee',
        entityId: employeeId,
        after: { employeeId, reason: this.failureReason(error) },
      });
    } catch (auditError) {
      this.logger.warn(
        `WebAuthn enrollment failure audit failed: ${String(auditError)}`,
      );
    }
  }

  private failureReason(error: unknown): string {
    if (error instanceof WebAuthnChallengeInvalidException) {
      return 'challenge_invalid';
    }
    if (error instanceof WebAuthnCredentialAlreadyExistsException) {
      return 'already_registered';
    }
    return 'verification_failed';
  }
}
