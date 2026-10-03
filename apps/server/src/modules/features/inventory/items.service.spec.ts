import { runWithRequestContext } from '@/context/request-context';
import { pooledDb } from '@/db';
import type { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import type { ItemCreateInput, ItemUpdateInput } from '@rona/types/inventory';
import type { ItemsRepository } from './items.repository';
import { ItemsService } from './items.service';
import {
  ItemArchivedException,
  ItemCodeConflictException,
  ItemNotFoundException,
  UnitOfMeasureNotFoundException,
} from './inventory.exception';

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
const ORG_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const MEMBERSHIP_A = '33333333-3333-4333-8333-333333333333';
const NOW = new Date('2026-01-01T00:00:00.000Z');

const findUnitOfMeasure = jest.fn();
const findByCode = jest.fn();
const findById = jest.fn();
const create = jest.fn();
const update = jest.fn();
const archive = jest.fn();
const list = jest.fn();
const createUnitOfMeasure = jest.fn();
const listUnitsOfMeasure = jest.fn();
const itemsRepository = {
  findUnitOfMeasure,
  findByCode,
  findById,
  create,
  update,
  archive,
  list,
  createUnitOfMeasure,
  listUnitsOfMeasure,
} as unknown as ItemsRepository;

const auditRecord = jest.fn();
const auditService = { record: auditRecord } as unknown as AuditService;

const service = new ItemsService(
  itemsRepository,
  auditService,
  new TenantContextService(),
);

const mockTx = { sentinel: 'tx' };

const UNIT = { id: 'uom-1', code: 'KG', name: 'Kilogram' };

const ITEM = {
  id: 'item-1',
  organizationId: ORG_A,
  code: 'RM-FLOUR',
  name: 'Flour',
  type: 'RAW_MATERIAL',
  unitOfMeasureId: 'uom-1',
  isArchived: false,
  createdAt: NOW,
  updatedAt: NOW,
};

const CREATE_INPUT: ItemCreateInput = {
  code: 'RM-FLOUR',
  name: 'Flour',
  type: 'RAW_MATERIAL',
  unitOfMeasureId: 'uom-1',
};

async function runInOrganizationA<T>(callback: () => Promise<T>): Promise<T> {
  return runWithRequestContext(
    {
      requestId: 'req-test',
      userId: USER_A,
      organizationId: ORG_A,
      membershipId: MEMBERSHIP_A,
      roles: ['WAREHOUSE_MANAGER'],
      permissions: [],
    },
    callback,
  );
}

describe('ItemsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (pooledDb.transaction as unknown as jest.Mock).mockImplementation(
      async (callback: (tx: unknown) => Promise<unknown>) => callback(mockTx),
    );

    findUnitOfMeasure.mockResolvedValue(UNIT);
    findByCode.mockResolvedValue(undefined);
    findById.mockResolvedValue(ITEM);
    create.mockResolvedValue(ITEM);
    update.mockResolvedValue(ITEM);
    archive.mockResolvedValue({ ...ITEM, isArchived: true });
    list.mockResolvedValue({ rows: [ITEM], total: 1 });
    createUnitOfMeasure.mockResolvedValue(UNIT);
    listUnitsOfMeasure.mockResolvedValue([UNIT]);
    auditRecord.mockResolvedValue(undefined);
  });

  describe('tenant isolation', () => {
    it('ignores a forged organizationId in the body and scopes the create to the tenant context', async () => {
      const forgedPayload = {
        ...CREATE_INPUT,
        organizationId: ORG_B,
      } as ItemCreateInput;

      await runInOrganizationA(() => service.createItem(forgedPayload));

      expect(create).toHaveBeenCalledWith(forgedPayload, mockTx);
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'inventory.item.create',
          entityType: 'item',
          entityId: ITEM.id,
        }),
        mockTx,
      );
    });

    it('returns only items visible to the current organization on read', async () => {
      await runInOrganizationA(() => service.getItem('item-1'));

      findById.mockResolvedValue(undefined);
      await expect(
        runInOrganizationA(() => service.getItem('item-other-org')),
      ).rejects.toBeInstanceOf(ItemNotFoundException);
    });
  });

  describe('createItem', () => {
    it('rejects an unknown unit of measure', async () => {
      findUnitOfMeasure.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() => service.createItem(CREATE_INPUT)),
      ).rejects.toBeInstanceOf(UnitOfMeasureNotFoundException);
    });

    it('rejects a duplicate item code within the organization', async () => {
      findByCode.mockResolvedValue(ITEM);

      await expect(
        runInOrganizationA(() => service.createItem(CREATE_INPUT)),
      ).rejects.toBeInstanceOf(ItemCodeConflictException);
    });
  });

  describe('updateItem', () => {
    it('rejects a code change to a code already used by another item', async () => {
      const input: ItemUpdateInput = { code: 'RM-SUGAR' };
      findByCode.mockResolvedValue({ ...ITEM, id: 'item-2' });

      await expect(
        runInOrganizationA(() => service.updateItem('item-1', input)),
      ).rejects.toBeInstanceOf(ItemCodeConflictException);
    });

    it('allows keeping the same code and audits before/after', async () => {
      const input: ItemUpdateInput = { code: 'RM-FLOUR', name: 'Wheat Flour' };
      findByCode.mockResolvedValue(ITEM);

      await runInOrganizationA(() => service.updateItem('item-1', input));

      expect(update).toHaveBeenCalledWith('item-1', input, mockTx);
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'inventory.item.update',
          entityType: 'item',
          entityId: 'item-1',
          before: { code: 'RM-FLOUR', name: 'Flour' },
        }),
        mockTx,
      );
    });

    it('rejects an unknown unit of measure on update', async () => {
      const input: ItemUpdateInput = { unitOfMeasureId: 'uom-unknown' };
      findUnitOfMeasure.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() => service.updateItem('item-1', input)),
      ).rejects.toBeInstanceOf(UnitOfMeasureNotFoundException);
    });
  });

  describe('archiveItem', () => {
    it('archives once and rejects double archive', async () => {
      await runInOrganizationA(() => service.archiveItem('item-1'));
      expect(archive).toHaveBeenCalledWith('item-1', mockTx);
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'inventory.item.archive',
          entityType: 'item',
          entityId: 'item-1',
          before: { isArchived: false },
          after: { isArchived: true },
        }),
        mockTx,
      );

      findById.mockResolvedValue({ ...ITEM, isArchived: true });
      await expect(
        runInOrganizationA(() => service.archiveItem('item-1')),
      ).rejects.toBeInstanceOf(ItemArchivedException);
    });
  });

  describe('createUnitOfMeasure', () => {
    it('creates the unit and audits it', async () => {
      await runInOrganizationA(() =>
        service.createUnitOfMeasure({ code: 'KG', name: 'Kilogram' }),
      );

      expect(createUnitOfMeasure).toHaveBeenCalledWith(
        { code: 'KG', name: 'Kilogram' },
        mockTx,
      );
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'inventory.uom.create',
          entityType: 'unit_of_measure',
          entityId: UNIT.id,
        }),
        mockTx,
      );
    });
  });

  describe('listItems', () => {
    it('resolves pagination defaults and computes pagination meta', async () => {
      const result = await runInOrganizationA(() =>
        service.listItems({ includeArchived: false }),
      );

      expect(list).toHaveBeenCalledWith({
        includeArchived: false,
        page: 1,
        limit: 25,
      });
      expect(result.pagination).toEqual({
        page: 1,
        limit: 25,
        totalItems: 1,
        totalPages: 1,
      });
    });
  });
});
