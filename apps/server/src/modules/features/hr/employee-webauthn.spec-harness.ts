import { runWithRequestContext } from '@/context/request-context';
import type { WebAuthnRegistrationVerifyInput } from '@rona/types/hr';
import type { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import type { EmployeesRepository } from './employees.repository';
import { EmployeeWebAuthnService } from './employee-webauthn.service';
import type {
  WebAuthnRegisteredCredential,
  WebAuthnService,
} from '../kiosk/webauthn.service';

export const USER_A = '11111111-1111-4111-8111-111111111111';
export const ORG_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const MEMBERSHIP_A = '33333333-3333-4333-8333-333333333333';

export const EMPLOYEE_ID = 'employee-1';
export const EMPLOYEE_FULL_NAME = 'Dawit Haile';
export const CHALLENGE = 'test-challenge';
export const CREDENTIAL_ID = 'cred-1';

export const EMPLOYEE = {
  id: EMPLOYEE_ID,
  organizationId: ORG_A,
  eid: '10001',
  fullName: EMPLOYEE_FULL_NAME,
  status: 'active',
  archivedAt: null,
};

export const REGISTRATION_OPTIONS = {
  challenge: CHALLENGE,
  rp: { id: 'localhost', name: 'Rona' },
  user: { id: EMPLOYEE_ID, name: EMPLOYEE_FULL_NAME },
};

export const REGISTRATION_CHALLENGE = {
  challengeId: CHALLENGE,
  options: REGISTRATION_OPTIONS,
};

export const VERIFY_INPUT: WebAuthnRegistrationVerifyInput = {
  challenge: CHALLENGE,
  response: {
    id: CREDENTIAL_ID,
    rawId: CREDENTIAL_ID,
    type: 'public-key',
    response: {
      clientDataJSON: 'client-data',
      attestationObject: 'attestation-object',
    },
  },
};

export const REGISTERED_CREDENTIAL: WebAuthnRegisteredCredential = {
  credentialId: CREDENTIAL_ID,
  deviceType: 'singleDevice',
  counter: 1,
  employeeId: EMPLOYEE_ID,
};

export const empFindById = jest.fn();
export const employeesRepository = {
  findById: empFindById,
} as unknown as EmployeesRepository;

export const webAuthnCreateChallenge = jest.fn();
export const webAuthnVerifyRegistration = jest.fn();
export const webAuthnService = {
  createRegistrationChallenge: webAuthnCreateChallenge,
  verifyRegistration: webAuthnVerifyRegistration,
} as unknown as WebAuthnService;

export const auditRecord = jest.fn();
export const auditService = { record: auditRecord } as unknown as AuditService;

export const service = new EmployeeWebAuthnService(
  employeesRepository,
  new TenantContextService(),
  webAuthnService,
  auditService,
);

export function defaultMocks(): void {
  empFindById.mockResolvedValue(EMPLOYEE);
  webAuthnCreateChallenge.mockResolvedValue(REGISTRATION_CHALLENGE);
  webAuthnVerifyRegistration.mockResolvedValue(REGISTERED_CREDENTIAL);
  auditRecord.mockResolvedValue(undefined);
}

export async function runInOrganizationA<T>(
  callback: () => Promise<T>,
): Promise<T> {
  return runWithRequestContext(
    {
      requestId: 'req-test',
      userId: USER_A,
      organizationId: ORG_A,
      membershipId: MEMBERSHIP_A,
      roles: ['OWNER'],
      permissions: ['hr.webauthn.enroll'],
    },
    callback,
  );
}
