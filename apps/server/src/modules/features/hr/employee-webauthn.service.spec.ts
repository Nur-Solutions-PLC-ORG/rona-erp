import {
  CHALLENGE,
  CREDENTIAL_ID,
  EMPLOYEE,
  EMPLOYEE_FULL_NAME,
  EMPLOYEE_ID,
  ORG_A,
  REGISTERED_CREDENTIAL,
  REGISTRATION_CHALLENGE,
  VERIFY_INPUT,
  auditRecord,
  defaultMocks,
  empFindById,
  runInOrganizationA,
  service,
  webAuthnCreateChallenge,
  webAuthnVerifyRegistration,
} from './employee-webauthn.spec-harness';
import {
  EmployeeArchivedException,
  EmployeeNotFoundException,
} from './hr.exception';
import {
  WebAuthnChallengeInvalidException,
  WebAuthnCredentialAlreadyExistsException,
  WebAuthnVerificationFailedException,
} from '../kiosk/kiosk.exception';
import { EmployeeWebAuthnController } from './employee-webauthn.controller';
import {
  GUARDS_METADATA,
  HTTP_CODE_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { TenantGuard } from '@/modules/tenancy/tenant.guard';
import { PermissionGuard } from '@/modules/rbac/permission.guard';
import { PERMISSIONS_KEY } from '@/modules/rbac/require-permissions.decorator';

jest.mock('@/db', () => ({
  db: {},
  pooledDb: { transaction: jest.fn() },
}));

describe('EmployeeWebAuthnService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    defaultMocks();
  });

  describe('createRegistrationOptions', () => {
    it('issues registration options for the active employee', async () => {
      const result = await runInOrganizationA(() =>
        service.createRegistrationOptions(EMPLOYEE_ID),
      );
      expect(empFindById).toHaveBeenCalledWith(EMPLOYEE_ID);
      expect(webAuthnCreateChallenge).toHaveBeenCalledWith({
        organizationId: ORG_A,
        employeeId: EMPLOYEE_ID,
        employeeName: EMPLOYEE_FULL_NAME,
      });
      expect(result).toEqual(REGISTRATION_CHALLENGE);
    });

    it('rejects an unknown employee', async () => {
      empFindById.mockResolvedValue(undefined);
      await expect(
        runInOrganizationA(() =>
          service.createRegistrationOptions(EMPLOYEE_ID),
        ),
      ).rejects.toThrow(EmployeeNotFoundException);
      expect(webAuthnCreateChallenge).not.toHaveBeenCalled();
    });

    it('rejects an archived employee', async () => {
      empFindById.mockResolvedValue({ ...EMPLOYEE, archivedAt: new Date() });
      await expect(
        runInOrganizationA(() =>
          service.createRegistrationOptions(EMPLOYEE_ID),
        ),
      ).rejects.toThrow(EmployeeArchivedException);
      expect(webAuthnCreateChallenge).not.toHaveBeenCalled();
    });

    it.each(['suspended', 'on_leave', 'resigned', 'terminated', 'inactive'])(
      'rejects an %s employee',
      async (status) => {
        empFindById.mockResolvedValue({ ...EMPLOYEE, status });
        await expect(
          runInOrganizationA(() =>
            service.createRegistrationOptions(EMPLOYEE_ID),
          ),
        ).rejects.toMatchObject({ status: 403 });
        expect(webAuthnCreateChallenge).not.toHaveBeenCalled();
      },
    );
  });

  describe('verifyRegistration', () => {
    it('verifies and stores the credential without a failure audit', async () => {
      const result = await runInOrganizationA(() =>
        service.verifyRegistration(EMPLOYEE_ID, VERIFY_INPUT),
      );
      expect(webAuthnVerifyRegistration).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          employeeId: EMPLOYEE_ID,
          challenge: CHALLENGE,
        }),
      );
      expect(result).toEqual(REGISTERED_CREDENTIAL);
      expect(auditRecord).not.toHaveBeenCalled();
    });

    it('validates the employee before issuing the challenge', async () => {
      empFindById.mockResolvedValue({ ...EMPLOYEE, status: 'on_leave' });
      await expect(
        runInOrganizationA(() =>
          service.verifyRegistration(EMPLOYEE_ID, VERIFY_INPUT),
        ),
      ).rejects.toMatchObject({ status: 403 });
      expect(webAuthnVerifyRegistration).not.toHaveBeenCalled();
      expect(auditRecord).not.toHaveBeenCalled();
    });

    it('audits and rethrows an invalid challenge', async () => {
      webAuthnVerifyRegistration.mockRejectedValue(
        new WebAuthnChallengeInvalidException(),
      );
      await expect(
        runInOrganizationA(() =>
          service.verifyRegistration(EMPLOYEE_ID, VERIFY_INPUT),
        ),
      ).rejects.toThrow(WebAuthnChallengeInvalidException);
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'hr.webauthn.enroll.failed',
          entityType: 'employee',
          entityId: EMPLOYEE_ID,
          after: { employeeId: EMPLOYEE_ID, reason: 'challenge_invalid' },
        }),
      );
    });

    it('audits and rethrows an already registered credential', async () => {
      webAuthnVerifyRegistration.mockRejectedValue(
        new WebAuthnCredentialAlreadyExistsException(),
      );
      await expect(
        runInOrganizationA(() =>
          service.verifyRegistration(EMPLOYEE_ID, VERIFY_INPUT),
        ),
      ).rejects.toThrow(WebAuthnCredentialAlreadyExistsException);
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'hr.webauthn.enroll.failed',
          after: { employeeId: EMPLOYEE_ID, reason: 'already_registered' },
        }),
      );
    });

    it('audits and rethrows a generic verification failure', async () => {
      webAuthnVerifyRegistration.mockRejectedValue(
        new WebAuthnVerificationFailedException(),
      );
      await expect(
        runInOrganizationA(() =>
          service.verifyRegistration(EMPLOYEE_ID, VERIFY_INPUT),
        ),
      ).rejects.toThrow(WebAuthnVerificationFailedException);
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'hr.webauthn.enroll.failed',
          after: { employeeId: EMPLOYEE_ID, reason: 'verification_failed' },
        }),
      );
    });

    it('never writes credential data to the failure audit', async () => {
      webAuthnVerifyRegistration.mockRejectedValue(
        new WebAuthnVerificationFailedException(),
      );
      await expect(
        runInOrganizationA(() =>
          service.verifyRegistration(EMPLOYEE_ID, VERIFY_INPUT),
        ),
      ).rejects.toThrow(WebAuthnVerificationFailedException);
      const auditPayload = JSON.stringify(auditRecord.mock.calls);
      expect(auditPayload).not.toContain(CREDENTIAL_ID);
      expect(auditPayload).not.toContain('client-data');
      expect(auditPayload).not.toContain('attestation-object');
    });

    it('does not mask the original failure when auditing fails', async () => {
      webAuthnVerifyRegistration.mockRejectedValue(
        new WebAuthnChallengeInvalidException(),
      );
      auditRecord.mockRejectedValue(new Error('audit unavailable'));
      await expect(
        runInOrganizationA(() =>
          service.verifyRegistration(EMPLOYEE_ID, VERIFY_INPUT),
        ),
      ).rejects.toThrow(WebAuthnChallengeInvalidException);
    });
  });
});

