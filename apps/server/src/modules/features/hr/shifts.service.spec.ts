import {
  ORG_A,
  SHIFT,
  SHIFT_ID,
  auditRecord,
  defaultMocks,
  mockTx,
  repoCreateShift,
  repoFindShiftByCode,
  repoFindShiftById,
  repoListShifts,
  repoUpdateShift,
  runInOrganizationA,
  service,
  setupTransactionMock,
} from './shifts.spec-harness';
import {
  ShiftCodeConflictException,
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

describe('ShiftsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
    defaultMocks();
  });

  describe('createShift', () => {
    it('creates a shift and audits it', async () => {
      const result = await runInOrganizationA(() =>
        service.createShift({
          name: 'Morning',
          code: 'MORNING',
          startTime: '06:00',
          endTime: '14:00',
          breakMinutes: 30,
        }),
      );

      expect(repoFindShiftByCode).toHaveBeenCalledWith('MORNING');
      expect(repoCreateShift).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'MORNING',
          startTime: '06:00',
          endTime: '14:00',
        }),
        mockTx,
      );
      const forwardedInput = repoCreateShift.mock.calls[0][0] as Record<
        string,
        unknown
      >;
      expect('organizationId' in forwardedInput).toBe(false);

      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'hr.shift.create',
          entityType: 'shift',
          entityId: SHIFT_ID,
          after: {
            code: 'MORNING',
            name: 'Morning',
            startTime: '06:00',
            endTime: '14:00',
          },
        }),
        mockTx,
      );
      expect(result).toEqual(SHIFT);
    });

    it('rejects a duplicate code within the tenant', async () => {
      repoFindShiftByCode.mockResolvedValue(SHIFT);

      await expect(
        runInOrganizationA(() =>
          service.createShift({
            name: 'Another Morning',
            code: 'MORNING',
            startTime: '06:00',
            endTime: '14:00',
          }),
        ),
      ).rejects.toBeInstanceOf(ShiftCodeConflictException);
      expect(repoCreateShift).not.toHaveBeenCalled();
    });
  });

  describe('getShift / listShifts', () => {
    it('returns the shift for the tenant', async () => {
      const result = await runInOrganizationA(() => service.getShift(SHIFT_ID));
      expect(result).toEqual(SHIFT);
    });

    it('rejects a shift outside the tenant', async () => {
      repoFindShiftById.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() => service.getShift('forged-shift')),
      ).rejects.toBeInstanceOf(ShiftNotFoundException);
    });

    it('applies pagination defaults and wraps the repository result', async () => {
      const result = await runInOrganizationA(() => service.listShifts({}));

      expect(repoListShifts).toHaveBeenCalledWith(
        expect.objectContaining({
          page: expect.any(Number),
          limit: expect.any(Number),
        }),
      );
      expect(result.data).toEqual([SHIFT]);
      expect(result.pagination.totalItems).toBe(1);
    });
  });

  describe('updateShift', () => {
    it('updates a shift and audits before/after', async () => {
      repoUpdateShift.mockResolvedValue({ ...SHIFT, name: 'Early Morning' });

      const result = await runInOrganizationA(() =>
        service.updateShift(SHIFT_ID, { name: 'Early Morning' }),
      );

      expect(repoUpdateShift).toHaveBeenCalledWith(
        SHIFT_ID,
        { name: 'Early Morning' },
        mockTx,
      );
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'hr.shift.update',
          entityType: 'shift',
          entityId: SHIFT_ID,
          before: expect.objectContaining({ name: 'Morning' }),
          after: expect.objectContaining({ name: 'Early Morning' }),
        }),
        mockTx,
      );
      expect(result.name).toBe('Early Morning');
    });

    it('rejects updating to a code owned by another shift in the tenant', async () => {
      repoFindShiftByCode.mockResolvedValue({
        ...SHIFT,
        id: 'shift-other',
        code: 'NIGHT',
      });

      await expect(
        runInOrganizationA(() =>
          service.updateShift(SHIFT_ID, { code: 'NIGHT' }),
        ),
      ).rejects.toBeInstanceOf(ShiftCodeConflictException);
      expect(repoUpdateShift).not.toHaveBeenCalled();
    });

    it('allows keeping the same code', async () => {
      await runInOrganizationA(() =>
        service.updateShift(SHIFT_ID, { code: 'MORNING' }),
      );

      expect(repoUpdateShift).toHaveBeenCalledWith(
        SHIFT_ID,
        { code: 'MORNING' },
        mockTx,
      );
    });
  });
});
