import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { redisClient } from '@/redis';
import { WEB_AUTHN_CHALLENGE_TTL_SECONDS } from '@rona/config/webauthn';
import {
  CHALLENGE,
  CREDENTIAL_ID,
  CREDENTIAL_ROW_ID,
  EMPLOYEE_ID,
  EMPLOYEE_NAME,
  ORG_A,
  ORG_B,
  PUBLIC_KEY_B64,
  PUBLIC_KEY_BYTES,
  REGISTRATION_CHALLENGE,
  AUTHENTICATION_CHALLENGE,
  REGISTRATION_RESPONSE,
  AUTHENTICATION_RESPONSE,
  auditRecord,
  challengeIssued,
  defaultMocks,
  repoFindActiveByCredentialId,
  repoInsert,
  repoListActiveCredentialIds,
  repoUpdateCounter,
  service,
  mockTx,
  setupTransactionMock,
} from './webauthn.spec-harness';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import {
  WebAuthnChallengeInvalidException,
  WebAuthnCredentialAlreadyExistsException,
  WebAuthnCredentialNotFoundException,
  WebAuthnVerificationFailedException,
} from './kiosk.exception';

jest.mock('@/logger', () => ({
  logger: { child: jest.fn(() => ({ info: jest.fn() })) },
  childLogger: jest.fn(() => ({ info: jest.fn() })),
  generateRequestId: jest.fn(() => 'test-request-id'),
}));

jest.mock('@/db', () => ({
  db: {},
  pooledDb: { transaction: jest.fn() },
}));

jest.mock('@/redis', () => ({
  redisClient: { set: jest.fn(), get: jest.fn(), del: jest.fn() },
  rateLimit: jest.fn(),
}));

jest.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: jest.fn(),
  verifyRegistrationResponse: jest.fn(),
  generateAuthenticationOptions: jest.fn(),
  verifyAuthenticationResponse: jest.fn(),
}));

const registrationResponse =
  REGISTRATION_RESPONSE as unknown as RegistrationResponseJSON;
const authenticationResponse =
  AUTHENTICATION_RESPONSE as unknown as AuthenticationResponseJSON;

