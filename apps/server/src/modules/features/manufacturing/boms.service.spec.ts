import { runWithRequestContext } from '@/context/request-context';
import { pooledDb } from '@/db';
import type { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import type { ItemsRepository } from '../inventory/items.repository';
import { ItemNotFoundException } from '../inventory/inventory.exception';
import type { BomCreateInput } from '@rona/types/manufacturing';
import {
  BomCodeConflictException,
  BomNotFoundException,
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
const COMPONENT_ID = 'item-rm';

const LINES = [{ componentItemId: COMPONENT_ID, quantityPerUnit: '0.5' }];

const BOM = {
  id: BOM_ID,
  organizationId: ORG_A,
  code: 'BOM-BREAD',
  name: 'Bread BOM',
  description: null,
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

const findByCode = jest.fn();
const findById = jest.fn();
const create = jest.fn();
const update = jest.fn();
const list = jest.fn();
const createVersion = jest.fn();
const createLines = jest.fn();

const bomsRepository = {
  findByCode,
  findById,
  create,
  update,
  list,
  createVersion,
  createLines,
} as unknown as BomsRepository;

const itemsRepository = {
  findById: jest.fn(),
} as unknown as ItemsRepository;

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

describe('BomsService (header operations)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (pooledDb.transaction as unknown as jest.Mock).mockImplementation(
      async (callback: (tx: unknown) => Promise<unknown>) => callback(mockTx),
    );

    findByCode.mockResolvedValue(undefined);
    findById.mockResolvedValue(BOM);
    (itemsRepository.findById as jest.Mock).mockResolvedValue({ id: ITEM_ID });
    create.mockResolvedValue(BOM);
    update.mockResolvedValue(BOM);
    list.mockResolvedValue({ rows: [BOM], total: 1 });
    createVersion.mockResolvedValue(VERSION);
    createLines.mockResolvedValue(LINES);
    auditRecord.mockResolvedValue(undefined);
  });

  describe('createBom', () => {
    const input: BomCreateInput = {
      code: 'BOM-BREAD',
      name: 'Bread BOM',
      itemId: ITEM_ID,
      lines: LINES,
    };

    it('creates the BOM with a DRAFT version 1 and its lines in one transaction', async () => {
      const result = await runInOrganizationA(() => service.createBom(input));

      expect(create).toHaveBeenCalledWith(
        {
          code: 'BOM-BREAD',
          name: 'Bread BOM',
          description: null,
          itemId: ITEM_ID,
        },
        mockTx,
      );
      expect(createVersion).toHaveBeenCalledWith(
        { bomId: BOM_ID, version: '1' },
        mockTx,
      );
      expect(createLines).toHaveBeenCalledWith(
        VERSION_ID,
        [
          {
            componentItemId: COMPONENT_ID,
            quantityPerUnit: '0.5',
            notes: null,
          },
        ],
        mockTx,
      );
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'manufacturing.bom.create',
          entityType: 'bom',
          entityId: BOM_ID,
        }),
        mockTx,
      );
      expect(result.bom).toEqual(BOM);
    });

    it('rejects a duplicate BOM code', async () => {
      findByCode.mockResolvedValue(BOM);

      await expect(
        runInOrganizationA(() => service.createBom(input)),
      ).rejects.toBeInstanceOf(BomCodeConflictException);
      expect(create).not.toHaveBeenCalled();
    });

    it('rejects an unknown finished-good item', async () => {
      (itemsRepository.findById as jest.Mock).mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() => service.createBom(input)),
      ).rejects.toBeInstanceOf(ItemNotFoundException);
    });
  });

  describe('updateBom', () => {
    it('audits the header update with before/after', async () => {
      update.mockResolvedValue({ ...BOM, name: 'Renamed BOM' });

      await runInOrganizationA(() =>
        service.updateBom(BOM_ID, { name: 'Renamed BOM' }),
      );

      expect(update).toHaveBeenCalledWith(BOM_ID, { name: 'Renamed BOM' });
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'manufacturing.bom.update',
          before: { name: BOM.name, description: BOM.description },
        }),
      );
    });
  });

  describe('deactivateBom', () => {
    it('deactivates the BOM and audits the change', async () => {
      update.mockResolvedValue({ ...BOM, isActive: false });

      await runInOrganizationA(() => service.deactivateBom(BOM_ID));

      expect(update).toHaveBeenCalledWith(BOM_ID, { isActive: false });
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'manufacturing.bom.deactivate',
          before: { isActive: true },
          after: { isActive: false },
        }),
      );
    });
  });

  describe('queries', () => {
    it('resolves pagination defaults for the BOM list', async () => {
      const result = await runInOrganizationA(() => service.listBoms({}));

      expect(list).toHaveBeenCalledWith({ page: 1, limit: 25 });
      expect(result.pagination.totalItems).toBe(1);
    });

    it('throws BomNotFoundException for a BOM outside the organization', async () => {
      findById.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() => service.getBom('bom-other-org')),
      ).rejects.toBeInstanceOf(BomNotFoundException);
    });
  });
});
