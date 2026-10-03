import { runWithRequestContext } from '@/context/request-context';
import { pooledDb } from '@/db';
import type { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import type { ItemsRepository } from '../inventory/items.repository';
import {
  BomDraftVersionExistsException,
  BomInactiveException,
  BomNoApprovedVersionException,
  BomNotFoundException,
  BomVersionAlreadyApprovedException,
  BomVersionImmutableException,
  BomVersionNotApprovedException,
  BomVersionNotDraftException,
  BomVersionNotFoundException,
} from './manufacturing.exception';
import type { BomsRepository } from './boms.repository';
import { BomsService } from './boms.service';

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

const BOM_ID = 'bom-1';
const VERSION_ID = 'version-1';
const ITEM_ID = 'item-fg';

const LINES = [{ componentItemId: 'item-rm', quantityPerUnit: '0.5' }];

const BOM = {
  id: BOM_ID,
  organizationId: ORG_A,
  code: 'BOM-BREAD',
  name: 'Bread BOM',
  itemId: ITEM_ID,
  isActive: true,
};

const VERSION = {
  id: VERSION_ID,
  organizationId: ORG_A,
  bomId: BOM_ID,
  version: '1',
  status: 'DRAFT',
  isUsedInProduction: false,
};

const findById = jest.fn();
const createVersion = jest.fn();
const findVersionById = jest.fn();
const findVersionByIdForUpdate = jest.fn();
const findApprovedVersion = jest.fn();
const findDraftVersion = jest.fn();
const findMaxVersion = jest.fn();
const updateVersion = jest.fn();
const findLinesByVersion = jest.fn();
const createLines = jest.fn();
const deleteLines = jest.fn();

const bomsRepository = {
  findById,
  createVersion,
  findVersionById,
  findVersionByIdForUpdate,
  findApprovedVersion,
  findDraftVersion,
  findMaxVersion,
  updateVersion,
  findLinesByVersion,
  createLines,
  deleteLines,
} as unknown as BomsRepository;

const itemsRepository = {} as unknown as ItemsRepository;
const auditRecord = jest.fn();
const auditService = { record: auditRecord } as unknown as AuditService;

const service = new BomsService(
  bomsRepository,
  itemsRepository,
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
      roles: ['PRODUCTION_MANAGER'],
      permissions: [],
    },
    callback,
  );
}