describe('WebAuthnService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setupTransactionMock();
    defaultMocks();
  });

  describe('createRegistrationChallenge', () => {
    it('excludes existing credentials and binds the challenge to the employee', async () => {
      repoListActiveCredentialIds.mockResolvedValue([
        { credentialId: 'existing-1' },
      ]);
      const result = await service.createRegistrationChallenge({
        organizationId: ORG_A,
        employeeId: EMPLOYEE_ID,
      });

      expect(repoListActiveCredentialIds).toHaveBeenCalledWith(
        ORG_A,
        EMPLOYEE_ID,
      );
      expect(generateRegistrationOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          rpID: 'localhost',
          rpName: 'Rona',
          excludeCredentials: [{ id: 'existing-1' }],
        }),
      );
      const registrationOptions = (
        generateRegistrationOptions as unknown as jest.Mock
      ).mock.calls.at(-1)[0];
      expect(registrationOptions.authenticatorSelection).toEqual({
        residentKey: 'required',
        userVerification: 'required',
      });
      expect(redisClient.set).toHaveBeenCalledWith(
        `kiosk:webauthn:challenge:${CHALLENGE}`,
        {
          purpose: 'registration',
          organizationId: ORG_A,
          employeeId: EMPLOYEE_ID,
        },
        { ex: WEB_AUTHN_CHALLENGE_TTL_SECONDS },
      );
      expect(result).toEqual({
        challengeId: CHALLENGE,
        options: expect.any(Object),
      });
    });

    it('uses the employee id as the authenticator username unless a display name is provided', async () => {
      await service.createRegistrationChallenge({
        organizationId: ORG_A,
        employeeId: EMPLOYEE_ID,
      });
      let options = (
        generateRegistrationOptions as unknown as jest.Mock
      ).mock.calls.at(-1)[0];
      expect(options.userName).toBe(EMPLOYEE_ID);

      await service.createRegistrationChallenge({
        organizationId: ORG_A,
        employeeId: EMPLOYEE_ID,
        employeeName: EMPLOYEE_NAME,
      });
      options = (
        generateRegistrationOptions as unknown as jest.Mock
      ).mock.calls.at(-1)[0];
      expect(options.userName).toBe(EMPLOYEE_NAME);
    });
  });

  describe('verifyRegistration', () => {
    it('persists only non-biometric fields and audits metadata in the transaction', async () => {
      challengeIssued(REGISTRATION_CHALLENGE);

      const result = await service.verifyRegistration({
        organizationId: ORG_A,
        employeeId: EMPLOYEE_ID,
        challenge: CHALLENGE,
        response: registrationResponse,
      });

      expect(repoInsert).toHaveBeenCalledWith(
        {
          organizationId: ORG_A,
          employeeId: EMPLOYEE_ID,
          credentialId: CREDENTIAL_ID,
          publicKey: PUBLIC_KEY_B64,
          counter: 1,
          deviceType: 'singleDevice',
        },
        mockTx,
      );
      expect(auditRecord).toHaveBeenCalledWith(
        {
          organizationId: ORG_A,
          action: 'kiosk.webauthn.register',
          entityType: 'employee_webauthn_credential',
          entityId: CREDENTIAL_ROW_ID,
          after: { employeeId: EMPLOYEE_ID },
        },
        mockTx,
      );
      expect(result).toEqual({
        credentialId: CREDENTIAL_ID,
        deviceType: 'singleDevice',
        counter: 1,
        employeeId: EMPLOYEE_ID,
      });
    });

    it('never leaks credential material into the audit log', async () => {
      challengeIssued(REGISTRATION_CHALLENGE);
      await service.verifyRegistration({
        organizationId: ORG_A,
        employeeId: EMPLOYEE_ID,
        challenge: CHALLENGE,
        response: registrationResponse,
      });
      expect(JSON.stringify(auditRecord.mock.calls)).not.toContain(
        PUBLIC_KEY_B64,
      );
      expect(JSON.stringify(auditRecord.mock.calls)).not.toContain('publicKey');
      expect(JSON.stringify(auditRecord.mock.calls)).not.toContain(
        'attestationObject',
      );
    });

    it('rejects an expired or unknown challenge', async () => {
      (redisClient.get as unknown as jest.Mock).mockResolvedValue(null);
      await expect(
        service.verifyRegistration({
          organizationId: ORG_A,
          employeeId: EMPLOYEE_ID,
          challenge: CHALLENGE,
          response: registrationResponse,
        }),
      ).rejects.toThrow(WebAuthnChallengeInvalidException);
      expect(repoInsert).not.toHaveBeenCalled();
    });

    it('rejects a challenge issued for another organization', async () => {
      challengeIssued({ ...REGISTRATION_CHALLENGE, organizationId: ORG_B });
      await expect(
        service.verifyRegistration({
          organizationId: ORG_A,
          employeeId: EMPLOYEE_ID,
          challenge: CHALLENGE,
          response: registrationResponse,
        }),
      ).rejects.toThrow(WebAuthnChallengeInvalidException);
      expect(repoInsert).not.toHaveBeenCalled();
    });

    it('rejects a challenge issued for another employee', async () => {
      challengeIssued({
        ...REGISTRATION_CHALLENGE,
        employeeId: 'other-employee',
      });
      await expect(
        service.verifyRegistration({
          organizationId: ORG_A,
          employeeId: EMPLOYEE_ID,
          challenge: CHALLENGE,
          response: registrationResponse,
        }),
      ).rejects.toThrow(WebAuthnChallengeInvalidException);
      expect(repoInsert).not.toHaveBeenCalled();
    });

    it('consumes the challenge so a replayed response is rejected', async () => {
      const calls = [REGISTRATION_CHALLENGE, null];
      (redisClient.get as unknown as jest.Mock).mockImplementation(() =>
        Promise.resolve(calls.shift() ?? null),
      );
      (redisClient.del as unknown as jest.Mock).mockResolvedValue(1);

      await service.verifyRegistration({
        organizationId: ORG_A,
        employeeId: EMPLOYEE_ID,
        challenge: CHALLENGE,
        response: registrationResponse,
      });
      await expect(
        service.verifyRegistration({
          organizationId: ORG_A,
          employeeId: EMPLOYEE_ID,
          challenge: CHALLENGE,
          response: registrationResponse,
        }),
      ).rejects.toThrow(WebAuthnChallengeInvalidException);
      expect(repoInsert).toHaveBeenCalledTimes(1);
      expect(verifyRegistrationResponse).toHaveBeenCalledTimes(1);
    });

    it('rejects a response the library reports as unverified', async () => {
      challengeIssued(REGISTRATION_CHALLENGE);
      (verifyRegistrationResponse as unknown as jest.Mock).mockResolvedValue({
        verified: false,
      });
      await expect(
        service.verifyRegistration({
          organizationId: ORG_A,
          employeeId: EMPLOYEE_ID,
          challenge: CHALLENGE,
          response: registrationResponse,
        }),
      ).rejects.toThrow(WebAuthnVerificationFailedException);
      expect(repoInsert).not.toHaveBeenCalled();
    });

    it('surfaces a generic error without leaking library internals', async () => {
      challengeIssued(REGISTRATION_CHALLENGE);
      (verifyRegistrationResponse as unknown as jest.Mock).mockRejectedValue(
        new Error('Secret attestation detail'),
      );
      const pending = service.verifyRegistration({
        organizationId: ORG_A,
        employeeId: EMPLOYEE_ID,
        challenge: CHALLENGE,
        response: registrationResponse,
      });
      await expect(pending).rejects.toThrow(
        WebAuthnVerificationFailedException,
      );
      await expect(pending).rejects.not.toThrow('Secret attestation detail');
      expect(repoInsert).not.toHaveBeenCalled();
    });

    it('rejects a duplicate credential id as a conflict before auditing', async () => {
      challengeIssued(REGISTRATION_CHALLENGE);
      repoInsert.mockRejectedValue({ code: '23505' });
      await expect(
        service.verifyRegistration({
          organizationId: ORG_A,
          employeeId: EMPLOYEE_ID,
          challenge: CHALLENGE,
          response: registrationResponse,
        }),
      ).rejects.toThrow(WebAuthnCredentialAlreadyExistsException);
      expect(auditRecord).not.toHaveBeenCalled();
    });
  });

  describe('createAuthenticationChallenge', () => {
    it('returns options and stores a single-use challenge scoped to the organization', async () => {
      const result = await service.createAuthenticationChallenge({
        organizationId: ORG_A,
      });
      expect(generateAuthenticationOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          rpID: 'localhost',
          allowCredentials: [],
          userVerification: 'required',
        }),
      );
      expect(redisClient.set).toHaveBeenCalledWith(
        `kiosk:webauthn:challenge:${CHALLENGE}`,
        AUTHENTICATION_CHALLENGE,
        { ex: WEB_AUTHN_CHALLENGE_TTL_SECONDS },
      );
      expect(result).toEqual({
        challengeId: CHALLENGE,
        options: expect.any(Object),
      });
    });
  });

  describe('verifyAuthentication', () => {
    it('verifies with the stored public key and advances the signature counter', async () => {
      challengeIssued(AUTHENTICATION_CHALLENGE);

      const result = await service.verifyAuthentication({
        organizationId: ORG_A,
        challenge: CHALLENGE,
        response: authenticationResponse,
      });

      expect(repoFindActiveByCredentialId).toHaveBeenCalledWith(
        ORG_A,
        CREDENTIAL_ID,
      );
      expect(verifyAuthenticationResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          expectedOrigin: expect.arrayContaining(['http://localhost:3000']),
          expectedRPID: 'localhost',
          credential: {
            id: CREDENTIAL_ID,
            publicKey: expect.any(Uint8Array),
            counter: 1,
          },
        }),
      );
      const credentialArg = (
        verifyAuthenticationResponse as unknown as jest.Mock
      ).mock.calls.at(-1)[0].credential;
      expect(Array.from(credentialArg.publicKey as Uint8Array)).toEqual(
        Array.from(PUBLIC_KEY_BYTES),
      );
      expect(repoUpdateCounter).toHaveBeenCalledWith(ORG_A, CREDENTIAL_ID, 2);
      expect(result).toEqual({
        employeeId: EMPLOYEE_ID,
        credentialId: CREDENTIAL_ID,
        newCounter: 2,
      });
    });

    it('rejects an expired or unknown challenge', async () => {
      (redisClient.get as unknown as jest.Mock).mockResolvedValue(null);
      await expect(
        service.verifyAuthentication({
          organizationId: ORG_A,
          challenge: CHALLENGE,
          response: authenticationResponse,
        }),
      ).rejects.toThrow(WebAuthnChallengeInvalidException);
      expect(repoFindActiveByCredentialId).not.toHaveBeenCalled();
    });

    it('rejects a challenge issued for another organization', async () => {
      challengeIssued({ ...AUTHENTICATION_CHALLENGE, organizationId: ORG_B });
      await expect(
        service.verifyAuthentication({
          organizationId: ORG_A,
          challenge: CHALLENGE,
          response: authenticationResponse,
        }),
      ).rejects.toThrow(WebAuthnChallengeInvalidException);
      expect(repoFindActiveByCredentialId).not.toHaveBeenCalled();
    });

    it('cannot authenticate an unknown or revoked credential', async () => {
      challengeIssued(AUTHENTICATION_CHALLENGE);
      repoFindActiveByCredentialId.mockResolvedValue(undefined);
      await expect(
        service.verifyAuthentication({
          organizationId: ORG_A,
          challenge: CHALLENGE,
          response: authenticationResponse,
        }),
      ).rejects.toThrow(WebAuthnCredentialNotFoundException);
      expect(verifyAuthenticationResponse).not.toHaveBeenCalled();
    });

    it('rejects a response the library reports as unverified without updating the counter', async () => {
      challengeIssued(AUTHENTICATION_CHALLENGE);
      (verifyAuthenticationResponse as unknown as jest.Mock).mockResolvedValue({
        verified: false,
      });
      await expect(
        service.verifyAuthentication({
          organizationId: ORG_A,
          challenge: CHALLENGE,
          response: authenticationResponse,
        }),
      ).rejects.toThrow(WebAuthnVerificationFailedException);
      expect(repoUpdateCounter).not.toHaveBeenCalled();
    });

    it('rejects when the authenticator did not perform local user verification', async () => {
      challengeIssued(AUTHENTICATION_CHALLENGE);
      (verifyAuthenticationResponse as unknown as jest.Mock).mockResolvedValue({
        verified: true,
        authenticationInfo: {
          credentialID: CREDENTIAL_ID,
          newCounter: 2,
          userVerified: false,
          deviceType: 'singleDevice',
          backedUp: false,
          origin: 'http://localhost:3000',
          rpID: 'localhost',
        },
      });
      await expect(
        service.verifyAuthentication({
          organizationId: ORG_A,
          challenge: CHALLENGE,
          response: authenticationResponse,
        }),
      ).rejects.toThrow(WebAuthnVerificationFailedException);
      expect(repoUpdateCounter).not.toHaveBeenCalled();
    });

    it('surfaces a generic error when the library throws', async () => {
      challengeIssued(AUTHENTICATION_CHALLENGE);
      (verifyAuthenticationResponse as unknown as jest.Mock).mockRejectedValue(
        new Error('Bad signature internals'),
      );
      await expect(
        service.verifyAuthentication({
          organizationId: ORG_A,
          challenge: CHALLENGE,
          response: authenticationResponse,
        }),
      ).rejects.toThrow(WebAuthnVerificationFailedException);
      expect(repoUpdateCounter).not.toHaveBeenCalled();
    });

    it('never writes credential material to the audit log', async () => {
      challengeIssued(AUTHENTICATION_CHALLENGE);
      await service.verifyAuthentication({
        organizationId: ORG_A,
        challenge: CHALLENGE,
        response: authenticationResponse,
      });
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'kiosk.webauthn.authenticate',
          entityType: 'employee_webauthn_credential',
          entityId: CREDENTIAL_ROW_ID,
          after: { employeeId: EMPLOYEE_ID },
        }),
      );
      expect(JSON.stringify(auditRecord.mock.calls)).not.toContain(
        PUBLIC_KEY_B64,
      );
    });
  });
});
