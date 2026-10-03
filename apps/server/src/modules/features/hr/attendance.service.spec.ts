import {
  CLOCK_IN_AT,
  EMPLOYEE_ID,
  ORG_A,
  USER_A,
  auditRecord,
  defaultMocks,
  findEmployeeByIdForUpdate,
  findEmployeeByUserId,
  mockTx,
  repoCreate,
  repoListEventsForEmployee,
  runInOrganizationA,
  service,
  setupTransactionMock,
} from './attendance.spec-harness';
import { EmployeeSelfNotFoundException } from './hr.exception';

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

describe('AttendanceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
    defaultMocks();
  });

  describe('punchManaged', () => {
    it('records a managed CLOCK_IN and audits it', async () => {
      const result = await runInOrganizationA(() =>
        service.punchManaged({
          employeeId: EMPLOYEE_ID,
          eventType: 'CLOCK_IN',
          eventAt: CLOCK_IN_AT,
          notes: 'Early shift',
        }),
      );

      expect(findEmployeeByIdForUpdate).toHaveBeenCalledWith(
        EMPLOYEE_ID,
        mockTx,
      );
      expect(repoCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: EMPLOYEE_ID,
          eventType: 'CLOCK_IN',
          eventAt: CLOCK_IN_AT,
          recordedBy: USER_A,
          notes: 'Early shift',
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
          organizationId: ORG_A,
          action: 'hr.attendance.record',
          entityType: 'attendance_event',
          entityId: 'event-1',
          after: {
            employeeId: EMPLOYEE_ID,
            eventType: 'CLOCK_IN',
            eventAt: CLOCK_IN_AT.toISOString(),
          },
        }),
        mockTx,
      );
      expect(result.id).toBe('event-1');
    });

    it('walks a full day cycle: CLOCK_IN, BREAK_START, BREAK_END, CLOCK_OUT', async () => {
      const history: Array<Record<string, unknown>> = [];
      repoListEventsForEmployee.mockImplementation(async () => [...history]);
      repoCreate.mockImplementation(async (data: Record<string, unknown>) => {
        const event = { id: `event-${history.length + 1}`, ...data };
        history.push(event);
        return event;
      });

      await runInOrganizationA(() =>
        service.punchManaged({
          employeeId: EMPLOYEE_ID,
          eventType: 'CLOCK_IN',
          eventAt: new Date('2026-09-01T05:45:00Z'),
        }),
      );
      await runInOrganizationA(() =>
        service.punchManaged({
          employeeId: EMPLOYEE_ID,
          eventType: 'BREAK_START',
          eventAt: new Date('2026-09-01T10:00:00Z'),
        }),
      );
      await runInOrganizationA(() =>
        service.punchManaged({
          employeeId: EMPLOYEE_ID,
          eventType: 'BREAK_END',
          eventAt: new Date('2026-09-01T10:30:00Z'),
        }),
      );
      await runInOrganizationA(() =>
        service.punchManaged({
          employeeId: EMPLOYEE_ID,
          eventType: 'CLOCK_OUT',
          eventAt: new Date('2026-09-01T14:15:00Z'),
        }),
      );

      expect(repoCreate).toHaveBeenCalledTimes(4);
      expect(auditRecord).toHaveBeenCalledTimes(4);

      const status = await runInOrganizationA(() =>
        service.getStatusForEmployee(EMPLOYEE_ID),
      );
      expect(status.currentState).toBe('CLOCK_OUT');
    });

    it('allows a new CLOCK_IN after CLOCK_OUT (next day)', async () => {
      repoListEventsForEmployee.mockResolvedValue([
        {
          id: 'event-1',
          employeeId: EMPLOYEE_ID,
          eventType: 'CLOCK_IN',
          eventAt: new Date('2026-09-01T05:45:00Z'),
        },
        {
          id: 'event-2',
          employeeId: EMPLOYEE_ID,
          eventType: 'CLOCK_OUT',
          eventAt: new Date('2026-09-01T14:15:00Z'),
        },
      ]);

      await runInOrganizationA(() =>
        service.punchManaged({
          employeeId: EMPLOYEE_ID,
          eventType: 'CLOCK_IN',
          eventAt: new Date('2026-09-02T05:40:00Z'),
        }),
      );

      expect(repoCreate).toHaveBeenCalledTimes(1);
    });
  });

  describe('punchSelf', () => {
    it('punches the employee linked to the authenticated user with the server clock', async () => {
      await runInOrganizationA(() =>
        service.punchSelf({ eventType: 'CLOCK_IN' }),
      );

      expect(findEmployeeByUserId).toHaveBeenCalledWith(USER_A);
      expect(findEmployeeByIdForUpdate).toHaveBeenCalledWith(
        EMPLOYEE_ID,
        mockTx,
      );
      expect(repoCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: EMPLOYEE_ID,
          eventType: 'CLOCK_IN',
          recordedBy: USER_A,
          eventAt: expect.any(Date),
        }),
        mockTx,
      );
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'hr.attendance.record',
          entityType: 'attendance_event',
        }),
        mockTx,
      );
    });

    it('rejects when no employee is linked to the user', async () => {
      findEmployeeByUserId.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() => service.punchSelf({ eventType: 'CLOCK_IN' })),
      ).rejects.toBeInstanceOf(EmployeeSelfNotFoundException);
      expect(repoCreate).not.toHaveBeenCalled();
    });
  });
});
