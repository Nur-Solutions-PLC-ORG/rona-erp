import { runWithRequestContext } from '@/context/request-context';
import { pooledDb } from '@/db';
import type { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import type { WarehousesRepository } from '../inventory/warehouses.repository';
import type { DecisionsRepository } from './decisions.repository';
import {
  InspectionAlreadyReviewedException,
  InspectionNotFoundException,
  InspectionResultConflictException,
  InspectionStatusException,
  LotNotQuarantinedException,
} from './quality.exception';
import type { InspectionsRepository } from './inspections.repository';
import { QualityReviewsService } from './quality-reviews.service';

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
const INSPECTION_ID = 'inspection-1';

const COMPLETED_INSPECTION = {
  id: INSPECTION_ID,
  organizationId: ORG_A,
  inspectionNumber: 'INSP-2026-001',
  type: 'FINISHED_GOOD',
  lotId: LOT_ID,
  status: 'COMPLETED',
};

const QUARANTINED_LOT = {
  id: LOT_ID,
  organizationId: ORG_A,
  lotNumber: 'FG-LOT-2026-001',
  qualityStatus: 'QUARANTINED',
};

const findByIdForUpdate = jest.fn();
const findResultsByInspection = jest.fn();
const inspectionsUpdate = jest.fn();
const inspectionsRepository = {
  findByIdForUpdate,
  findResultsByInspection,
  update: inspectionsUpdate,
} as unknown as InspectionsRepository;

const findReviewByInspection = jest.fn();
const createReview = jest.fn();
const createReleaseDecision = jest.fn();
const decisionsRepository = {
  findReviewByInspection,
  createReview,
  createReleaseDecision,
} as unknown as DecisionsRepository;

const findLotById = jest.fn();
const updateLot = jest.fn();
const warehousesRepository = {
  findLotById,
  updateLot,
} as unknown as WarehousesRepository;

const auditRecord = jest.fn();
const auditService = { record: auditRecord } as unknown as AuditService;

const service = new QualityReviewsService(
  inspectionsRepository,
  decisionsRepository,
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
      roles: ['QUALITY_MANAGER'],
      permissions: [],
    },
    callback,
  );
}

