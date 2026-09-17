import {
  ACTOR_A,
  CHALLENGE_ID,
  CREDENTIAL_ID,
  CREDENTIAL_ROW_ID,
  EMPLOYEE_ID,
  GRANT_TOKEN,
  KIOSK_ID,
  ORG_A,
  SESSION_HASH,
  TOKEN_VERSION,
  authenticationChallengeRow,
  authenticationResponse,
  auditRecord,
  credentialRepository,
  credentialRow,
  deviceContext,
  employeeRow,
  generateAuthenticationOptions,
  generateRegistrationOptions,
  punchKiosk,
  registrationChallengeRow,
  registrationResponse,
  runInOrganizationA,
  service,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from './webauthn.spec-harness';
import { unauthorized } from './webauthn.spec-harness';

jest.mock('@/logger', () => ({
  logger: { child: jest.fn(() => ({ info: jest.fn() })) },
  childLogger: jest.fn(() => ({ info: jest.fn() })),
  generateRequestId: jest.fn(() => 'test-request-id'),
}));

jest.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: (...args: unknown[]) =>
    generateRegistrationOptions(...args),
  generateAuthenticationOptions: (...args: unknown[]) =>
    generateAuthenticationOptions(...args),
  verifyRegistrationResponse: (...args: unknown[]) =>
    verifyRegistrationResponse(...args),
  verifyAuthenticationResponse: (...args: unknown[]) =>
    verifyAuthenticationResponse(...args),
}));

jest.mock('@/redis', () => ({
  rateLimit: jest.fn(async () => true),
}));

process.env.WEBAUTHN_RP_ID = 'erp.example.com';
process.env.WEBAUTHN_RP_NAME = 'Rona ERP';
process.env.WEBAUTHN_ORIGIN = 'https://erp.example.com';