describe('BomsService (version lifecycle)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (pooledDb.transaction as unknown as jest.Mock).mockImplementation(
      async (callback: (tx: unknown) => Promise<unknown>) => callback(mockTx),
    );

    findById.mockResolvedValue(BOM);
    createVersion.mockResolvedValue(VERSION);
    findVersionById.mockResolvedValue(VERSION);
    findVersionByIdForUpdate.mockResolvedValue(VERSION);
    findApprovedVersion.mockResolvedValue(undefined);
    findDraftVersion.mockResolvedValue(undefined);
    findMaxVersion.mockResolvedValue('1');
    updateVersion.mockResolvedValue(VERSION);
    findLinesByVersion.mockResolvedValue(LINES);
    createLines.mockResolvedValue(LINES);
    deleteLines.mockResolvedValue(undefined);
    auditRecord.mockResolvedValue(undefined);
  });

  describe('createDraftVersion', () => {
    it('creates the next version number in a transaction', async () => {
      await runInOrganizationA(() =>
        service.createDraftVersion(BOM_ID, { lines: LINES }),
      );

      expect(findMaxVersion).toHaveBeenCalledWith(BOM_ID);
      expect(createVersion).toHaveBeenCalledWith(
        { bomId: BOM_ID, version: '2' },
        mockTx,
      );
      expect(createLines).toHaveBeenCalledWith(
        VERSION_ID,
        expect.any(Array),
        mockTx,
      );
    });

    it('refuses when a DRAFT version already exists', async () => {
      findDraftVersion.mockResolvedValue(VERSION);

      await expect(
        runInOrganizationA(() =>
          service.createDraftVersion(BOM_ID, { lines: LINES }),
        ),
      ).rejects.toBeInstanceOf(BomDraftVersionExistsException);
    });
  });

  describe('approveVersion', () => {
    it('transitions DRAFT to APPROVED and audits the approval', async () => {
      updateVersion.mockResolvedValue({ ...VERSION, status: 'APPROVED' });

      await runInOrganizationA(() => service.approveVersion(VERSION_ID));

      expect(updateVersion).toHaveBeenCalledWith(
        VERSION_ID,
        expect.objectContaining({
          status: 'APPROVED',
          approvedBy: USER_A,
        }),
        mockTx,
      );
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'manufacturing.bom.version.approve',
          before: expect.objectContaining({ status: 'DRAFT' }) as Record<
            string,
            unknown
          >,
          after: expect.objectContaining({ status: 'APPROVED' }) as Record<
            string,
            unknown
          >,
        }),
        mockTx,
      );
    });

    it('retires the previous APPROVED version when it is unused', async () => {
      const previous = { ...VERSION, id: 'version-0', status: 'APPROVED' };
      findApprovedVersion.mockResolvedValue(previous);

      await runInOrganizationA(() => service.approveVersion(VERSION_ID));

      expect(updateVersion).toHaveBeenCalledWith(
        'version-0',
        { status: 'RETIRED' },
        mockTx,
      );
    });

    it('keeps a used APPROVED version APPROVED for traceability', async () => {
      const previous = {
        ...VERSION,
        id: 'version-0',
        status: 'APPROVED',
        isUsedInProduction: true,
      };
      findApprovedVersion.mockResolvedValue(previous);

      await runInOrganizationA(() => service.approveVersion(VERSION_ID));

      expect(updateVersion).not.toHaveBeenCalledWith(
        'version-0',
        expect.anything(),
        mockTx,
      );
    });

    it('rejects approving a version that is already APPROVED', async () => {
      findVersionByIdForUpdate.mockResolvedValue({
        ...VERSION,
        status: 'APPROVED',
      });

      await expect(
        runInOrganizationA(() => service.approveVersion(VERSION_ID)),
      ).rejects.toBeInstanceOf(BomVersionAlreadyApprovedException);
    });
  });

  describe('updateDraftVersionLines', () => {
    it('replaces the lines of a DRAFT version and audits it', async () => {
      await runInOrganizationA(() =>
        service.updateDraftVersionLines(VERSION_ID, {
          lines: [{ componentItemId: 'item-alt', quantityPerUnit: '0.25' }],
        }),
      );

      expect(deleteLines).toHaveBeenCalledWith(VERSION_ID, mockTx);
      expect(createLines).toHaveBeenCalledWith(
        VERSION_ID,
        [
          {
            componentItemId: 'item-alt',
            quantityPerUnit: '0.25',
            notes: null,
          },
        ],
        mockTx,
      );
    });

    it('refuses to edit a non-DRAFT version', async () => {
      findVersionByIdForUpdate.mockResolvedValue({
        ...VERSION,
        status: 'APPROVED',
      });

      await expect(
        runInOrganizationA(() =>
          service.updateDraftVersionLines(VERSION_ID, { lines: LINES }),
        ),
      ).rejects.toBeInstanceOf(BomVersionNotDraftException);
    });

    it('refuses to edit a version that was used in production', async () => {
      findVersionByIdForUpdate.mockResolvedValue({
        ...VERSION,
        status: 'DRAFT',
        isUsedInProduction: true,
      });

      await expect(
        runInOrganizationA(() =>
          service.updateDraftVersionLines(VERSION_ID, { lines: LINES }),
        ),
      ).rejects.toBeInstanceOf(BomVersionImmutableException);
    });
  });

  describe('retireVersion', () => {
    it('refuses to retire a version used in production', async () => {
      findVersionByIdForUpdate.mockResolvedValue({
        ...VERSION,
        status: 'APPROVED',
        isUsedInProduction: true,
      });

      await expect(
        runInOrganizationA(() => service.retireVersion(VERSION_ID)),
      ).rejects.toBeInstanceOf(BomVersionImmutableException);
    });

    it('refuses to retire a version that is not APPROVED', async () => {
      findVersionByIdForUpdate.mockResolvedValue(VERSION);

      await expect(
        runInOrganizationA(() => service.retireVersion(VERSION_ID)),
      ).rejects.toBeInstanceOf(BomVersionNotApprovedException);
    });
  });

  describe('resolveApprovedVersionForProduction', () => {
    it('returns the APPROVED version of an active BOM', async () => {
      findApprovedVersion.mockResolvedValue({
        ...VERSION,
        status: 'APPROVED',
      });

      const version = await runInOrganizationA(() =>
        service.resolveApprovedVersionForProduction(BOM_ID),
      );

      expect(version.status).toBe('APPROVED');
    });

    it('refuses an inactive BOM', async () => {
      findById.mockResolvedValue({ ...BOM, isActive: false });

      await expect(
        runInOrganizationA(() =>
          service.resolveApprovedVersionForProduction(BOM_ID),
        ),
      ).rejects.toBeInstanceOf(BomInactiveException);
    });

    it('refuses a BOM without an APPROVED version', async () => {
      findApprovedVersion.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() =>
          service.resolveApprovedVersionForProduction(BOM_ID),
        ),
      ).rejects.toBeInstanceOf(BomNoApprovedVersionException);
    });

    it('refuses an unknown BOM', async () => {
      findById.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() =>
          service.resolveApprovedVersionForProduction('bom-other-org'),
        ),
      ).rejects.toBeInstanceOf(BomNotFoundException);
    });
  });

  describe('getVersion', () => {
    it('throws BomVersionNotFoundException for a version outside the organization', async () => {
      findVersionById.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() => service.getVersion('version-other-org')),
      ).rejects.toBeInstanceOf(BomVersionNotFoundException);
    });
  });
});
