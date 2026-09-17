import {
  DepartmentNotFoundException,
  EmployeeEidConflictException,
  EmployeeNotFoundException,
  EmployeeUserConflictException,
  LinkedUserNotFoundException,
  PositionArchivedException,
  PositionNotFoundException,
} from './hr.exception';
import {
  ARCHIVED_AT,
  DEPARTMENT_ID,
  EMPLOYEE,
  EMPLOYEE_ID,
  POSITION,
  POSITION_ID,
  USER_A,
  auditRecord,
  defaultMocks,
  employeesService,
  mockTx,
  repoCreate,
  repoFindByEid,
  repoFindById,
  repoFindDepartment,
  repoFindEmployeeByUser,
  repoFindPosition,
  repoList,
  repoUserExists,
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

describe('EmployeesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
    defaultMocks();
  });

  describe('createEmployee', () => {
    it('creates an employee and audits it', async () => {
      const result = await runInOrganizationA(() =>
        employeesService.createEmployee({
          eId: '10001',
          fullName: 'Selam Bekele',
          phone: '+251911000001',
          gender: 'F',
          birthDate: '1995-03-14',
          departmentId: DEPARTMENT_ID,
          positionId: POSITION_ID,
        }),
      );

      expect(repoFindByEid).toHaveBeenCalledWith('10001');
      expect(repoCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          eId: '10001',
          fullName: 'Selam Bekele',
          gender: 'F',
          departmentId: DEPARTMENT_ID,
          positionId: POSITION_ID,
        }),
        mockTx,
      );
      const forwardedInput = repoCreate.mock.calls[0][0] as Record<
        string,
        unknown
      >;
      expect('organizationId' in forwardedInput).toBe(false);

      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          action: 'hr.employee.create',
          entityType: 'employee',
          entityId: EMPLOYEE_ID,
          after: {
            eId: '10001',
            fullName: 'Selam Bekele',
            status: 'ACTIVE',
            departmentId: DEPARTMENT_ID,
            positionId: POSITION_ID,
            userId: null,
          },
        }),
        mockTx,
      );
      expect(repoFindById).toHaveBeenCalledWith(EMPLOYEE_ID);
      expect(result).toEqual(EMPLOYEE);
    });

    it('rejects a duplicate EID within the tenant', async () => {
      repoFindByEid.mockResolvedValue(EMPLOYEE);

      await expect(
        runInOrganizationA(() =>
          employeesService.createEmployee({
            eId: '10001',
            fullName: 'Another Person',
            phone: '+251911000009',
            gender: 'M',
            birthDate: '1990-01-01',
          }),
        ),
      ).rejects.toBeInstanceOf(EmployeeEidConflictException);
      expect(repoCreate).not.toHaveBeenCalled();
    });

    it('rejects a forged departmentId from another organization', async () => {
      repoFindDepartment.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() =>
          employeesService.createEmployee({
            eId: '10002',
            fullName: 'Dawit Haile',
            phone: '+251911000003',
            gender: 'M',
            birthDate: '1992-07-20',
            departmentId: 'forged-department',
          }),
        ),
      ).rejects.toBeInstanceOf(DepartmentNotFoundException);
      expect(repoCreate).not.toHaveBeenCalled();
    });

    it('rejects a forged positionId from another organization', async () => {
      repoFindPosition.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() =>
          employeesService.createEmployee({
            eId: '10002',
            fullName: 'Dawit Haile',
            phone: '+251911000003',
            gender: 'M',
            birthDate: '1992-07-20',
            positionId: 'forged-position',
          }),
        ),
      ).rejects.toBeInstanceOf(PositionNotFoundException);
      expect(repoCreate).not.toHaveBeenCalled();
    });

    it('rejects an archived position', async () => {
      repoFindPosition.mockResolvedValue({
        ...POSITION,
        archivedAt: ARCHIVED_AT,
      });

      await expect(
        runInOrganizationA(() =>
          employeesService.createEmployee({
            eId: '10002',
            fullName: 'Dawit Haile',
            phone: '+251911000003',
            gender: 'M',
            birthDate: '1992-07-20',
            positionId: POSITION_ID,
          }),
        ),
      ).rejects.toBeInstanceOf(PositionArchivedException);
      expect(repoCreate).not.toHaveBeenCalled();
    });

    it('rejects a userId that does not exist', async () => {
      repoUserExists.mockResolvedValue(false);

      await expect(
        runInOrganizationA(() =>
          employeesService.createEmployee({
            eId: '10002',
            fullName: 'Dawit Haile',
            phone: '+251911000003',
            gender: 'M',
            birthDate: '1992-07-20',
            userId: 'forged-user',
          }),
        ),
      ).rejects.toBeInstanceOf(LinkedUserNotFoundException);
      expect(repoCreate).not.toHaveBeenCalled();
    });

    it('rejects a userId already linked to another employee in the tenant', async () => {
      repoFindEmployeeByUser.mockResolvedValue({
        ...EMPLOYEE,
        id: 'employee-other',
      });

      await expect(
        runInOrganizationA(() =>
          employeesService.createEmployee({
            eId: '10002',
            fullName: 'Dawit Haile',
            phone: '+251911000003',
            gender: 'M',
            birthDate: '1992-07-20',
            userId: USER_A,
          }),
        ),
      ).rejects.toBeInstanceOf(EmployeeUserConflictException);
      expect(repoCreate).not.toHaveBeenCalled();
    });
  });

  describe('getEmployee / listEmployees', () => {
    it('returns the employee for the tenant', async () => {
      const result = await runInOrganizationA(() =>
        employeesService.getEmployee(EMPLOYEE_ID),
      );
      expect(result).toEqual(EMPLOYEE);
    });

    it('rejects an employee outside the tenant', async () => {
      repoFindById.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() =>
          employeesService.getEmployee('forged-employee'),
        ),
      ).rejects.toBeInstanceOf(EmployeeNotFoundException);
    });

    it('applies pagination defaults and wraps the repository result', async () => {
      const result = await runInOrganizationA(() =>
        employeesService.listEmployees({}),
      );

      expect(repoList).toHaveBeenCalledWith(
        expect.objectContaining({
          page: expect.any(Number),
          limit: expect.any(Number),
        }),
      );
      expect(result.data).toEqual([EMPLOYEE]);
      expect(result.pagination.totalItems).toBe(1);
    });
  });
});
