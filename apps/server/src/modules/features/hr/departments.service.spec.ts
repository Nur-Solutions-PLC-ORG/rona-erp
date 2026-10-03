import {
  DEPARTMENT,
  DEPARTMENT_ID,
  ORG_A,
  auditRecord,
  defaultMocks,
  mockTx,
  repoCreateDepartment,
  repoFindDepartmentByCode,
  repoFindDepartmentById,
  repoListDepartments,
  repoUpdateDepartment,
  runInOrganizationA,
  service,
  setupTransactionMock,
} from './departments.spec-harness';
import {
  DepartmentCodeConflictException,
  DepartmentNotFoundException,
} from './hr.exception';

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

describe('DepartmentsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
    defaultMocks();
  });

  describe('departments', () => {
    it('creates a department and audits it', async () => {
      const result = await runInOrganizationA(() =>
        service.createDepartment({
          name: 'Production',
          code: 'PROD',
        }),
      );

      expect(repoFindDepartmentByCode).toHaveBeenCalledWith('PROD');
      expect(repoCreateDepartment).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Production', code: 'PROD' }),
        mockTx,
      );
      const forwardedInput = repoCreateDepartment.mock.calls[0][0] as Record<
        string,
        unknown
      >;
      expect('organizationId' in forwardedInput).toBe(false);

      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'hr.department.create',
          entityType: 'department',
          entityId: DEPARTMENT_ID,
          after: { name: 'Production', code: 'PROD' },
        }),
        mockTx,
      );
      expect(result).toEqual(DEPARTMENT);
    });

    it('rejects a duplicate code within the tenant', async () => {
      repoFindDepartmentByCode.mockResolvedValue(DEPARTMENT);

      await expect(
        runInOrganizationA(() =>
          service.createDepartment({ name: 'Production 2', code: 'PROD' }),
        ),
      ).rejects.toBeInstanceOf(DepartmentCodeConflictException);
      expect(repoCreateDepartment).not.toHaveBeenCalled();
    });

    it('gets a department for the tenant', async () => {
      const result = await runInOrganizationA(() =>
        service.getDepartment(DEPARTMENT_ID),
      );
      expect(result).toEqual(DEPARTMENT);
    });

    it('rejects a department outside the tenant', async () => {
      repoFindDepartmentById.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() => service.getDepartment('forged-department')),
      ).rejects.toBeInstanceOf(DepartmentNotFoundException);
    });

    it('applies pagination defaults and wraps the repository result', async () => {
      const result = await runInOrganizationA(() =>
        service.listDepartments({}),
      );

      expect(repoListDepartments).toHaveBeenCalledWith(
        expect.objectContaining({
          page: expect.any(Number),
          limit: expect.any(Number),
        }),
      );
      expect(result.data).toEqual([DEPARTMENT]);
      expect(result.pagination.totalItems).toBe(1);
    });

    it('updates a department and audits before/after', async () => {
      repoUpdateDepartment.mockResolvedValue({
        ...DEPARTMENT,
        name: 'Bakery Production',
      });

      const result = await runInOrganizationA(() =>
        service.updateDepartment(DEPARTMENT_ID, { name: 'Bakery Production' }),
      );

      expect(repoUpdateDepartment).toHaveBeenCalledWith(
        DEPARTMENT_ID,
        { name: 'Bakery Production' },
        mockTx,
      );
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'hr.department.update',
          entityType: 'department',
          entityId: DEPARTMENT_ID,
          before: { name: 'Production', code: 'PROD' },
          after: { name: 'Bakery Production', code: 'PROD' },
        }),
        mockTx,
      );
      expect(result.name).toBe('Bakery Production');
    });

    it('rejects updating to a code owned by another department in the tenant', async () => {
      repoFindDepartmentByCode.mockResolvedValue({
        ...DEPARTMENT,
        id: 'department-other',
        code: 'QA',
      });

      await expect(
        runInOrganizationA(() =>
          service.updateDepartment(DEPARTMENT_ID, { code: 'QA' }),
        ),
      ).rejects.toBeInstanceOf(DepartmentCodeConflictException);
      expect(repoUpdateDepartment).not.toHaveBeenCalled();
    });
  });
});
