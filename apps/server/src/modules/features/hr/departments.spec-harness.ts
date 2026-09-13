// Shared test

import { runWithRequestContext } from '@/context/request-context';
import { pooledDb } from '@/db';
import type { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import type { DepartmentsRepository } from './departments.repository';
import type { EmployeesRepository } from './employees.repository';
import { DepartmentsService } from './departments.service';

export const USER_A = '11111111-1111-4111-8111-111111111111';
export const ORG_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const MEMBERSHIP_A = '33333333-3333-4333-8333-333333333333';

export const DEPARTMENT_ID = 'department-1';
export const POSITION_ID = 'position-1';
export const ARCHIVED_AT = new Date('2026-05-01T00:00:00Z');

export const DEPARTMENT = {
  id: DEPARTMENT_ID,
  organizationId: ORG_A,
  name: 'Production',
  code: 'PROD',
};

export const POSITION = {
  id: POSITION_ID,
  organizationId: ORG_A,
  title: 'Supervisor',
  code: 'SUP',
  departmentId: DEPARTMENT_ID,
  archivedAt: null,
};

export const repoCreateDepartment = jest.fn();
export const repoFindDepartmentById = jest.fn();
export const repoFindDepartmentByCode = jest.fn();
export const repoUpdateDepartment = jest.fn();
export const repoListDepartments = jest.fn();
export const repoCreatePosition = jest.fn();
export const repoFindPositionById = jest.fn();
export const repoFindPositionByCode = jest.fn();
export const repoUpdatePosition = jest.fn();
export const repoListPositions = jest.fn();
export const repoArchivePosition = jest.fn();
export const repoRestorePosition = jest.fn();
export const departmentsRepository = {
  createDepartment: repoCreateDepartment,
  findDepartmentById: repoFindDepartmentById,
  findDepartmentByCode: repoFindDepartmentByCode,
  updateDepartment: repoUpdateDepartment,
  listDepartments: repoListDepartments,
  createPosition: repoCreatePosition,
  findPositionById: repoFindPositionById,
  findPositionByCode: repoFindPositionByCode,
  updatePosition: repoUpdatePosition,
  listPositions: repoListPositions,
  archivePosition: repoArchivePosition,
  restorePosition: repoRestorePosition,
} as unknown as DepartmentsRepository;

export const countEmployeesInPosition = jest.fn();
export const employeesRepository = {
  countEmployeesInPosition,
} as unknown as EmployeesRepository;

export const auditRecord = jest.fn();
export const auditService = { record: auditRecord } as unknown as AuditService;

export const service = new DepartmentsService(
  departmentsRepository,
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
  repoFindDepartmentById.mockResolvedValue(DEPARTMENT);
  repoFindDepartmentByCode.mockResolvedValue(undefined);
  repoCreateDepartment.mockResolvedValue(DEPARTMENT);
  repoUpdateDepartment.mockResolvedValue(DEPARTMENT);
  repoListDepartments.mockResolvedValue({ rows: [DEPARTMENT], total: 1 });
  repoFindPositionById.mockResolvedValue(POSITION);
  repoFindPositionByCode.mockResolvedValue(undefined);
  repoCreatePosition.mockResolvedValue(POSITION);
  repoUpdatePosition.mockResolvedValue(POSITION);
  repoListPositions.mockResolvedValue({ rows: [POSITION], total: 1 });
  repoArchivePosition.mockResolvedValue({
    ...POSITION,
    archivedAt: ARCHIVED_AT,
  });
  repoRestorePosition.mockResolvedValue(POSITION);
  countEmployeesInPosition.mockResolvedValue(0);
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
