import {
  DepartmentNotFoundException,
  EmployeeArchivedException,
  EmployeeNotFoundException,
} from './hr.exception';
import {
  ARCHIVED_AT,
  EMPLOYEE,
  EMPLOYEE_ID,
  USER_A,
  auditRecord,
  defaultMocks,
  employeesService,
  mockTx,
  repoFindById,
  repoFindDepartment,
  repoUpdate,
  repoUserExists,
  repoFindEmployeeByUser,
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

describe('EmployeesService.updateEmployee', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
    defaultMocks();
  });

  it('updates an employee and audits before/after', async () => {
    const updatedEmployee = {
      ...EMPLOYEE,
      fullName: 'Selam Bekele Alemu',
    };
    repoUpdate.mockResolvedValue(updatedEmployee);
    repoFindById
      .mockResolvedValueOnce(EMPLOYEE)
      .mockResolvedValue(updatedEmployee);

    const result = await runInOrganizationA(() =>
      employeesService.updateEmployee(EMPLOYEE_ID, {
        fullName: 'Selam Bekele Alemu',
      }),
    );

    expect(repoUpdate).toHaveBeenCalledWith(
      EMPLOYEE_ID,
      { fullName: 'Selam Bekele Alemu' },
      mockTx,
    );
    expect(auditRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        action: 'hr.employee.update',
        entityType: 'employee',
        entityId: EMPLOYEE_ID,
        before: expect.objectContaining({ fullName: 'Selam Bekele' }),
        after: expect.objectContaining({
          fullName: 'Selam Bekele Alemu',
        }),
      }),
      mockTx,
    );
    expect(result.fullName).toBe('Selam Bekele Alemu');
  });

  it('does not re-validate a department that is unchanged', async () => {
    await runInOrganizationA(() =>
      employeesService.updateEmployee(EMPLOYEE_ID, {
        departmentId: 'department-1',
      }),
    );

    expect(repoFindDepartment).not.toHaveBeenCalled();
  });

  it('unlinks a user when userId is explicitly null', async () => {
    const linkedEmployee = { ...EMPLOYEE, userId: USER_A };
    const unlinkedEmployee = { ...EMPLOYEE, userId: null };
    repoFindById
      .mockResolvedValueOnce(linkedEmployee)
      .mockResolvedValue(unlinkedEmployee);
    repoUpdate.mockResolvedValue(unlinkedEmployee);

    const result = await runInOrganizationA(() =>
      employeesService.updateEmployee(EMPLOYEE_ID, { userId: null }),
    );

    expect(repoUserExists).not.toHaveBeenCalled();
    expect(repoFindEmployeeByUser).not.toHaveBeenCalled();
    expect(repoUpdate).toHaveBeenCalledWith(
      EMPLOYEE_ID,
      { userId: null },
      mockTx,
    );
    expect(auditRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'hr.employee.update',
        before: expect.objectContaining({ userId: USER_A }),
        after: expect.objectContaining({ userId: null }),
      }),
      mockTx,
    );
    expect(result.userId).toBeNull();
  });

  it('clears the department when departmentId is explicitly null', async () => {
    await runInOrganizationA(() =>
      employeesService.updateEmployee(EMPLOYEE_ID, { departmentId: null }),
    );

    expect(repoFindDepartment).not.toHaveBeenCalled();
    expect(repoUpdate).toHaveBeenCalledWith(
      EMPLOYEE_ID,
      { departmentId: null },
      mockTx,
    );
    expect(auditRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'hr.employee.update',
        after: expect.objectContaining({ departmentId: null }),
      }),
      mockTx,
    );
  });

  it('validates a changed departmentId', async () => {
    repoFindDepartment.mockResolvedValue(undefined);

    await expect(
      runInOrganizationA(() =>
        employeesService.updateEmployee(EMPLOYEE_ID, {
          departmentId: 'forged-department',
        }),
      ),
    ).rejects.toBeInstanceOf(DepartmentNotFoundException);
    expect(repoUpdate).not.toHaveBeenCalled();
  });

  it('rejects an archived employee', async () => {
    repoFindById.mockResolvedValue({
      ...EMPLOYEE,
      archivedAt: ARCHIVED_AT,
    });

    await expect(
      runInOrganizationA(() =>
        employeesService.updateEmployee(EMPLOYEE_ID, { fullName: 'Nope' }),
      ),
    ).rejects.toBeInstanceOf(EmployeeArchivedException);
    expect(repoUpdate).not.toHaveBeenCalled();
  });

  it('rejects an employee outside the tenant', async () => {
    repoFindById.mockResolvedValue(undefined);

    await expect(
      runInOrganizationA(() =>
        employeesService.updateEmployee('forged-employee', {
          fullName: 'Nope',
        }),
      ),
    ).rejects.toBeInstanceOf(EmployeeNotFoundException);
    expect(repoUpdate).not.toHaveBeenCalled();
  });
});
