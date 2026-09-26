import { HttpException } from '@nestjs/common';
import { getRequestContext } from '@/context/request-context';
import { rateLimit } from '@/redis';
import {
  CHALLENGE,
  CREDENTIAL_ID,
  DEVICE,
  EMPLOYEE_ACTIVE,
  EMPLOYEE_ID,
  EMPLOYEE_NAME,
  EVENT_AT,
  KIOSK_ID,
  ORG_A,
  VERIFY_INPUT,
  auditRecord,
  defaultMocks,
  employeeFindById,
  punchKiosk,
  service,
  webAuthnAuthOptions,
  webAuthnVerifyAuthentication,
} from './kiosk-webauthn.spec-harness';
import {
  KioskEmployeeInactiveException,
  KioskEmployeeNotFoundException,
  WebAuthnChallengeInvalidException,
  WebAuthnCredentialNotFoundException,
  WebAuthnVerificationFailedException,
} from './kiosk.exception';

jest.mock('@/logger', () => ({
  logger: { child: jest.fn(() => ({ info: jest.fn() })) },
  childLogger: jest.fn(() => ({ info: jest.fn() })),
  generateRequestId: jest.fn(() => 'test-request-id'),
}));

jest.mock('@/redis', () => ({
  redisClient: { set: jest.fn(), get: jest.fn(), del: jest.fn() },
  rateLimit: jest.fn(),
}));

