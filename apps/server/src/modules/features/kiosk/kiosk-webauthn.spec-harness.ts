import { rateLimit } from '@/redis';
import type { AuditService } from '@/modules/audit/audit.service';
import type { AttendanceEventType } from '@rona/types/hr';
import type { AttendanceService } from '@/modules/features/hr/attendance.service';
import type { EmployeesRepository } from '@/modules/features/hr/employees.repository';
import type { KioskWebAuthnVerifyInput } from '@rona/types/kiosk';
import { KioskWebAuthnService } from './kiosk-webauthn.service';
import type { KioskDeviceContext } from './kiosk.service';
import type { WebAuthnService } from './webauthn.service';

export const KIOSK_ID = 'kiosk-1';
export const DEVICE_ID = 'KSK-ABC123';
export const ORG_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const ORG_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
export const EMPLOYEE_ID = 'employee-1';
export const EMPLOYEE_NAME = 'Dawit Haile';
export const CREDENTIAL_ID = 'cred-1';
export const CHALLENGE = 'test-challenge';
export const EVENT_AT = new Date('2026-09-02T09:00:00Z');
export const EVENT = { eventType: 'CLOCK_IN' as const, eventAt: EVENT_AT };

export const DEVICE: KioskDeviceContext = {
  kioskId: KIOSK_ID,
  deviceId: DEVICE_ID,
  organizationId: ORG_A,
};

export const VERIFY_INPUT: KioskWebAuthnVerifyInput = {
  challenge: CHALLENGE,
  eventType: 'CLOCK_IN',
  response: {
    id: CREDENTIAL_ID,
    rawId: 'cmF3LWNyZWQtMQ',
    type: 'public-key',
    response: {
      clientDataJSON: 'eyJjaGFsbGVuZ2UiOiJ0ZXN0In0',
      authenticatorData: 'YXV0aC1kYXRh',
      signature: 'c2lnbmF0dXJl',
    },
    clientExtensionResults: {},
  },
};

export const EMPLOYEE_ACTIVE = {
  id: EMPLOYEE_ID,
  eid: '12345',
  fullName: EMPLOYEE_NAME,
  status: 'active',
  archivedAt: null,
};

export const webAuthnAuthOptions = jest.fn();
export const webAuthnVerifyAuthentication = jest.fn();
export const webAuthnService = {
  createAuthenticationChallenge: webAuthnAuthOptions,
  verifyAuthentication: webAuthnVerifyAuthentication,
} as unknown as WebAuthnService;

export const employeeFindById = jest.fn();
export const employeesRepository = {
  findById: employeeFindById,
} as unknown as EmployeesRepository;

export const punchKiosk = jest.fn();
export const attendanceService = {
  punchKiosk,
} as unknown as AttendanceService;

export const auditRecord = jest.fn();
export const auditService = { record: auditRecord } as unknown as AuditService;

export const service = new KioskWebAuthnService(
  webAuthnService,
  employeesRepository,
  attendanceService,
  auditService,
);

export function defaultMocks(): void {
  (rateLimit as unknown as jest.Mock).mockResolvedValue(true);

  webAuthnAuthOptions.mockResolvedValue({
    challengeId: CHALLENGE,
    options: {
      challenge: CHALLENGE,
      rpId: 'localhost',
      allowCredentials: [],
      userVerification: 'required',
    },
  });
  webAuthnVerifyAuthentication.mockResolvedValue({
    employeeId: EMPLOYEE_ID,
    credentialId: CREDENTIAL_ID,
    newCounter: 2,
  });

  employeeFindById.mockResolvedValue(EMPLOYEE_ACTIVE);
  punchKiosk.mockImplementation(
    (_employeeId: string, eventType: AttendanceEventType) =>
      Promise.resolve({ eventType, eventAt: EVENT_AT }),
  );
  auditRecord.mockResolvedValue(undefined);
}
