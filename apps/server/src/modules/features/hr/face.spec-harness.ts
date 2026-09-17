// Shared test

import { runWithRequestContext } from '@/context/request-context';
import { pooledDb } from '@/db';
import { rateLimit } from '@/redis';
import type { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import type { AttendanceService } from './attendance.service';
import type { EmployeesRepository } from './employees.repository';
import type { FaceRepository } from './face.repository';
import { FaceService } from './face.service';

export const USER_A = '11111111-1111-4111-8111-111111111111';
export const ORG_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const ORG_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
export const MEMBERSHIP_A = '33333333-3333-4333-8333-333333333333';

export const EMPLOYEE_ID = 'employee-1';
export const FACE_ID = 'face-1';
export const FACIAL_ID = 'facial-1';
export const KIOSK_ID = 'kiosk-1';
export const DEVICE_ID = 'KSK-TEST001';
export const EVENT_AT = new Date('2026-09-02T09:00:00Z');
export const ENROLLED_AT = new Date('2026-09-01T08:00:00Z');

export const DEVICE = {
  kioskId: KIOSK_ID,
  deviceId: DEVICE_ID,
  organizationId: ORG_A,
};

export const EMPLOYEE = {
  id: EMPLOYEE_ID,
  organizationId: ORG_A,
  eid: '10001',
  fullName: 'Dawit Haile',
  status: 'active',
  archivedAt: null,
};

export const FACE_ROW = {
  id: FACE_ID,
  organizationId: ORG_A,
  employeeId: EMPLOYEE_ID,
  facialId: FACIAL_ID,
  enrolledAt: ENROLLED_AT,
  lastUsedAt: null,
  revokedAt: null,
};

export const FACE_MATCH = {
  ...FACE_ROW,
  employeeFullName: 'Dawit Haile',
  employeeStatus: 'active',
  employeeArchivedAt: null,
};

export const repoList = jest.fn();
export const repoGetById = jest.fn();
export const repoFindActiveByFacialId = jest.fn();
export const repoInsertEnrollment = jest.fn();
export const repoRevokeExisting = jest.fn();
export const repoRevoke = jest.fn();
export const repoMarkUsed = jest.fn();
export const faceRepository = {
  list: repoList,
  getById: repoGetById,
  findActiveByFacialId: repoFindActiveByFacialId,
  insertEnrollment: repoInsertEnrollment,
  revokeExisting: repoRevokeExisting,
  revoke: repoRevoke,
  markUsed: repoMarkUsed,
} as unknown as FaceRepository;

export const empFindById = jest.fn();
export const employeesRepository = {
  findById: empFindById,
} as unknown as EmployeesRepository;

export const punchKiosk = jest.fn();
export const attendanceService = {
  punchKiosk,
} as unknown as AttendanceService;

export const auditRecord = jest.fn();
export const auditService = { record: auditRecord } as unknown as AuditService;

export const service = new FaceService(
  faceRepository,
  employeesRepository,
  attendanceService,
  new TenantContextService(),
  auditService,
);

export const mockTx = { sentinel: 'tx' };

export function setupTransactionMock(): void {
  (pooledDb.transaction as unknown as jest.Mock).mockImplementation(
    async (callback: (tx: unknown) => Promise<unknown>) => callback(mockTx),
  );
}

export function defaultMocks(): void {
  empFindById.mockResolvedValue(EMPLOYEE);
  repoList.mockResolvedValue([]);
  repoFindActiveByFacialId.mockResolvedValue(null);
  repoInsertEnrollment.mockResolvedValue(FACE_ROW);
  repoRevokeExisting.mockResolvedValue(undefined);
  repoRevoke.mockResolvedValue(FACE_ROW);
  repoMarkUsed.mockResolvedValue(undefined);
  punchKiosk.mockResolvedValue({
    id: 'event-1',
    eventType: 'CLOCK_IN',
    eventAt: EVENT_AT,
  });
  auditRecord.mockResolvedValue(undefined);
  (rateLimit as unknown as jest.Mock).mockResolvedValue(true);
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
      roles: ['HR_MANAGER'],
      permissions: ['hr.employee.update'],
    },
    callback,
  );
}