describe('QualityReviewsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (pooledDb.transaction as unknown as jest.Mock).mockImplementation(
      async (callback: (tx: unknown) => Promise<unknown>) => callback(mockTx),
    );

    findByIdForUpdate.mockResolvedValue(COMPLETED_INSPECTION);
    findReviewByInspection.mockResolvedValue(undefined);
    findResultsByInspection.mockResolvedValue([
      { id: 'result-1', result: 'PASS' },
      { id: 'result-2', result: 'PASS' },
    ]);
    findLotById.mockResolvedValue(QUARANTINED_LOT);
    createReview.mockResolvedValue({
      id: 'review-1',
      inspectionId: INSPECTION_ID,
      decision: 'RELEASE',
    });
    updateLot.mockImplementation(
      async (lotId: string, data: { qualityStatus?: string }) => ({
        ...QUARANTINED_LOT,
        id: lotId,
        ...data,
      }),
    );
    createReleaseDecision.mockResolvedValue({
      id: 'decision-1',
      lotId: LOT_ID,
      decision: 'RELEASE',
    });
    inspectionsUpdate.mockResolvedValue({
      ...COMPLETED_INSPECTION,
      status: 'REVIEWED',
    });
    auditRecord.mockResolvedValue(undefined);
  });

  describe('release', () => {
    it('releases a quarantined lot when every test passed (PASS -> RELEASED)', async () => {
      const result = await runInOrganizationA(() =>
        service.release(INSPECTION_ID, 'approved'),
      );

      expect(findByIdForUpdate).toHaveBeenCalledWith(INSPECTION_ID, mockTx);
      expect(updateLot).toHaveBeenCalledWith(
        LOT_ID,
        { qualityStatus: 'RELEASED' },
        mockTx,
      );
      expect(createReview).toHaveBeenCalledWith(
        expect.objectContaining({
          inspectionId: INSPECTION_ID,
          decision: 'RELEASE',
          reviewedBy: USER_A,
        }),
        mockTx,
      );
      expect(createReleaseDecision).toHaveBeenCalledWith(
        expect.objectContaining({
          lotId: LOT_ID,
          inspectionId: INSPECTION_ID,
          decision: 'RELEASE',
          decidedBy: USER_A,
        }),
        mockTx,
      );
      expect(inspectionsUpdate).toHaveBeenCalledWith(
        INSPECTION_ID,
        expect.objectContaining({ status: 'REVIEWED' }),
        mockTx,
      );
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'quality.inspection.review',
          after: expect.objectContaining({
            decision: 'RELEASE',
            aggregateResult: 'PASS',
            lotQualityStatusBefore: 'QUARANTINED',
            lotQualityStatusAfter: 'RELEASED',
          }) as Record<string, unknown>,
        }),
        mockTx,
      );
      expect(result.lot.qualityStatus).toBe('RELEASED');
      expect(result.aggregateResult).toBe('PASS');
    });

    it('refuses to release when any test failed (FAIL aggregate, 422)', async () => {
      findResultsByInspection.mockResolvedValue([
        { id: 'result-1', result: 'PASS' },
        { id: 'result-2', result: 'FAIL' },
      ]);

      await expect(
        runInOrganizationA(() => service.release(INSPECTION_ID)),
      ).rejects.toBeInstanceOf(InspectionResultConflictException);
      expect(createReview).not.toHaveBeenCalled();
      expect(updateLot).not.toHaveBeenCalled();
      expect(createReleaseDecision).not.toHaveBeenCalled();
    });

    it('refuses to release a lot that is not quarantined (409)', async () => {
      findLotById.mockResolvedValue({
        ...QUARANTINED_LOT,
        qualityStatus: 'RELEASED',
      });

      await expect(
        runInOrganizationA(() => service.release(INSPECTION_ID)),
      ).rejects.toBeInstanceOf(LotNotQuarantinedException);
      expect(updateLot).not.toHaveBeenCalled();
    });

    it('refuses to review an inspection that is not completed (409)', async () => {
      findByIdForUpdate.mockResolvedValue({
        ...COMPLETED_INSPECTION,
        status: 'IN_PROGRESS',
      });

      await expect(
        runInOrganizationA(() => service.release(INSPECTION_ID)),
      ).rejects.toBeInstanceOf(InspectionStatusException);
    });

    it('refuses a second review of the same inspection (409)', async () => {
      findReviewByInspection.mockResolvedValue({
        id: 'review-existing',
        inspectionId: INSPECTION_ID,
      });

      await expect(
        runInOrganizationA(() => service.release(INSPECTION_ID)),
      ).rejects.toBeInstanceOf(InspectionAlreadyReviewedException);
      expect(updateLot).not.toHaveBeenCalled();
    });

    it('returns 404 when the inspection belongs to another tenant', async () => {
      findByIdForUpdate.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() => service.release('forged-inspection')),
      ).rejects.toBeInstanceOf(InspectionNotFoundException);
    });
  });

  describe('reject', () => {
    it('rejects a lot even when all tests passed (QA discretion)', async () => {
      const result = await runInOrganizationA(() =>
        service.reject(INSPECTION_ID, 'customer complaint'),
      );

      expect(updateLot).toHaveBeenCalledWith(
        LOT_ID,
        { qualityStatus: 'REJECTED' },
        mockTx,
      );
      expect(createReview).toHaveBeenCalledWith(
        expect.objectContaining({ decision: 'REJECT' }),
        mockTx,
      );
      expect(result.lot.qualityStatus).toBe('REJECTED');
    });

    it('rejects a lot with a FAIL aggregate (FAIL -> REJECTED)', async () => {
      findResultsByInspection.mockResolvedValue([
        { id: 'result-1', result: 'FAIL' },
      ]);

      const result = await runInOrganizationA(() =>
        service.reject(INSPECTION_ID),
      );

      expect(updateLot).toHaveBeenCalledWith(
        LOT_ID,
        { qualityStatus: 'REJECTED' },
        mockTx,
      );
      expect(result.aggregateResult).toBe('FAIL');
      expect(result.lot.qualityStatus).toBe('REJECTED');
    });
  });
});
