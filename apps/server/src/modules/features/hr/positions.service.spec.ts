import {
  ARCHIVED_AT,
  DEPARTMENT_ID,
  ORG_A,
  POSITION,
  POSITION_ID,
  auditRecord,
  countEmployeesInPosition,
  defaultMocks,
  mockTx,
  repoArchivePosition,
  repoCreatePosition,
  repoFindDepartmentById,
  repoFindPositionByCode,
  repoFindPositionById,
  repoListPositions,
  repoRestorePosition,
  repoUpdatePosition,
  runInOrganizationA,
  service,
  setupTransactionMock,
} from './departments.spec-harness';
import {
  DepartmentNotFoundException,
  PositionArchivedException,
  PositionCodeConflictException,
  PositionInUseException,
  PositionNotFoundException,
  PositionNotArchivedException,
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

describe('DepartmentsService (positions)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
    defaultMocks();
  });

  describe('positions', () => {
    it('creates a position and audits it', async () => {
      const result = await runInOrganizationA(() =>
        service.createPosition({
          title: 'Supervisor',
          code: 'SUP',
          departmentId: DEPARTMENT_ID,
        }),
      );

      expect(repoFindPositionByCode).toHaveBeenCalledWith('SUP');
      expect(repoCreatePosition).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Supervisor',
          code: 'SUP',
          departmentId: DEPARTMENT_ID,
        }),
        mockTx,
      );
      const forwardedInput = repoCreatePosition.mock.calls[0][0] as Record<
        string,
        unknown
      >;
      expect('organizationId' in forwardedInput).toBe(false);

      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'hr.position.create',
          entityType: 'position',
          entityId: POSITION_ID,
          after: {
            title: 'Supervisor',
            code: 'SUP',
            departmentId: DEPARTMENT_ID,
          },
        }),
        mockTx,
      );
      expect(result).toEqual(POSITION);
    });

    it('rejects a position whose department is outside the tenant', async () => {
      repoFindDepartmentById.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() =>
          service.createPosition({
            title: 'Supervisor',
            code: 'SUP',
            departmentId: 'forged-department',
          }),
        ),
      ).rejects.toBeInstanceOf(DepartmentNotFoundException);
      expect(repoCreatePosition).not.toHaveBeenCalled();
    });

    it('rejects a duplicate code within the tenant', async () => {
      repoFindPositionByCode.mockResolvedValue(POSITION);

      await expect(
        runInOrganizationA(() =>
          service.createPosition({ title: 'Supervisor 2', code: 'SUP' }),
        ),
      ).rejects.toBeInstanceOf(PositionCodeConflictException);
      expect(repoCreatePosition).not.toHaveBeenCalled();
    });

    it('gets a position for the tenant', async () => {
      const result = await runInOrganizationA(() =>
        service.getPosition(POSITION_ID),
      );
      expect(result).toEqual(POSITION);
    });

    it('rejects a position outside the tenant', async () => {
      repoFindPositionById.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() => service.getPosition('forged-position')),
      ).rejects.toBeInstanceOf(PositionNotFoundException);
    });

    it('applies pagination defaults and wraps the repository result', async () => {
      const result = await runInOrganizationA(() => service.listPositions({}));

      expect(repoListPositions).toHaveBeenCalledWith(
        expect.objectContaining({
          page: expect.any(Number),
          limit: expect.any(Number),
        }),
      );
      expect(result.data).toEqual([POSITION]);
      expect(result.pagination.totalItems).toBe(1);
    });

    it('updates a position and audits before/after', async () => {
      repoUpdatePosition.mockResolvedValue({ ...POSITION, title: 'Line Lead' });

      const result = await runInOrganizationA(() =>
        service.updatePosition(POSITION_ID, { title: 'Line Lead' }),
      );

      expect(repoUpdatePosition).toHaveBeenCalledWith(
        POSITION_ID,
        { title: 'Line Lead' },
        mockTx,
      );
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'hr.position.update',
          entityType: 'position',
          entityId: POSITION_ID,
          before: expect.objectContaining({ title: 'Supervisor' }),
          after: expect.objectContaining({ title: 'Line Lead' }),
        }),
        mockTx,
      );
      expect(result.title).toBe('Line Lead');
    });

    it('rejects updating a position to a department outside the tenant', async () => {
      repoFindDepartmentById.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() =>
          service.updatePosition(POSITION_ID, {
            departmentId: 'forged-department',
          }),
        ),
      ).rejects.toBeInstanceOf(DepartmentNotFoundException);
      expect(repoUpdatePosition).not.toHaveBeenCalled();
    });
  });

  describe('position archive / restore', () => {
    it('archives a position with no active employees and audits it', async () => {
      await runInOrganizationA(() => service.archivePosition(POSITION_ID));

      expect(countEmployeesInPosition).toHaveBeenCalledWith(POSITION_ID);
      expect(repoArchivePosition).toHaveBeenCalledWith(POSITION_ID, mockTx);
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'hr.position.archive',
          entityType: 'position',
          entityId: POSITION_ID,
          before: { archivedAt: null },
          after: { archivedAt: expect.any(String) },
        }),
        mockTx,
      );
    });

    it('rejects archiving a position with active employees', async () => {
      countEmployeesInPosition.mockResolvedValue(3);

      await expect(
        runInOrganizationA(() => service.archivePosition(POSITION_ID)),
      ).rejects.toBeInstanceOf(PositionInUseException);
      expect(repoArchivePosition).not.toHaveBeenCalled();
      expect(auditRecord).not.toHaveBeenCalled();
    });

    it('rejects archiving an already archived position', async () => {
      repoFindPositionById.mockResolvedValue({
        ...POSITION,
        archivedAt: ARCHIVED_AT,
      });

      await expect(
        runInOrganizationA(() => service.archivePosition(POSITION_ID)),
      ).rejects.toBeInstanceOf(PositionArchivedException);
      expect(repoArchivePosition).not.toHaveBeenCalled();
    });

    it('restores an archived position and audits the transition', async () => {
      repoFindPositionById.mockResolvedValue({
        ...POSITION,
        archivedAt: ARCHIVED_AT,
      });

      await runInOrganizationA(() => service.restorePosition(POSITION_ID));

      expect(repoRestorePosition).toHaveBeenCalledWith(POSITION_ID, mockTx);
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'hr.position.restore',
          entityType: 'position',
          entityId: POSITION_ID,
          before: { archivedAt: ARCHIVED_AT.toISOString() },
          after: { archivedAt: null },
        }),
        mockTx,
      );
    });

    it('rejects restoring a position that is not archived', async () => {
      await expect(
        runInOrganizationA(() => service.restorePosition(POSITION_ID)),
      ).rejects.toBeInstanceOf(PositionNotArchivedException);
      expect(repoRestorePosition).not.toHaveBeenCalled();
    });
  });
});