describe('WebAuthnService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    credentialRepository.transaction.mockImplementation(
      async (callback: (tx: unknown) => Promise<unknown>) =>
        callback({ sentinel: 'tx' }),
    );
    credentialRepository.activeOrganization.mockResolvedValue(undefined);
    credentialRepository.activeDevice.mockResolvedValue(undefined);
    credentialRepository.employee.mockResolvedValue(employeeRow);
    credentialRepository.list.mockResolvedValue([credentialRow]);
    credentialRepository.find.mockResolvedValue(credentialRow);
    credentialRepository.lockCredential.mockResolvedValue(credentialRow);
    credentialRepository.advanceCounter.mockResolvedValue(undefined);
    credentialRepository.create.mockResolvedValue(credentialRow);
    credentialRepository.revoke.mockResolvedValue(credentialRow);
    credentialRepository.createChallenge.mockResolvedValue(CHALLENGE_ID);
    credentialRepository.consumeChallenge.mockResolvedValue(
      authenticationChallengeRow,
    );
    credentialRepository.createGrant.mockResolvedValue(undefined);
    credentialRepository.consumeGrant.mockResolvedValue({
      employeeId: EMPLOYEE_ID,
      credentialId: CREDENTIAL_ROW_ID,
    });
    generateRegistrationOptions.mockResolvedValue({
      challenge: 'reg-challenge',
      rpID: 'erp.example.com',
    });
    generateAuthenticationOptions.mockResolvedValue({
      challenge: 'auth-challenge',
      rpID: 'erp.example.com',
    });
    verifyRegistrationResponse.mockResolvedValue({
      verified: true,
      registrationInfo: {
        userVerified: true,
        credential: {
          id: CREDENTIAL_ID,
          publicKey: new Uint8Array([1, 2, 3]),
          counter: 0,
          transports: ['hybrid'],
        },
        credentialDeviceType: 'multiDevice',
        credentialBackedUp: true,
      },
    });
    verifyAuthenticationResponse.mockResolvedValue({
      verified: true,
      authenticationInfo: {
        credentialID: CREDENTIAL_ID,
        newCounter: 6,
        userVerified: true,
        credentialDeviceType: 'multiDevice',
        credentialBackedUp: true,
      },
    });
    punchKiosk.mockResolvedValue({
      eventType: 'CLOCK_IN',
      eventAt: new Date('2026-09-17T08:00:00.000Z'),
    });
    auditRecord.mockResolvedValue(undefined);
  });

  describe('authenticationOptions', () => {
    it('binds the challenge to kiosk and session and requests hybrid hints', async () => {
      const result = await service.authenticationOptions(deviceContext);

      expect(credentialRepository.consumeChallenge).not.toHaveBeenCalled();
      expect(credentialRepository.createChallenge).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          purpose: 'authentication',
          kioskId: KIOSK_ID,
          sessionHash: SESSION_HASH,
        }),
        { sentinel: 'tx' },
      );
      const bound = credentialRepository.createChallenge.mock.calls[0][0] as Record<string, unknown>;
      expect(bound.actorId).toBeUndefined();
      expect(bound.employeeId).toBeUndefined();
      expect(generateAuthenticationOptions).toHaveBeenCalledWith(
        expect.objectContaining({ userVerification: 'required' }),
      );
      expect(result.options.hints).toEqual(['hybrid']);
    });

    it('restricts allowCredentials to the eid employee when provided', async () => {
      credentialRepository.employeeByEid.mockResolvedValue(employeeRow);

      await service.authenticationOptions(deviceContext, '10001');

      expect(credentialRepository.employeeByEid).toHaveBeenCalledWith(
        ORG_A,
        '10001',
        expect.objectContaining({ sentinel: 'tx' }),
      );
      expect(generateAuthenticationOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          allowCredentials: [
            { id: CREDENTIAL_ID, transports: ['hybrid'] },
          ],
        }),
      );
    });

    it('rejects an eid employee with no active credentials', async () => {
      credentialRepository.employeeByEid.mockResolvedValue(employeeRow);
      credentialRepository.list.mockResolvedValue([]);

      await expect(
        service.authenticationOptions(deviceContext, '10001'),
      ).rejects.toMatchObject({ status: 401 });
    });
  });

  describe('authenticationVerify', () => {
    it('returns employee grant bound to kiosk session and audits it', async () => {
      const result = await service.authenticationVerify(
        deviceContext,
        CHALLENGE_ID,
        authenticationResponse,
      );

      expect(credentialRepository.consumeChallenge).toHaveBeenCalledWith(
        CHALLENGE_ID,
        expect.objectContaining({
          purpose: 'authentication',
          kioskId: KIOSK_ID,
          sessionHash: SESSION_HASH,
        }),
      );
      expect(credentialRepository.createGrant).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          kioskId: KIOSK_ID,
          sessionHash: SESSION_HASH,
          employeeId: EMPLOYEE_ID,
        }),
        { sentinel: 'tx' },
      );
      expect(verifyAuthenticationResponse).toHaveBeenCalledWith(
        expect.objectContaining({ requireUserVerification: true }),
      );
      expect(result).toEqual({
        employeeName: 'Dawit Haile',
        expiresAt: expect.any(String),
        grantToken: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),
      });
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'kiosk.webauthn.authenticate' }),
        { sentinel: 'tx' },
      );
    });

    it('rejects a credential from another employee when eid bound', async () => {
      credentialRepository.consumeChallenge.mockResolvedValue({
        ...authenticationChallengeRow,
        employeeId: '99999999-9999-4999-8999-999999999999',
      });

      await expect(
        service.authenticationVerify(
          deviceContext,
          CHALLENGE_ID,
          authenticationResponse,
        ),
      ).rejects.toMatchObject({ status: 401 });
      expect(credentialRepository.createGrant).not.toHaveBeenCalled();
    });

    it('rejects userHandle mismatch (credential lookup by id)', async () => {
      credentialRepository.find.mockResolvedValue({
        ...credentialRow,
        userHandle: 'b3RoZXItaGFuZGxl',
      });

      await expect(
        service.authenticationVerify(
          deviceContext,
          CHALLENGE_ID,
          authenticationResponse,
        ),
      ).rejects.toMatchObject({ status: 401 });
    });

    it('rejects UV=false assertions', async () => {
      verifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: {
          credentialID: CREDENTIAL_ID,
          newCounter: 6,
          userVerified: false,
          credentialDeviceType: 'multiDevice',
          credentialBackedUp: true,
        },
      });

      await expect(
        service.authenticationVerify(
          deviceContext,
          CHALLENGE_ID,
          authenticationResponse,
        ),
      ).rejects.toMatchObject({ status: 401 });
    });

    it('rejects counter reuse / clone detection', async () => {
      credentialRepository.advanceCounter.mockImplementation(() => {
        throw new Error('counter must advance');
      });

      await expect(
        service.authenticationVerify(
          deviceContext,
          CHALLENGE_ID,
          authenticationResponse,
        ),
      ).rejects.toMatchObject({ status: 401 });
    });

    it('rejects a discoverable assertion without userHandle', async () => {
      const response = {
        ...authenticationResponse,
        response: { ...authenticationResponse.response, userHandle: null },
      };

      await expect(
        service.authenticationVerify(deviceContext, CHALLENGE_ID, response),
      ).rejects.toMatchObject({ status: 401 });
      expect(verifyAuthenticationResponse).not.toHaveBeenCalled();
      expect(credentialRepository.createGrant).not.toHaveBeenCalled();
    });

    it('normalizes a null userHandle to undefined for the verifier in eid-bound flow', async () => {
      credentialRepository.consumeChallenge.mockResolvedValue({
        ...authenticationChallengeRow,
        employeeId: EMPLOYEE_ID,
      });
      const response = {
        ...authenticationResponse,
        response: { ...authenticationResponse.response, userHandle: null },
      };

      await service.authenticationVerify(deviceContext, CHALLENGE_ID, response);

      const verifierArg = verifyAuthenticationResponse.mock.calls[0][0] as {
        response: { response: { userHandle?: string } };
      };
      expect(verifierArg.response.response.userHandle).toBeUndefined();
      expect(credentialRepository.createGrant).toHaveBeenCalled();
    });
  });

  describe('punch (attendance integration)', () => {
    it('consumes the grant, rechecks device/employee, and reuses AttendanceService.punchKiosk', async () => {
      const result = await service.punch(deviceContext, { eventType: 'CLOCK_IN' }, GRANT_TOKEN);

      expect(credentialRepository.consumeGrant).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ kioskId: KIOSK_ID, sessionHash: SESSION_HASH }),
      );
      expect(credentialRepository.activeDevice).toHaveBeenCalledWith(
        deviceContext,
        { sentinel: 'tx' },
      );
      expect(credentialRepository.employee).toHaveBeenCalledWith(
        ORG_A,
        EMPLOYEE_ID,
        expect.objectContaining({ sentinel: 'tx' }),
      );
      expect(punchKiosk).toHaveBeenCalledWith(
        EMPLOYEE_ID,
        'CLOCK_IN',
        { sentinel: 'tx' },
      );
      expect(result).toEqual({
        employeeName: 'Dawit Haile',
        eventType: 'CLOCK_IN',
        eventAt: '2026-09-17T08:00:00.000Z',
      });
    });

    it('rejects a missing or malformed grant token', async () => {
      await expect(
        service.punch(deviceContext, { eventType: 'CLOCK_IN' }, undefined),
      ).rejects.toMatchObject({ status: 401 });
      await expect(
        service.punch(deviceContext, { eventType: 'CLOCK_IN' }, 'short'),
      ).rejects.toMatchObject({ status: 401 });
      expect(credentialRepository.consumeGrant).not.toHaveBeenCalled();
    });

    it('rejects a grant replayed from another kiosk/session', async () => {
      credentialRepository.consumeGrant.mockImplementation(() => {
        throw Object.assign(new Error(), { status: 401 });
      });

      await expect(
        service.punch(deviceContext, { eventType: 'CLOCK_IN' }, GRANT_TOKEN),
      ).rejects.toMatchObject({ status: 401 });
      expect(punchKiosk).not.toHaveBeenCalled();
    });

    it('rejects an employee archived after authentication (recheck)', async () => {
      credentialRepository.employee.mockImplementation(() => {
        throw Object.assign(new Error(), { status: 401 });
      });

      await expect(
        service.punch(deviceContext, { eventType: 'CLOCK_IN' }, GRANT_TOKEN),
      ).rejects.toMatchObject({ status: 401 });
      expect(punchKiosk).not.toHaveBeenCalled();
    });
  });

  describe('enrollment (HR guarded)', () => {
    it('stores deviceName from the bound challenge and requires UV on registration', async () => {
      credentialRepository.consumeChallenge.mockResolvedValue(
        registrationChallengeRow,
      );

      const row = await runInOrganizationA(() =>
        service.registrationVerify(EMPLOYEE_ID, CHALLENGE_ID, registrationResponse),
      );

      expect(verifyRegistrationResponse).toHaveBeenCalledWith(
        expect.objectContaining({ requireUserVerification: true }),
      );
      expect(credentialRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          employeeId: EMPLOYEE_ID,
          deviceName: 'Pixel 9',
        }),
        { sentinel: 'tx' },
      );
      expect(row.deviceName).toBe('Pixel 9');
    });

    it('rejects a registration challenge consumed by another actor', async () => {
      credentialRepository.consumeChallenge.mockImplementation(() => {
        throw Object.assign(new Error(), { status: 401 });
      });

      await expect(
        runInOrganizationA(() =>
          service.registrationVerify(EMPLOYEE_ID, CHALLENGE_ID, registrationResponse),
        ),
      ).rejects.toMatchObject({ status: 401 });
      expect(credentialRepository.create).not.toHaveBeenCalled();
    });

    it('rejects registration without UV', async () => {
      credentialRepository.consumeChallenge.mockResolvedValue(
        registrationChallengeRow,
      );
      verifyRegistrationResponse.mockResolvedValue({
        verified: true,
        registrationInfo: {
          userVerified: false,
          credential: {
            id: CREDENTIAL_ID,
            publicKey: new Uint8Array([1]),
            counter: 0,
          },
        },
        credentialDeviceType: 'singleDevice',
        credentialBackedUp: false,
      });

      await expect(
        runInOrganizationA(() =>
          service.registrationVerify(EMPLOYEE_ID, CHALLENGE_ID, registrationResponse),
        ),
      ).rejects.toMatchObject({ status: 401 });
      expect(credentialRepository.create).not.toHaveBeenCalled();
    });

    it('lists public metadata only and revokes', async () => {
      const rows = await runInOrganizationA(() => service.list(EMPLOYEE_ID));

      expect(rows).toEqual([
        {
          id: CREDENTIAL_ROW_ID,
          deviceName: 'Pixel 9',
          createdAt: credentialRow.createdAt,
          lastUsedAt: null,
          revokedAt: null,
          deviceType: 'multiDevice',
        },
      ]);

      const revoked = await runInOrganizationA(() =>
        service.revoke(EMPLOYEE_ID, CREDENTIAL_ROW_ID),
      );
      expect(credentialRepository.revoke).toHaveBeenCalledWith(
        ORG_A,
        EMPLOYEE_ID,
        CREDENTIAL_ROW_ID,
        { sentinel: 'tx' },
      );
      expect(revoked.revokedAt).not.toBeUndefined();
    });
  });
});
