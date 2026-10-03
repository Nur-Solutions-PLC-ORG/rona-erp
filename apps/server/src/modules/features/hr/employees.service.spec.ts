import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';
import { db } from '@/db';
import { organizationMemberships } from '@/db/schemas/tenancy';
import { EmployeesRepository } from './employees.repository';
import {
  employeeCreateSchema,
  employeeUpdateSchema,
} from '@rona/validation/hr';
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
  repoIsActiveOrganizationMember,
  runInOrganizationA,
  setupTransactionMock,
} from './employees.spec-harness';

jest.mock('@/logger', () => ({
  logger: { child: jest.fn(() => ({ info: jest.fn() })) },
  childLogger: jest.fn(() => ({ info: jest.fn() })),
  generateRequestId: jest.fn(() => 'test-request-id'),
}));

jest.mock('@/db', () => ({
  db: { select: jest.fn() },
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

    it('creates an explicitly linked employee for an active organization member', async () => {
      const input = {
        eId: '10002',
        fullName: 'Dawit Haile',
        phone: '+251911000003',
        gender: 'M' as const,
        birthDate: '1992-07-20',
        userId: USER_A,
      };
      repoCreate.mockResolvedValue({ ...EMPLOYEE, userId: USER_A });

      await runInOrganizationA(() => employeesService.createEmployee(input));

      expect(repoIsActiveOrganizationMember).toHaveBeenCalledWith(USER_A);
      expect(repoCreate).toHaveBeenCalledWith(input, mockTx);
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          after: expect.objectContaining({ userId: USER_A }),
        }),
        mockTx,
      );
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

    it.each(['missing', 'other organization', 'invited', 'suspended'])(
      'rejects a userId with %s membership',
      async () => {
        repoIsActiveOrganizationMember.mockResolvedValue(false);

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
      },
    );

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

  describe('membership repository validation', () => {
    it.each([true, false])(
      'scopes the membership query and returns %s',
      async (exists) => {
        const limit = jest
          .fn()
          .mockResolvedValue(exists ? [{ id: 'membership' }] : []);
        const where = jest
          .fn<{ limit: typeof limit }, [SQL]>()
          .mockReturnValue({ limit });
        const from = jest.fn(() => ({ where }));
        jest
          .mocked(db.select)
          .mockReturnValue({ from } as unknown as ReturnType<typeof db.select>);

        const result = await runInOrganizationA(() =>
          new EmployeesRepository().isActiveOrganizationMember(USER_A),
        );

        expect(from).toHaveBeenCalledWith(organizationMemberships);
        const query = new PgDialect().sqlToQuery(where.mock.calls[0][0]);
        expect(query.sql).toContain(
          '"organization_memberships"."organization_id" =',
        );
        expect(query.sql).toContain('"organization_memberships"."user_id" =');
        expect(query.sql).toContain('"organization_memberships"."status" =');
        expect(query.params).toEqual([
          'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          USER_A,
          'active',
        ]);
        expect(limit).toHaveBeenCalledWith(1);
        expect(result).toBe(exists);
      },
    );
  });

  describe('employee input schemas', () => {
    it('strips retired passcode fields from create and update', () => {
      const created = employeeCreateSchema.parse({
        eId: '10002',
        fullName: 'Dawit Haile',
        phone: '+251911000003',
        gender: 'M',
        birthDate: '1992-07-20',
        userId: USER_A,
        passcode: '12345',
      });
      const updated = employeeUpdateSchema.parse({
        userId: null,
        passcode: '12345',
      });

      expect(created.userId).toBe(USER_A);
      expect(created).not.toHaveProperty('passcode');
      expect(updated).toEqual({ userId: null });
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
