import { runWithRequestContext } from '@/context/request-context';
import {
  CLOCK_IN_AT,
  EMPLOYEE,
  EMPLOYEE_ID,
  MEMBERSHIP_A,
  ORG_A,
  USER_A,
  auditRecord,
  defaultMocks,
  findEmployeeByIdForUpdate,
  repoCreate,
  repoListEventsForEmployee,
  runInOrganizationA,
  service,
  setupTransactionMock,
} from './attendance.spec-harness';
import {
  AttendanceFutureEventException,
  AttendanceManagePermissionException,
  AttendanceSequenceConflictException,
  EmployeeArchivedException,
  EmployeeNotFoundException,
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

describe('AttendanceService (punch validation)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
    defaultMocks();
  });

  describe('punchManaged', () => {
    it('rejects a sequence that does not start with CLOCK_IN', async () => {
      repoListEventsForEmployee.mockResolvedValue([]);

      await expect(
        runInOrganizationA(() =>
          service.punchManaged({
            employeeId: EMPLOYEE_ID,
            eventType: 'CLOCK_OUT',
            eventAt: CLOCK_IN_AT,
          }),
        ),
      ).rejects.toBeInstanceOf(AttendanceSequenceConflictException);
      expect(repoCreate).not.toHaveBeenCalled();
      expect(auditRecord).not.toHaveBeenCalled();
    });

    it('rejects a second CLOCK_IN without an intervening CLOCK_OUT', async () => {
      repoListEventsForEmployee.mockResolvedValue([
        {
          id: 'event-1',
          employeeId: EMPLOYEE_ID,
          eventType: 'CLOCK_IN',
          eventAt: new Date('2026-09-01T08:00:00Z'),
        },
      ]);

      await expect(
        runInOrganizationA(() =>
          service.punchManaged({
            employeeId: EMPLOYEE_ID,
            eventType: 'CLOCK_IN',
            eventAt: new Date('2026-09-01T09:00:00Z'),
          }),
        ),
      ).rejects.toBeInstanceOf(AttendanceSequenceConflictException);
      expect(repoCreate).not.toHaveBeenCalled();
    });

    it('rejects BREAK_END directly after CLOCK_IN', async () => {
      repoListEventsForEmployee.mockResolvedValue([
        {
          id: 'event-1',
          employeeId: EMPLOYEE_ID,
          eventType: 'CLOCK_IN',
          eventAt: new Date('2026-09-01T08:00:00Z'),
        },
      ]);

      await expect(
        runInOrganizationA(() =>
          service.punchManaged({
            employeeId: EMPLOYEE_ID,
            eventType: 'BREAK_END',
            eventAt: new Date('2026-09-01T12:00:00Z'),
          }),
        ),
      ).rejects.toBeInstanceOf(AttendanceSequenceConflictException);
      expect(repoCreate).not.toHaveBeenCalled();
    });

    it('validates backdated events against the whole sequence', async () => {
      repoListEventsForEmployee.mockResolvedValue([
        {
          id: 'event-1',
          employeeId: EMPLOYEE_ID,
          eventType: 'CLOCK_IN',
          eventAt: new Date('2026-09-01T08:00:00Z'),
        },
        {
          id: 'event-2',
          employeeId: EMPLOYEE_ID,
          eventType: 'CLOCK_OUT',
          eventAt: new Date('2026-09-01T17:00:00Z'),
        },
      ]);

      await expect(
        runInOrganizationA(() =>
          service.punchManaged({
            employeeId: EMPLOYEE_ID,
            eventType: 'BREAK_START',
            eventAt: new Date('2026-09-01T12:00:00Z'),
          }),
        ),
      ).rejects.toBeInstanceOf(AttendanceSequenceConflictException);
      expect(repoCreate).not.toHaveBeenCalled();
    });

    it('rejects a backdated event that would precede the initial CLOCK_IN', async () => {
      repoListEventsForEmployee.mockResolvedValue([
        {
          id: 'event-1',
          employeeId: EMPLOYEE_ID,
          eventType: 'CLOCK_IN',
          eventAt: new Date('2026-09-01T08:00:00Z'),
        },
      ]);

      await expect(
        runInOrganizationA(() =>
          service.punchManaged({
            employeeId: EMPLOYEE_ID,
            eventType: 'BREAK_START',
            eventAt: new Date('2026-09-01T07:00:00Z'),
          }),
        ),
      ).rejects.toBeInstanceOf(AttendanceSequenceConflictException);
      expect(repoCreate).not.toHaveBeenCalled();
    });

    it('rejects a caller without hr.attendance.manage (defense in depth)', async () => {
      await expect(
        runWithRequestContext(
          {
            requestId: 'req-test',
            userId: USER_A,
            organizationId: ORG_A,
            membershipId: MEMBERSHIP_A,
            roles: ['EMPLOYEE'],
            permissions: ['hr.attendance.clock'],
          },
          () =>
            service.punchManaged({
              employeeId: EMPLOYEE_ID,
              eventType: 'CLOCK_IN',
              eventAt: CLOCK_IN_AT,
            }),
        ),
      ).rejects.toBeInstanceOf(AttendanceManagePermissionException);
      expect(findEmployeeByIdForUpdate).not.toHaveBeenCalled();
      expect(repoCreate).not.toHaveBeenCalled();
      expect(auditRecord).not.toHaveBeenCalled();
    });

    it('rejects future event times', async () => {
      await expect(
        runInOrganizationA(() =>
          service.punchManaged({
            employeeId: EMPLOYEE_ID,
            eventType: 'CLOCK_IN',
            eventAt: new Date(Date.now() + 60_000),
          }),
        ),
      ).rejects.toBeInstanceOf(AttendanceFutureEventException);
      expect(repoCreate).not.toHaveBeenCalled();
      expect(findEmployeeByIdForUpdate).not.toHaveBeenCalled();
    });

    it('rejects an employee that does not exist in the tenant', async () => {
      findEmployeeByIdForUpdate.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() =>
          service.punchManaged({
            employeeId: 'forged-employee',
            eventType: 'CLOCK_IN',
            eventAt: CLOCK_IN_AT,
          }),
        ),
      ).rejects.toBeInstanceOf(EmployeeNotFoundException);
      expect(repoCreate).not.toHaveBeenCalled();
    });

    it('rejects an archived employee', async () => {
      findEmployeeByIdForUpdate.mockResolvedValue({
        ...EMPLOYEE,
        archivedAt: new Date('2026-05-01T00:00:00Z'),
      });

      await expect(
        runInOrganizationA(() =>
          service.punchManaged({
            employeeId: EMPLOYEE_ID,
            eventType: 'CLOCK_IN',
            eventAt: CLOCK_IN_AT,
          }),
        ),
      ).rejects.toBeInstanceOf(EmployeeArchivedException);
      expect(repoCreate).not.toHaveBeenCalled();
    });
  });
});
