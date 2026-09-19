import { pooledDb } from '@/db';
import { redisClient } from '@/redis';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import type { AuditService } from '@/modules/audit/audit.service';
import { WebAuthnChallengeStore } from './webauthn-challenge.store';
import type { WebAuthnCredentialRepository } from './webauthn.repository';
import { WebAuthnService } from './webauthn.service';

export const ORG_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const ORG_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
export const EMPLOYEE_ID = 'employee-1';
export const EMPLOYEE_NAME = 'Dawit Haile';
export const CHALLENGE = 'test-challenge';
export const CREDENTIAL_ID = 'cred-1';
export const CREDENTIAL_ROW_ID = 'cred-row-1';
export const PUBLIC_KEY_BYTES = new Uint8Array([37, 13, 29, 3]);
export const PUBLIC_KEY_B64 =
  Buffer.from(PUBLIC_KEY_BYTES).toString('base64url');
export const TIMESTAMP = new Date('2026-09-02T09:00:00Z');

export const REGISTRATION_CHALLENGE = {
  purpose: 'registration',
  organizationId: ORG_A,
  employeeId: EMPLOYEE_ID,
} as const;

export const AUTHENTICATION_CHALLENGE = {
  purpose: 'authentication',
  organizationId: ORG_A,
} as const;

export const CREDENTIAL_ROW = {
  id: CREDENTIAL_ROW_ID,
  organizationId: ORG_A,
  employeeId: EMPLOYEE_ID,
  credentialId: CREDENTIAL_ID,
  publicKey: PUBLIC_KEY_B64,
  counter: 1,
  deviceType: 'singleDevice',
  createdAt: TIMESTAMP,
  lastUsedAt: null,
  revokedAt: null,
};

export const REGISTRATION_RESPONSE = { id: CREDENTIAL_ID, type: 'public-key' };
export const AUTHENTICATION_RESPONSE = {
  id: CREDENTIAL_ID,
  type: 'public-key',
};

export const repoListForEmployee = jest.fn();
export const repoListActiveCredentialIds = jest.fn();
export const repoFindActiveByCredentialId = jest.fn();
export const repoInsert = jest.fn();
export const repoUpdateCounter = jest.fn();
export const repoRevokeByCredentialId = jest.fn();
export const webAuthnCredentialRepository = {
  listForEmployee: repoListForEmployee,
  listActiveCredentialIds: repoListActiveCredentialIds,
  findActiveByCredentialId: repoFindActiveByCredentialId,
  insert: repoInsert,
  updateCounter: repoUpdateCounter,
  revokeByCredentialId: repoRevokeByCredentialId,
} as unknown as WebAuthnCredentialRepository;

export const auditRecord = jest.fn();
export const auditService = { record: auditRecord } as unknown as AuditService;

export const challengeStore = new WebAuthnChallengeStore();

export const service = new WebAuthnService(
  webAuthnCredentialRepository,
  challengeStore,
  auditService,
);

export const mockTx = { sentinel: 'tx' };

export function setupTransactionMock(): void {
  (pooledDb.transaction as unknown as jest.Mock).mockImplementation(
    async (callback: (tx: unknown) => Promise<unknown>) => callback(mockTx),
  );
}

export function challengeIssued(
  data: Parameters<WebAuthnChallengeStore['issue']>[1],
): void {
  (redisClient.get as unknown as jest.Mock).mockImplementation(
    async (key: string) =>
      key === `kiosk:webauthn:challenge:${CHALLENGE}` ? data : null,
  );
  (redisClient.del as unknown as jest.Mock).mockResolvedValue(1);
}

export function defaultMocks(): void {
  (generateRegistrationOptions as unknown as jest.Mock).mockResolvedValue({
    challenge: CHALLENGE,
    rp: { id: 'localhost', name: 'Rona' },
    user: { id: EMPLOYEE_ID, name: EMPLOYEE_ID },
  });
  (verifyRegistrationResponse as unknown as jest.Mock).mockResolvedValue({
    verified: true,
    registrationInfo: {
      credential: {
        id: CREDENTIAL_ID,
        publicKey: PUBLIC_KEY_BYTES,
        counter: 1,
        transports: [],
      },
      credentialDeviceType: 'singleDevice',
      credentialBackedUp: false,
    },
  });
  (generateAuthenticationOptions as unknown as jest.Mock).mockResolvedValue({
    challenge: CHALLENGE,
  });
  (verifyAuthenticationResponse as unknown as jest.Mock).mockResolvedValue({
    verified: true,
    authenticationInfo: {
      credentialID: CREDENTIAL_ID,
      newCounter: 2,
      userVerified: true,
      credentialDeviceType: 'singleDevice',
      credentialBackedUp: false,
      origin: 'http://localhost:3000',
      rpID: 'localhost',
    },
  });

  (redisClient.set as unknown as jest.Mock).mockResolvedValue('OK');
  (redisClient.get as unknown as jest.Mock).mockResolvedValue(null);
  (redisClient.del as unknown as jest.Mock).mockResolvedValue(1);

  repoListForEmployee.mockResolvedValue([]);
  repoListActiveCredentialIds.mockResolvedValue([]);
  repoFindActiveByCredentialId.mockResolvedValue(CREDENTIAL_ROW);
  repoInsert.mockResolvedValue(CREDENTIAL_ROW);
  repoUpdateCounter.mockResolvedValue(CREDENTIAL_ROW);
  repoRevokeByCredentialId.mockResolvedValue([CREDENTIAL_ROW]);

  auditRecord.mockResolvedValue(undefined);
}
