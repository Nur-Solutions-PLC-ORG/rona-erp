process.env.WEBAUTHN_RP_ID = 'erp.example.com';
process.env.WEBAUTHN_RP_NAME = 'Rona ERP';
process.env.WEBAUTHN_ORIGIN = 'https://erp.example.com';

// Shared test

import { runWithRequestContext } from '@/context/request-context';
import type { AuditService } from '@/modules/audit/audit.service';
import type { AttendanceService } from '@/modules/features/hr/attendance.service';
import type { CredentialRepository } from './credential.repository';
import { WebAuthnService } from './webauthn.service';

export const ORG_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const ACTOR_A = '11111111-1111-4111-8111-111111111111';
export const EMPLOYEE_ID = '22222222-2222-4222-8222-222222222222';
export const KIOSK_ID = '33333333-3333-4333-8333-333333333333';
export const CREDENTIAL_ROW_ID = '44444444-4444-4444-8444-444444444444';
export const CHALLENGE_ID = '55555555-5555-4555-8555-555555555555';
export const SESSION_HASH = 'a'.repeat(64);
export const TOKEN_VERSION = 'b'.repeat(64);
export const CREDENTIAL_ID = 'c'.repeat(64);
export const USER_HANDLE = Buffer.from(EMPLOYEE_ID).toString('base64url');
export const GRANT_TOKEN = 'g'.repeat(43);
export const FIXED_NOW = new Date('2026-09-17T08:00:00.000Z');

export const deviceContext = {
  kioskId: KIOSK_ID,
  deviceId: 'KSK-ABCDEF',
  organizationId: ORG_A,
  sessionHash: SESSION_HASH,
  tokenVersion: TOKEN_VERSION,
};

export const credentialRow = {
  id: CREDENTIAL_ROW_ID,
  organizationId: ORG_A,
  employeeId: EMPLOYEE_ID,
  credentialId: CREDENTIAL_ID,
  publicKey: 'cHVibGljLWtleQ',
  counter: 5,
  userHandle: USER_HANDLE,
  transports: ['hybrid'],
  deviceName: 'Pixel 9',
  deviceType: 'multiDevice',
  backedUp: true,
  createdAt: new Date('2026-09-01T00:00:00.000Z'),
  lastUsedAt: null,
  revokedAt: null,
};

export const employeeRow = {
  id: EMPLOYEE_ID,
  fullName: 'Dawit Haile',
  eid: '10001',
  status: 'active',
  archivedAt: null,
};

export const registrationChallengeRow = {
  id: CHALLENGE_ID,
  organizationId: ORG_A,
  purpose: 'registration',
  challenge: 'reg-challenge',
  employeeId: EMPLOYEE_ID,
  actorId: ACTOR_A,
  kioskId: null,
  sessionHash: null,
  deviceName: 'Pixel 9',
  expiresAt: new Date(FIXED_NOW.getTime() + 5 * 60 * 1000),
};

export const authenticationChallengeRow = {
  id: CHALLENGE_ID,
  organizationId: ORG_A,
  purpose: 'authentication',
  challenge: 'auth-challenge',
  employeeId: null,
  actorId: null,
  kioskId: KIOSK_ID,
  sessionHash: SESSION_HASH,
  deviceName: null,
  expiresAt: new Date(FIXED_NOW.getTime() + 5 * 60 * 1000),
};

export const credentialRepository = {
  transaction: jest.fn((callback: (tx: unknown) => Promise<unknown>) =>
    callback({ sentinel: 'tx' }),
  ),
  activeOrganization: jest.fn(),
  activeDevice: jest.fn(),
  employee: jest.fn(),
  employeeByEid: jest.fn(),
  list: jest.fn(),
  find: jest.fn(),
  lockCredential: jest.fn(),
  create: jest.fn(),
  advanceCounter: jest.fn(),
  revoke: jest.fn(),
  createChallenge: jest.fn(),
  consumeChallenge: jest.fn(),
  createGrant: jest.fn(),
  consumeGrant: jest.fn(),
} as unknown as CredentialRepository;

export const punchKiosk = jest.fn();
export const attendanceService = {
  punchKiosk,
} as unknown as AttendanceService;

export const auditRecord = jest.fn();
export const auditService = { record: auditRecord } as unknown as AuditService;

export const generateRegistrationOptions = jest.fn();
export const generateAuthenticationOptions = jest.fn();
export const verifyRegistrationResponse = jest.fn();
export const verifyAuthenticationResponse = jest.fn();

export const service = new WebAuthnService(
  credentialRepository,
  attendanceService,
  auditService,
);

export function runInOrganizationA<T>(callback: () => Promise<T>): Promise<T> {
  return runWithRequestContext(
    {
      requestId: 'req-test',
      userId: ACTOR_A,
      organizationId: ORG_A,
      membershipId: '33333333-3333-4333-8333-333333333399',
      roles: ['HR_MANAGER'],
      permissions: ['hr.employee.read', 'hr.employee.update'],
    },
    callback,
  );
}

export const registrationResponse = {
  id: CREDENTIAL_ID,
  rawId: CREDENTIAL_ID,
  type: 'public-key' as const,
  clientExtensionResults: {},
  response: {
    clientDataJSON: 'Y2xpZW50RGF0YUpTT04',
    attestationObject: 'YXR0ZXN0YXRpb25PYmplY3Q',
    transports: ['hybrid'],
  },
};

export const authenticationResponse = {
  id: CREDENTIAL_ID,
  rawId: CREDENTIAL_ID,
  type: 'public-key' as const,
  clientExtensionResults: {},
  response: {
    clientDataJSON: 'Y2xpZW50RGF0YUpTT04',
    authenticatorData: 'YXV0aGVudGljYXRvckRhdGE',
    signature: 'c2lnbmF0dXJl',
    userHandle: USER_HANDLE,
  },
};

export const unauthorized = { status: 401 };
