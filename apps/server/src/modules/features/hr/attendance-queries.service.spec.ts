import {
  EMPLOYEE_ID,
  attendanceRepository,
  defaultMocks,
  findEmployeeById,
  repoList,
  repoListEventsForEmployee,
  runInOrganizationA,
  service,
  setupTransactionMock,
} from './attendance.spec-harness';
import { EmployeeNotFoundException } from './hr.exception';

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

describe('AttendanceService (queries)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
    defaultMocks();
  });

  describe('status', () => {
    it('reports the current state from the last event', async () => {
      const lastEvent = {
        id: 'event-1',
        employeeId: EMPLOYEE_ID,
        eventType: 'BREAK_START',
        eventAt: new Date('2026-09-01T10:00:00Z'),
      };
      repoListEventsForEmployee.mockResolvedValue([lastEvent]);

      const status = await runInOrganizationA(() => service.getSelfStatus());

      expect(status).toEqual({
        employeeId: EMPLOYEE_ID,
        currentState: 'BREAK_START',
        lastEvent,
      });
    });

    it('reports state none when no events exist', async () => {
      repoListEventsForEmployee.mockResolvedValue([]);

      const status = await runInOrganizationA(() => service.getSelfStatus());

      expect(status.currentState).toBe('none');
      expect(status.lastEvent).toBeNull();
    });

    it('rejects status for an employee outside the tenant', async () => {
      findEmployeeById.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() =>
          service.getStatusForEmployee('forged-employee'),
        ),
      ).rejects.toBeInstanceOf(EmployeeNotFoundException);
    });
  });

  describe('listEvents', () => {
    it('applies pagination defaults and wraps the repository result', async () => {
      const event = {
        id: 'event-1',
        employeeId: EMPLOYEE_ID,
        eventType: 'CLOCK_IN',
        eventAt: new Date('2026-09-01T05:45:00Z'),
      };
      repoList.mockResolvedValue({ rows: [event], total: 1 });

      const result = await runInOrganizationA(() => service.listEvents({}));

      expect(repoList).toHaveBeenCalledWith(
        expect.objectContaining({
          page: expect.any(Number),
          limit: expect.any(Number),
        }),
      );
      expect(result.data).toEqual([event]);
      expect(result.pagination.totalItems).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });
  });

  describe('immutability', () => {
    it('offers no update or delete path for attendance events', () => {
      const methods = Object.keys(
        attendanceRepository as unknown as Record<string, unknown>,
      ).sort();
      expect(methods).toEqual(['create', 'list', 'listEventsForEmployee']);
    });
  });
});
