import {
  EmployeeArchivedException,
  EmployeeNotArchivedException,
} from './hr.exception';
import {
  ARCHIVED_AT,
  EMPLOYEE,
  EMPLOYEE_ID,
  auditRecord,
  defaultMocks,
  employeesService,
  mockTx,
  repoArchive,
  repoFindById,
  repoRestore,
  runInOrganizationA,
  setupTransactionMock,
} from './employees.spec-harness';

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
  redisClient: {
    get: jest.fn(async () => null),
    set: jest.fn(async () => 'OK'),
  },
}));

describe('EmployeesService archive / restore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
    defaultMocks();
  });

  it('archives an employee and audits the transition', async () => {
    repoFindById.mockResolvedValue(EMPLOYEE);
    repoArchive.mockResolvedValue({ ...EMPLOYEE, archivedAt: ARCHIVED_AT });

    await runInOrganizationA(() =>
      employeesService.archiveEmployee(EMPLOYEE_ID),
    );

    expect(repoArchive).toHaveBeenCalledWith(EMPLOYEE_ID, mockTx);
    expect(auditRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        action: 'hr.employee.archive',
        entityType: 'employee',
        entityId: EMPLOYEE_ID,
        before: { archivedAt: null },
        after: { archivedAt: expect.any(String) },
      }),
      mockTx,
    );
  });

  it('rejects archiving an already archived employee', async () => {
    repoFindById.mockResolvedValue({
      ...EMPLOYEE,
      archivedAt: ARCHIVED_AT,
    });

    await expect(
      runInOrganizationA(() => employeesService.archiveEmployee(EMPLOYEE_ID)),
    ).rejects.toBeInstanceOf(EmployeeArchivedException);
    expect(repoArchive).not.toHaveBeenCalled();
  });

  it('restores an archived employee and audits the transition', async () => {
    repoFindById.mockResolvedValue({
      ...EMPLOYEE,
      archivedAt: ARCHIVED_AT,
    });

    await runInOrganizationA(() =>
      employeesService.restoreEmployee(EMPLOYEE_ID),
    );

    expect(repoRestore).toHaveBeenCalledWith(EMPLOYEE_ID, mockTx);
    expect(auditRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        action: 'hr.employee.restore',
        entityType: 'employee',
        entityId: EMPLOYEE_ID,
        before: { archivedAt: ARCHIVED_AT.toISOString() },
        after: { archivedAt: null },
      }),
      mockTx,
    );
  });

  it('rejects restoring an employee that is not archived', async () => {
    repoFindById.mockResolvedValue(EMPLOYEE);

    await expect(
      runInOrganizationA(() => employeesService.restoreEmployee(EMPLOYEE_ID)),
    ).rejects.toBeInstanceOf(EmployeeNotArchivedException);
    expect(repoRestore).not.toHaveBeenCalled();
  });
});
