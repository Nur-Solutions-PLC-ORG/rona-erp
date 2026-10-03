import { runWithRequestContext } from '@/context/request-context';
import { pooledDb } from '@/db';
import type { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import { LotNotFoundException } from '../inventory/inventory.exception';
import type { WarehousesRepository } from '../inventory/warehouses.repository';
import {
  InspectionNotFoundException,
  InspectionNumberConflictException,
  InspectionStatusException,
  InspectionTestNotFoundException,
  TestResultConflictException,
} from './quality.exception';
import type { InspectionsRepository } from './inspections.repository';
import { InspectionsService } from './inspections.service';

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

const USER_A = '11111111-1111-4111-8111-111111111111';
const ORG_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const MEMBERSHIP_A = '33333333-3333-4333-8333-333333333333';

const LOT_ID = 'lot-1';
const ITEM_ID = 'item-1';
const INSPECTION_ID = 'inspection-1';
const TEST_ID = 'test-1';

const LOT = {
  id: LOT_ID,
  organizationId: ORG_A,
  itemId: ITEM_ID,
  lotNumber: 'LOT-2026-001',
  qualityStatus: 'QUARANTINED',
};

const INSPECTION = {
  id: INSPECTION_ID,
  organizationId: ORG_A,
  inspectionNumber: 'INSP-2026-001',
  type: 'FINISHED_GOOD',
  lotId: LOT_ID,
  itemId: ITEM_ID,
  status: 'IN_PROGRESS',
  notes: null,
};

const repoCreate = jest.fn();
const repoFindById = jest.fn();
const repoFindByNumber = jest.fn();
const repoAddTest = jest.fn();
const repoFindTests = jest.fn();
const repoFindTestByInspectionAndId = jest.fn();
const repoAddResult = jest.fn();
const repoFindResultByTest = jest.fn();
const repoFindResultsByInspection = jest.fn();
const repoUpdate = jest.fn();
const inspectionsRepository = {
  create: repoCreate,
  findById: repoFindById,
  findByInspectionNumber: repoFindByNumber,
  addTest: repoAddTest,
  findTests: repoFindTests,
  findTestByInspectionAndId: repoFindTestByInspectionAndId,
  addResult: repoAddResult,
  findResultByTest: repoFindResultByTest,
  findResultsByInspection: repoFindResultsByInspection,
  update: repoUpdate,
} as unknown as InspectionsRepository;

const findLotById = jest.fn();
const warehousesRepository = {
  findLotById,
} as unknown as WarehousesRepository;

const auditRecord = jest.fn();
const auditService = { record: auditRecord } as unknown as AuditService;

const service = new InspectionsService(
  inspectionsRepository,
  warehousesRepository,
  auditService,
  new TenantContextService(),
);

const mockTx = { sentinel: 'tx' };

async function runInOrganizationA<T>(callback: () => Promise<T>): Promise<T> {
  return runWithRequestContext(
    {
      requestId: 'req-test',
      userId: USER_A,
      organizationId: ORG_A,
      membershipId: MEMBERSHIP_A,
      roles: ['QUALITY_OFFICER'],
      permissions: [],
    },
    callback,
  );
}

describe('InspectionsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (pooledDb.transaction as unknown as jest.Mock).mockImplementation(
      async (callback: (tx: unknown) => Promise<unknown>) => callback(mockTx),
    );

    findLotById.mockResolvedValue(LOT);
    repoFindByNumber.mockResolvedValue(undefined);
    repoFindById.mockResolvedValue(INSPECTION);
    repoCreate.mockResolvedValue(INSPECTION);
    repoAddTest.mockResolvedValue({
      id: TEST_ID,
      inspectionId: INSPECTION_ID,
      name: 'Net weight check',
    });
    repoFindTests.mockResolvedValue([
      { id: TEST_ID, name: 'Net weight check' },
    ]);
    repoFindTestByInspectionAndId.mockResolvedValue({
      id: TEST_ID,
      inspectionId: INSPECTION_ID,
    });
    repoFindResultByTest.mockResolvedValue(undefined);
    repoAddResult.mockResolvedValue({
      id: 'result-1',
      testId: TEST_ID,
      result: 'PASS',
    });
    repoFindResultsByInspection.mockResolvedValue([
      { id: 'result-1', testId: TEST_ID, result: 'PASS' },
    ]);
    repoUpdate.mockResolvedValue({
      ...INSPECTION,
      status: 'COMPLETED',
    });
    auditRecord.mockResolvedValue(undefined);
  });

  describe('createInspection', () => {
    it('creates an inspection for a quarantined lot and audits it', async () => {
      const result = await runInOrganizationA(() =>
        service.createInspection({
          lotId: LOT_ID,
          type: 'FINISHED_GOOD',
          inspectionNumber: 'INSP-2026-001',
        }),
      );

      expect(findLotById).toHaveBeenCalledWith(LOT_ID);
      expect(repoCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          inspectionNumber: 'INSP-2026-001',
          lotId: LOT_ID,
          itemId: ITEM_ID,
          performedBy: USER_A,
        }),
        mockTx,
      );
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'quality.inspection.create',
          entityType: 'inspection',
        }),
        mockTx,
      );
      expect(result).toEqual(INSPECTION);
    });

    it('rejects creation when the lot does not exist in the tenant', async () => {
      findLotById.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() =>
          service.createInspection({ lotId: 'forged-lot', type: 'INCOMING' }),
        ),
      ).rejects.toBeInstanceOf(LotNotFoundException);
      expect(repoCreate).not.toHaveBeenCalled();
    });

    it('rejects a duplicate inspection number with 409', async () => {
      repoFindByNumber.mockResolvedValue(INSPECTION);

      await expect(
        runInOrganizationA(() =>
          service.createInspection({
            lotId: LOT_ID,
            type: 'FINISHED_GOOD',
            inspectionNumber: 'INSP-2026-001',
          }),
        ),
      ).rejects.toBeInstanceOf(InspectionNumberConflictException);
    });
  });

  describe('addTest', () => {
    it('rejects tests on an inspection that is not in progress', async () => {
      repoFindById.mockResolvedValue({ ...INSPECTION, status: 'COMPLETED' });

      await expect(
        runInOrganizationA(() =>
          service.addTest(INSPECTION_ID, { name: 'Visual inspection' }),
        ),
      ).rejects.toBeInstanceOf(InspectionStatusException);
      expect(repoAddTest).not.toHaveBeenCalled();
    });

    it('returns 404 when the inspection belongs to another tenant', async () => {
      repoFindById.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() =>
          service.addTest('forged-inspection', { name: 'Visual inspection' }),
        ),
      ).rejects.toBeInstanceOf(InspectionNotFoundException);
    });
  });

  describe('recordResult', () => {
    it('records a result with the current user as performer', async () => {
      await runInOrganizationA(() =>
        service.recordResult(INSPECTION_ID, TEST_ID, {
          result: 'PASS',
          measuredValue: '712.5',
        }),
      );

      expect(repoAddResult).toHaveBeenCalledWith(
        expect.objectContaining({
          testId: TEST_ID,
          inspectionId: INSPECTION_ID,
          result: 'PASS',
          performedBy: USER_A,
        }),
        mockTx,
      );
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'quality.inspection.result.create',
        }),
        mockTx,
      );
    });

    it('rejects a second result for the same test with 409', async () => {
      repoFindResultByTest.mockResolvedValue({
        id: 'existing-result',
        testId: TEST_ID,
      });

      await expect(
        runInOrganizationA(() =>
          service.recordResult(INSPECTION_ID, TEST_ID, { result: 'PASS' }),
        ),
      ).rejects.toBeInstanceOf(TestResultConflictException);
    });

    it('returns 404 when the test does not belong to the inspection', async () => {
      repoFindTestByInspectionAndId.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() =>
          service.recordResult(INSPECTION_ID, 'forged-test', {
            result: 'PASS',
          }),
        ),
      ).rejects.toBeInstanceOf(InspectionTestNotFoundException);
    });
  });

  describe('completeInspection', () => {
    it('completes and computes a PASS aggregate when all tests passed', async () => {
      const result = await runInOrganizationA(() =>
        service.completeInspection(INSPECTION_ID, 'all good'),
      );

      expect(repoUpdate).toHaveBeenCalledWith(
        INSPECTION_ID,
        expect.objectContaining({ status: 'COMPLETED' }),
        mockTx,
      );
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'quality.inspection.complete',
          after: expect.objectContaining({
            aggregateResult: 'PASS',
          }) as Record<string, unknown>,
        }),
        mockTx,
      );
      expect(result.aggregateResult).toBe('PASS');
    });

    it('computes a FAIL aggregate when any test failed', async () => {
      repoFindTests.mockResolvedValue([
        { id: TEST_ID, name: 'Net weight check' },
        { id: 'test-2', name: 'Visual inspection' },
      ]);
      repoFindResultsByInspection.mockResolvedValue([
        { id: 'result-1', testId: TEST_ID, result: 'PASS' },
        { id: 'result-2', testId: 'test-2', result: 'FAIL' },
      ]);

      const result = await runInOrganizationA(() =>
        service.completeInspection(INSPECTION_ID),
      );

      expect(result.aggregateResult).toBe('FAIL');
    });

    it('refuses to complete when a test has no result', async () => {
      repoFindTests.mockResolvedValue([
        { id: TEST_ID, name: 'Net weight check' },
        { id: 'test-2', name: 'Visual inspection' },
      ]);
      repoFindResultsByInspection.mockResolvedValue([
        { id: 'result-1', testId: TEST_ID, result: 'PASS' },
      ]);

      await expect(
        runInOrganizationA(() => service.completeInspection(INSPECTION_ID)),
      ).rejects.toBeInstanceOf(InspectionStatusException);
      expect(repoUpdate).not.toHaveBeenCalled();
    });

    it('refuses to complete an inspection with no tests', async () => {
      repoFindTests.mockResolvedValue([]);

      await expect(
        runInOrganizationA(() => service.completeInspection(INSPECTION_ID)),
      ).rejects.toBeInstanceOf(InspectionStatusException);
    });
  });
});
