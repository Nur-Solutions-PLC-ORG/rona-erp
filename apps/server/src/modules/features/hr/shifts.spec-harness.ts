// Shared test

import { runWithRequestContext } from '@/context/request-context';
import { pooledDb } from '@/db';
import type { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import type { EmployeesRepository } from './employees.repository';
import type { ShiftsRepository } from './shifts.repository';
import { ShiftsService } from './shifts.service';

export const USER_A = '11111111-1111-4111-8111-111111111111';
export const ORG_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const MEMBERSHIP_A = '33333333-3333-4333-8333-333333333333';

export const EMPLOYEE_ID = 'employee-1';
export const SHIFT_ID = 'shift-1';
export const ASSIGNMENT_ID = 'assignment-1';
export const ARCHIVED_AT = new Date('2026-05-01T00:00:00Z');

export const EMPLOYEE = {
  id: EMPLOYEE_ID,
  organizationId: ORG_A,
  eid: '10001',
  fullName: 'Selam Bekele',
  archivedAt: null,
};

export const SHIFT = {
  id: SHIFT_ID,
  organizationId: ORG_A,
  name: 'Morning',
  code: 'MORNING',
  startTime: '06:00',
  endTime: '14:00',
  breakMinutes: 30,
};

export const ASSIGNMENT = {
  id: ASSIGNMENT_ID,
  organizationId: ORG_A,
  employeeId: EMPLOYEE_ID,
  shiftId: SHIFT_ID,
  effectiveFrom: '2026-01-01',
  effectiveTo: null,
};

export const repoCreateShift = jest.fn();
export const repoFindShiftById = jest.fn();
export const repoFindShiftByCode = jest.fn();
export const repoUpdateShift = jest.fn();
export const repoListShifts = jest.fn();
export const repoAssignShift = jest.fn();
export const repoFindOverlappingAssignment = jest.fn();
export const repoFindAssignmentById = jest.fn();
export const repoEndAssignment = jest.fn();
export const repoListAssignmentsForEmployee = jest.fn();
export const shiftsRepository = {
  createShift: repoCreateShift,
  findShiftById: repoFindShiftById,
  findShiftByCode: repoFindShiftByCode,
  updateShift: repoUpdateShift,
  listShifts: repoListShifts,
  assignShift: repoAssignShift,
  findOverlappingAssignment: repoFindOverlappingAssignment,
  findAssignmentById: repoFindAssignmentById,
  endAssignment: repoEndAssignment,
  listAssignmentsForEmployee: repoListAssignmentsForEmployee,
} as unknown as ShiftsRepository;

export const findEmployeeById = jest.fn();
export const employeesRepository = {
  findById: findEmployeeById,
} as unknown as EmployeesRepository;

export const auditRecord = jest.fn();
export const auditService = { record: auditRecord } as unknown as AuditService;

export const service = new ShiftsService(
  shiftsRepository,
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
  findEmployeeById.mockResolvedValue(EMPLOYEE);
  repoFindShiftById.mockResolvedValue(SHIFT);
  repoFindShiftByCode.mockResolvedValue(undefined);
  repoCreateShift.mockResolvedValue(SHIFT);
  repoUpdateShift.mockResolvedValue(SHIFT);
  repoListShifts.mockResolvedValue({ rows: [SHIFT], total: 1 });
  repoAssignShift.mockResolvedValue(ASSIGNMENT);
  repoFindOverlappingAssignment.mockResolvedValue(undefined);
  repoFindAssignmentById.mockResolvedValue(ASSIGNMENT);
  repoEndAssignment.mockResolvedValue({
    ...ASSIGNMENT,
    effectiveTo: '2026-08-31',
  });
  repoListAssignmentsForEmployee.mockResolvedValue([ASSIGNMENT]);
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
      permissions: [],
    },
    callback,
  );
}
