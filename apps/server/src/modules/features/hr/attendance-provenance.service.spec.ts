import {
  CLOCK_IN_AT,
  EMPLOYEE_ID,
  defaultMocks,
  mockTx,
  repoCreate,
  runInOrganizationA,
  service,
  setupTransactionMock,
} from './attendance.spec-harness';
import { allowedNextAttendanceEvents } from './attendance.service';

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

const KIOSK_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const CLIENT_EVENT_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

describe('AttendanceService provenance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
    defaultMocks();
  });

  it('records native terminal punches with kiosk, methods and idempotency key', async () => {
    const deviceEventAt = new Date(CLOCK_IN_AT.getTime() - 5_000);
    await runInOrganizationA(() =>
      service.punchDevice({
        employeeId: EMPLOYEE_ID,
        eventType: 'CLOCK_IN',
        eventAt: CLOCK_IN_AT,
        kioskId: KIOSK_ID,
        methods: ['CARD', 'FACE'],
        matchScore: 88,
        clientEventId: CLIENT_EVENT_ID,
        deviceEventAt,
      }),
    );

    expect(repoCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        employeeId: EMPLOYEE_ID,
        eventAt: CLOCK_IN_AT,
        source: 'KIOSK',
        kioskId: KIOSK_ID,
        methods: ['CARD', 'FACE'],
        matchScore: 88,
        clientEventId: CLIENT_EVENT_ID,
        deviceEventAt,
      }),
      mockTx,
    );
  });

  it('marks web kiosk punches with their verification method', async () => {
    await runInOrganizationA(() =>
      service.punchKiosk(EMPLOYEE_ID, 'CLOCK_IN', {
        kioskId: KIOSK_ID,
        methods: ['PASSCODE'],
      }),
    );
    expect(repoCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'KIOSK',
        kioskId: KIOSK_ID,
        methods: ['PASSCODE'],
        notes: 'Kiosk',
      }),
      mockTx,
    );
  });

  it('marks self punches as SELF', async () => {
    await runInOrganizationA(() =>
      service.punchSelf({ eventType: 'CLOCK_IN' }),
    );
    expect(repoCreate).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'SELF', kioskId: null, methods: null }),
      mockTx,
    );
  });

  it('lists the allowed next events for each state', () => {
    expect(allowedNextAttendanceEvents('none')).toEqual(['CLOCK_IN']);
    expect(allowedNextAttendanceEvents('CLOCK_IN')).toEqual([
      'BREAK_START',
      'CLOCK_OUT',
    ]);
    expect(allowedNextAttendanceEvents('BREAK_START')).toEqual(['BREAK_END']);
    expect(allowedNextAttendanceEvents('BREAK_END')).toEqual([
      'BREAK_START',
      'CLOCK_OUT',
    ]);
    expect(allowedNextAttendanceEvents('CLOCK_OUT')).toEqual(['CLOCK_IN']);
  });
});