describe('employee WebAuthn controller', () => {
  it('exposes enrollment routes behind HR-only guards and permission', () => {
    expect(Reflect.getMetadata(PATH_METADATA, EmployeeWebAuthnController)).toBe(
      'employees/:id/webauthn',
    );
    expect(
      Reflect.getMetadata(PERMISSIONS_KEY, EmployeeWebAuthnController),
    ).toEqual(['hr.webauthn.enroll']);
    expect(
      Reflect.getMetadata(GUARDS_METADATA, EmployeeWebAuthnController),
    ).toEqual([AuthGuard, TenantGuard, PermissionGuard]);
    for (const [method, path, verb] of [
      [
        EmployeeWebAuthnController.prototype.createRegistrationOptions,
        'register/options',
        RequestMethod.POST,
      ],
      [
        EmployeeWebAuthnController.prototype.verifyRegistration,
        'register/verify',
        RequestMethod.POST,
      ],
    ] as const) {
      expect(Reflect.getMetadata(PATH_METADATA, method)).toBe(path);
      expect(Reflect.getMetadata(METHOD_METADATA, method)).toBe(verb);
    }
    expect(
      Reflect.getMetadata(
        HTTP_CODE_METADATA,
        EmployeeWebAuthnController.prototype.verifyRegistration,
      ),
    ).toBe(200);
  });
});
