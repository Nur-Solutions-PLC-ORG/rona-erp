// Shared test

import { runWithRequestContext } from '@/context/request-context';
import { pooledDb } from '@/db';
import type { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import type { AttendanceRepository } from './attendance.repository';
import type { EmployeesRepository } from './employees.repository';
import { AttendanceService } from './attendance.service';

export const USER_A = '11111111-1111-4111-8111-111111111111';
export const ORG_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const MEMBERSHIP_A = '33333333-3333-4333-8333-333333333333';

export const EMPLOYEE_ID = 'employee-1';
export const CLOCK_IN_AT = new Date('2026-09-01T05:45:00Z');

export const EMPLOYEE = {
  id: EMPLOYEE_ID,
  organizationId: ORG_A,
  eid: '10001',
  fullName: 'Dawit Haile',
  archivedAt: null,
};

export const repoCreate = jest.fn();
export const repoList = jest.fn();
export const repoListEventsForEmployee = jest.fn();
export const attendanceRepository = {
  create: repoCreate,
  list: repoList,
  listEventsForEmployee: repoListEventsForEmployee,
} as unknown as AttendanceRepository;

export const findEmployeeByIdForUpdate = jest.fn();
export const findEmployeeByUserId = jest.fn();
export const findEmployeeById = jest.fn();
export const employeesRepository = {
  findByIdForUpdate: findEmployeeByIdForUpdate,
  findByUserId: findEmployeeByUserId,
  findById: findEmployeeById,
} as unknown as EmployeesRepository;

export const auditRecord = jest.fn();
export const auditService = { record: auditRecord } as unknown as AuditService;

export const service = new AttendanceService(
  attendanceRepository,
  employeesRepository,
  auditService,
  new TenantContextService(),
);

export const mockTx = { sentinel: 'tx' };

export function setupTransactionMock(): void {
  (pooledDb.transaction as unknown as jest.Mock).mockImplementation(
    async (callback: (tx: unknown) => Promise<unknown>) => callback(mockTx),
  );
}

export function defaultMocks(): void {
  findEmployeeByIdForUpdate.mockResolvedValue(EMPLOYEE);
  findEmployeeByUserId.mockResolvedValue(EMPLOYEE);
  findEmployeeById.mockResolvedValue(EMPLOYEE);
  repoListEventsForEmployee.mockResolvedValue([]);
  repoCreate.mockResolvedValue({
    id: 'event-1',
    organizationId: ORG_A,
    employeeId: EMPLOYEE_ID,
    eventType: 'CLOCK_IN',
    eventAt: CLOCK_IN_AT,
    recordedBy: USER_A,
    notes: null,
  });
  repoList.mockResolvedValue({ rows: [], total: 0 });
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
      roles: ['HR_MANAGER'],
      permissions: ['hr.attendance.manage'],
    },
    callback,
  );
}
