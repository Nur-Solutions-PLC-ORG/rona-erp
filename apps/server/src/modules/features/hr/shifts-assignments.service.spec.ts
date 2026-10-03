import {
  ARCHIVED_AT,
  ASSIGNMENT,
  ASSIGNMENT_ID,
  EMPLOYEE,
  EMPLOYEE_ID,
  ORG_A,
  SHIFT_ID,
  auditRecord,
  defaultMocks,
  findEmployeeById,
  mockTx,
  repoAssignShift,
  repoEndAssignment,
  repoFindAssignmentById,
  repoFindOverlappingAssignment,
  repoFindShiftById,
  repoListAssignmentsForEmployee,
  runInOrganizationA,
  service,
  setupTransactionMock,
} from './shifts.spec-harness';
import {
  EmployeeArchivedException,
  EmployeeNotFoundException,
  EmployeeShiftConflictException,
  EmployeeShiftNotFoundException,
  ShiftNotFoundException,
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

describe('ShiftsService (assignments)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
    defaultMocks();
  });

  describe('assignShift', () => {
    it('assigns a shift to an employee and audits it', async () => {
      const result = await runInOrganizationA(() =>
        service.assignShift(EMPLOYEE_ID, {
          shiftId: SHIFT_ID,
          effectiveFrom: '2026-01-01',
        }),
      );

      expect(repoFindOverlappingAssignment).toHaveBeenCalledWith(
        EMPLOYEE_ID,
        '2026-01-01',
        undefined,
      );
      expect(repoAssignShift).toHaveBeenCalledWith(
        {
          shiftId: SHIFT_ID,
          effectiveFrom: '2026-01-01',
          employeeId: EMPLOYEE_ID,
        },
        mockTx,
      );
      const forwardedInput = repoAssignShift.mock.calls[0][0] as Record<
        string,
        unknown
      >;
      expect('organizationId' in forwardedInput).toBe(false);

      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'hr.shift.assign',
          entityType: 'employee_shift',
          entityId: ASSIGNMENT_ID,
          after: {
            employeeId: EMPLOYEE_ID,
            shiftId: SHIFT_ID,
            effectiveFrom: '2026-01-01',
            effectiveTo: null,
          },
        }),
        mockTx,
      );
      expect(result).toEqual(ASSIGNMENT);
    });

    it('rejects an overlapping assignment for the same employee', async () => {
      repoFindOverlappingAssignment.mockResolvedValue(ASSIGNMENT);

      await expect(
        runInOrganizationA(() =>
          service.assignShift(EMPLOYEE_ID, {
            shiftId: SHIFT_ID,
            effectiveFrom: '2026-02-01',
            effectiveTo: '2026-03-01',
          }),
        ),
      ).rejects.toBeInstanceOf(EmployeeShiftConflictException);
      expect(repoAssignShift).not.toHaveBeenCalled();
      expect(auditRecord).not.toHaveBeenCalled();
    });

    it('rejects an employee outside the tenant', async () => {
      findEmployeeById.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() =>
          service.assignShift('forged-employee', {
            shiftId: SHIFT_ID,
            effectiveFrom: '2026-01-01',
          }),
        ),
      ).rejects.toBeInstanceOf(EmployeeNotFoundException);
      expect(repoAssignShift).not.toHaveBeenCalled();
    });

    it('rejects an archived employee', async () => {
      findEmployeeById.mockResolvedValue({
        ...EMPLOYEE,
        archivedAt: ARCHIVED_AT,
      });

      await expect(
        runInOrganizationA(() =>
          service.assignShift(EMPLOYEE_ID, {
            shiftId: SHIFT_ID,
            effectiveFrom: '2026-01-01',
          }),
        ),
      ).rejects.toBeInstanceOf(EmployeeArchivedException);
      expect(repoAssignShift).not.toHaveBeenCalled();
    });

    it('rejects a shift outside the tenant', async () => {
      repoFindShiftById.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() =>
          service.assignShift(EMPLOYEE_ID, {
            shiftId: 'forged-shift',
            effectiveFrom: '2026-01-01',
          }),
        ),
      ).rejects.toBeInstanceOf(ShiftNotFoundException);
      expect(repoAssignShift).not.toHaveBeenCalled();
    });
  });

  describe('endAssignment', () => {
    it('ends an open assignment and audits before/after', async () => {
      const result = await runInOrganizationA(() =>
        service.endAssignment(EMPLOYEE_ID, ASSIGNMENT_ID, {
          effectiveTo: '2026-08-31',
        }),
      );

      expect(repoEndAssignment).toHaveBeenCalledWith(
        ASSIGNMENT_ID,
        '2026-08-31',
        mockTx,
      );
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'hr.shift.assign.end',
          entityType: 'employee_shift',
          entityId: ASSIGNMENT_ID,
          before: { effectiveTo: null },
          after: { effectiveTo: '2026-08-31' },
        }),
        mockTx,
      );
      expect(result.effectiveTo).toBe('2026-08-31');
    });

    it('rejects an assignment that does not exist in the tenant', async () => {
      repoFindAssignmentById.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() =>
          service.endAssignment(EMPLOYEE_ID, 'forged-assignment', {
            effectiveTo: '2026-08-31',
          }),
        ),
      ).rejects.toBeInstanceOf(EmployeeShiftNotFoundException);
      expect(repoEndAssignment).not.toHaveBeenCalled();
    });

    it('rejects an assignment belonging to a different employee', async () => {
      repoFindAssignmentById.mockResolvedValue({
        ...ASSIGNMENT,
        employeeId: 'employee-other',
      });

      await expect(
        runInOrganizationA(() =>
          service.endAssignment(EMPLOYEE_ID, ASSIGNMENT_ID, {
            effectiveTo: '2026-08-31',
          }),
        ),
      ).rejects.toBeInstanceOf(EmployeeShiftNotFoundException);
      expect(repoEndAssignment).not.toHaveBeenCalled();
    });

    it('rejects ending an already ended assignment', async () => {
      repoFindAssignmentById.mockResolvedValue({
        ...ASSIGNMENT,
        effectiveTo: '2026-06-30',
      });

      await expect(
        runInOrganizationA(() =>
          service.endAssignment(EMPLOYEE_ID, ASSIGNMENT_ID, {
            effectiveTo: '2026-08-31',
          }),
        ),
      ).rejects.toBeInstanceOf(EmployeeShiftConflictException);
      expect(repoEndAssignment).not.toHaveBeenCalled();
    });

    it('rejects an end date before the assignment start', async () => {
      await expect(
        runInOrganizationA(() =>
          service.endAssignment(EMPLOYEE_ID, ASSIGNMENT_ID, {
            effectiveTo: '2025-12-31',
          }),
        ),
      ).rejects.toBeInstanceOf(EmployeeShiftConflictException);
      expect(repoEndAssignment).not.toHaveBeenCalled();
    });
  });

  describe('listAssignments', () => {
    it('lists assignments for a tenant employee', async () => {
      const result = await runInOrganizationA(() =>
        service.listAssignments(EMPLOYEE_ID),
      );

      expect(repoListAssignmentsForEmployee).toHaveBeenCalledWith(EMPLOYEE_ID);
      expect(result).toEqual([ASSIGNMENT]);
    });

    it('rejects an employee outside the tenant', async () => {
      findEmployeeById.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() => service.listAssignments('forged-employee')),
      ).rejects.toBeInstanceOf(EmployeeNotFoundException);
    });
  });
});