describe('KioskWebAuthnService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    defaultMocks();
  });

  describe('createAuthOptions', () => {
    it('issues an authentication challenge scoped to the connected kiosk organization', async () => {
      const result = await service.createAuthOptions(DEVICE);

      expect(webAuthnAuthOptions).toHaveBeenCalledWith({
        organizationId: ORG_A,
      });
      expect(result).toEqual({
        challengeId: CHALLENGE,
        options: expect.any(Object),
      });
    });
  });

  describe('verifyAuthAndPunch', () => {
    it('verifies the fingerprint, resolves the employee and records the attendance event', async () => {
      const result = await service.verifyAuthAndPunch(DEVICE, VERIFY_INPUT);

      expect(webAuthnVerifyAuthentication).toHaveBeenCalledWith({
        organizationId: ORG_A,
        challenge: CHALLENGE,
        response: VERIFY_INPUT.response,
      });
      expect(employeeFindById).toHaveBeenCalledWith(EMPLOYEE_ID);
      expect(punchKiosk).toHaveBeenCalledWith(EMPLOYEE_ID, 'CLOCK_IN');
      expect(result).toEqual({
        employeeId: EMPLOYEE_ID,
        employeeName: EMPLOYEE_NAME,
        credentialId: CREDENTIAL_ID,
        eventType: 'CLOCK_IN',
        eventAt: EVENT_AT.toISOString(),
      });
      expect(auditRecord).not.toHaveBeenCalled();
    });

    it.each(['CLOCK_IN', 'CLOCK_OUT', 'BREAK_START', 'BREAK_END'] as const)(
      'records a %s attendance event after a verified fingerprint',
      async (eventType) => {
        const input = {
          ...VERIFY_INPUT,
          eventType,
        };

        const result = await service.verifyAuthAndPunch(DEVICE, input);

        expect(punchKiosk).toHaveBeenCalledWith(EMPLOYEE_ID, eventType);
        expect(result.eventType).toBe(eventType);
        expect(result.eventAt).toBe(EVENT_AT.toISOString());
      },
    );

    it('resolves the employee and punches inside the kiosk organization tenant', async () => {
      const organizationsSeen: Array<string | undefined> = [];
      employeeFindById.mockImplementation(async () => {
        organizationsSeen.push(getRequestContext()?.organizationId);
        return EMPLOYEE_ACTIVE;
      });
      punchKiosk.mockImplementation(async () => {
        organizationsSeen.push(getRequestContext()?.organizationId);
        return { eventType: 'CLOCK_IN' as const, eventAt: EVENT_AT };
      });

      await service.verifyAuthAndPunch(DEVICE, VERIFY_INPUT);

      expect(organizationsSeen).toEqual([ORG_A, ORG_A]);
    });

    it('rejects when the kiosk exceeds the punch attempt limit', async () => {
      (rateLimit as unknown as jest.Mock).mockResolvedValue(false);

      const pending = service.verifyAuthAndPunch(DEVICE, VERIFY_INPUT);

      await expect(pending).rejects.toBeInstanceOf(HttpException);
      await expect(pending).rejects.toThrow('Too many attempts');
      expect(webAuthnVerifyAuthentication).not.toHaveBeenCalled();
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          entityId: KIOSK_ID,
          action: 'kiosk.attendance.webauthn_rate_limited',
          entityType: 'kiosk',
          after: { reason: 'attempt_limit' },
        }),
      );
    });

    it('rejects an expired or mismatched challenge and audits the failure', async () => {
      webAuthnVerifyAuthentication.mockRejectedValue(
        new WebAuthnChallengeInvalidException(),
      );

      await expect(
        service.verifyAuthAndPunch(DEVICE, VERIFY_INPUT),
      ).rejects.toThrow(WebAuthnChallengeInvalidException);
      expect(employeeFindById).not.toHaveBeenCalled();
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'kiosk.attendance.webauthn_auth_failed',
          after: { reason: 'challenge_invalid' },
        }),
      );
    });

    it('rejects a revoked or unknown credential and audits the failure', async () => {
      webAuthnVerifyAuthentication.mockRejectedValue(
        new WebAuthnCredentialNotFoundException(),
      );

      await expect(
        service.verifyAuthAndPunch(DEVICE, VERIFY_INPUT),
      ).rejects.toThrow(WebAuthnCredentialNotFoundException);
      expect(employeeFindById).not.toHaveBeenCalled();
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'kiosk.attendance.webauthn_auth_failed',
          after: { reason: 'credential_not_found' },
        }),
      );
    });

    it('rejects an invalid signature and audits the failure without storing fingerprint material', async () => {
      webAuthnVerifyAuthentication.mockRejectedValue(
        new WebAuthnVerificationFailedException(),
      );

      await expect(
        service.verifyAuthAndPunch(DEVICE, VERIFY_INPUT),
      ).rejects.toThrow(WebAuthnVerificationFailedException);
      expect(employeeFindById).not.toHaveBeenCalled();
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'kiosk.attendance.webauthn_auth_failed',
          after: { reason: 'verification_failed' },
        }),
      );
      expect(JSON.stringify(auditRecord.mock.calls)).not.toContain('signature');
      expect(JSON.stringify(auditRecord.mock.calls)).not.toContain('rawId');
      expect(JSON.stringify(auditRecord.mock.calls)).not.toContain(
        'clientDataJSON',
      );
      expect(JSON.stringify(auditRecord.mock.calls)).not.toContain(CHALLENGE);
    });

    it('rejects an authenticated employee that does not exist in the organization', async () => {
      employeeFindById.mockResolvedValue(undefined);

      await expect(
        service.verifyAuthAndPunch(DEVICE, VERIFY_INPUT),
      ).rejects.toThrow(KioskEmployeeNotFoundException);
      expect(punchKiosk).not.toHaveBeenCalled();
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'kiosk.attendance.employee_not_found',
          after: expect.objectContaining({
            reason: 'employee_not_found',
            employeeId: EMPLOYEE_ID,
          }),
        }),
      );
    });

    it.each(['inactive', 'terminated'] as const)(
      'rejects an employee with status %s without recording attendance',
      async (status) => {
        employeeFindById.mockResolvedValue({
          ...EMPLOYEE_ACTIVE,
          status,
        });

        await expect(
          service.verifyAuthAndPunch(DEVICE, VERIFY_INPUT),
        ).rejects.toThrow(KioskEmployeeInactiveException);
        expect(punchKiosk).not.toHaveBeenCalled();
        expect(auditRecord).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'kiosk.attendance.employee_inactive',
            after: expect.objectContaining({ employeeId: EMPLOYEE_ID }),
          }),
        );
      },
    );

    it('rejects an archived employee without recording attendance', async () => {
      employeeFindById.mockResolvedValue({
        ...EMPLOYEE_ACTIVE,
        archivedAt: new Date('2026-08-01T08:00:00Z'),
      });

      await expect(
        service.verifyAuthAndPunch(DEVICE, VERIFY_INPUT),
      ).rejects.toThrow(KioskEmployeeInactiveException);
      expect(punchKiosk).not.toHaveBeenCalled();
    });

    it('surfaces unexpected verification errors as a generic HTTP failure', async () => {
      webAuthnVerifyAuthentication.mockRejectedValue(
        new Error('internal signature detail'),
      );

      const pending = service.verifyAuthAndPunch(DEVICE, VERIFY_INPUT);

      await expect(pending).rejects.toThrow('internal signature detail');
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          after: { reason: 'verification_failed' },
        }),
      );
    });
  });
});
