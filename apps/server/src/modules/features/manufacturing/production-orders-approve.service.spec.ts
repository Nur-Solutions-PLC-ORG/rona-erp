import { runWithRequestContext } from '@/context/request-context';
import { pooledDb } from '@/db';
import type { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import type { WarehousesRepository } from '../inventory/warehouses.repository';
import { WarehouseNotFoundException } from '../inventory/inventory.exception';
import type { ReservationsService } from '../inventory/reservations.service';
import type { ProductionOrderCreateInput } from '@rona/types/manufacturing';
import {
  ProductionOrderInvalidStatusException,
  ProductionOrderNotFoundException,
  ProductionOrderNumberConflictException,
} from './manufacturing.exception';
import type { BomsRepository } from './boms.repository';
import type { BomsService } from './boms.service';
import { ProductionMathService } from './production-math.service';
import type { ProductionBatchesRepository } from './production-batches.repository';
import type { ProductionOrdersRepository } from './production-orders.repository';
import { ProductionOrdersService } from './production-orders.service';

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

const ORDER_ID = 'order-1';
const BOM_ID = 'bom-1';
const VERSION_ID = 'version-1';
const WAREHOUSE_ID = 'warehouse-1';
const ITEM_ID = 'item-fg';
const COMPONENT_ID = 'item-rm';

const ORDER = {
  id: ORDER_ID,
  organizationId: ORG_A,
  orderNumber: 'PO-2026-001',
  status: 'DRAFT',
  bomId: BOM_ID,
  itemId: ITEM_ID,
  warehouseId: WAREHOUSE_ID,
  plannedQuantity: '100',
};

const BOM = {
  id: BOM_ID,
  organizationId: ORG_A,
  code: 'BOM-BREAD',
  name: 'Bread BOM',
  itemId: ITEM_ID,
  isActive: true,
};

const APPROVED_VERSION = {
  id: VERSION_ID,
  organizationId: ORG_A,
  bomId: BOM_ID,
  version: '1',
  status: 'APPROVED',
  isUsedInProduction: false,
};

const BOM_LINES = [
  { componentItemId: COMPONENT_ID, quantityPerUnit: '0.500000' },
];

const ordersCreate = jest.fn();
const ordersFindById = jest.fn();
const ordersFindByIdForUpdate = jest.fn();
const ordersFindByOrderNumber = jest.fn();
const ordersUpdate = jest.fn();
const ordersList = jest.fn();
const ordersFindMaterials = jest.fn();
const ordersCreateMaterials = jest.fn();

const ordersRepository = {
  create: ordersCreate,
  findById: ordersFindById,
  findByIdForUpdate: ordersFindByIdForUpdate,
  findByOrderNumber: ordersFindByOrderNumber,
  update: ordersUpdate,
  list: ordersList,
  findMaterials: ordersFindMaterials,
  createMaterials: ordersCreateMaterials,
} as unknown as ProductionOrdersRepository;

const batchesRepository = {} as unknown as ProductionBatchesRepository;

const bomsRepository = {
  findLinesByVersion: jest.fn(),
  updateVersion: jest.fn(),
} as unknown as BomsRepository;

const bomsService = {
  getBom: jest.fn(),
  resolveApprovedVersionForProduction: jest.fn(),
} as unknown as BomsService;

const reservationsService = {
  createReservation: jest.fn(),
  releaseReservation: jest.fn(),
} as unknown as ReservationsService;

const warehousesRepository = {
  findById: jest.fn(),
} as unknown as WarehousesRepository;

const auditRecord = jest.fn();
const auditService = { record: auditRecord } as unknown as AuditService;

const service = new ProductionOrdersService(
  ordersRepository,
  batchesRepository,
  bomsRepository,
  bomsService,
  reservationsService,
  new ProductionMathService(),
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
      roles: ['PRODUCTION_MANAGER'],
      permissions: [],
    },
    callback,
  );
}

describe('ProductionOrdersService (create & approve)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (pooledDb.transaction as unknown as jest.Mock).mockImplementation(
      async (callback: (tx: unknown) => Promise<unknown>) => callback(mockTx),
    );

    (bomsService.getBom as jest.Mock).mockResolvedValue(BOM);
    (warehousesRepository.findById as jest.Mock).mockResolvedValue({
      id: WAREHOUSE_ID,
    });
    ordersFindByOrderNumber.mockResolvedValue(undefined);
    ordersCreate.mockResolvedValue(ORDER);
    ordersFindById.mockResolvedValue(ORDER);
    ordersFindByIdForUpdate.mockResolvedValue(ORDER);
    ordersUpdate.mockResolvedValue({ ...ORDER, status: 'APPROVED' });
    ordersList.mockResolvedValue({ rows: [ORDER], total: 1 });
    ordersFindMaterials.mockResolvedValue([]);
    ordersCreateMaterials.mockResolvedValue(undefined);
    (
      bomsService.resolveApprovedVersionForProduction as jest.Mock
    ).mockResolvedValue(APPROVED_VERSION);
    (bomsRepository.findLinesByVersion as jest.Mock).mockResolvedValue(
      BOM_LINES,
    );
    (bomsRepository.updateVersion as jest.Mock).mockResolvedValue(
      APPROVED_VERSION,
    );
    (reservationsService.createReservation as jest.Mock).mockImplementation(
      async () => ({ reservation: { id: 'reservation-1' }, allocations: [] }),
    );
    auditRecord.mockResolvedValue(undefined);
  });

  describe('createOrder', () => {
    const input: ProductionOrderCreateInput = {
      bomId: BOM_ID,
      warehouseId: WAREHOUSE_ID,
      plannedQuantity: '100',
      orderNumber: 'PO-2026-001',
    };

    it('creates the order against an active BOM and a valid warehouse', async () => {
      const result = await runInOrganizationA(() => service.createOrder(input));

      expect(ordersCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          orderNumber: 'PO-2026-001',
          bomId: BOM_ID,
          itemId: ITEM_ID,
          plannedQuantity: '100',
        }),
      );
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'manufacturing.production_order.create',
        }),
      );
      expect(result).toEqual(ORDER);
    });

    it('computes the expected quantity from the yield percentage', async () => {
      await runInOrganizationA(() =>
        service.createOrder({
          ...input,
          expectedYieldPercent: '95',
        }),
      );

      expect(ordersCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          expectedYieldPercent: '95',
          expectedQuantity: '95.0000',
        }),
      );
    });

    it('rejects an inactive BOM', async () => {
      (bomsService.getBom as jest.Mock).mockResolvedValue({
        ...BOM,
        isActive: false,
      });

      await expect(
        runInOrganizationA(() => service.createOrder(input)),
      ).rejects.toBeInstanceOf(ProductionOrderInvalidStatusException);
      expect(ordersCreate).not.toHaveBeenCalled();
    });

    it('rejects an unknown warehouse', async () => {
      (warehousesRepository.findById as jest.Mock).mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() => service.createOrder(input)),
      ).rejects.toBeInstanceOf(WarehouseNotFoundException);
    });

    it('rejects a duplicate order number', async () => {
      ordersFindByOrderNumber.mockResolvedValue(ORDER);

      await expect(
        runInOrganizationA(() => service.createOrder(input)),
      ).rejects.toBeInstanceOf(ProductionOrderNumberConflictException);
    });

    it('throws ProductionOrderNotFoundException for an order outside the organization', async () => {
      ordersFindById.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() => service.getOrder('order-other-org')),
      ).rejects.toBeInstanceOf(ProductionOrderNotFoundException);
    });
  });

  describe('approveOrder', () => {
    it('freezes the approved BOM version, calculates materials and reserves components atomically', async () => {
      const result = await runInOrganizationA(() =>
        service.approveOrder(ORDER_ID),
      );

      expect(reservationsService.createReservation).toHaveBeenCalledWith(
        {
          itemId: COMPONENT_ID,
          warehouseId: WAREHOUSE_ID,
          quantity: '50.0000',
          reference: 'PO-2026-001',
        },
        mockTx,
      );
      expect(ordersCreateMaterials).toHaveBeenCalledWith(
        ORDER_ID,
        [
          {
            componentItemId: COMPONENT_ID,
            quantityPerUnit: '0.500000',
            requiredQuantity: '50.0000',
            reservationId: 'reservation-1',
          },
        ],
        mockTx,
      );
      expect(ordersUpdate).toHaveBeenCalledWith(
        ORDER_ID,
        expect.objectContaining({
          status: 'APPROVED',
          bomVersionId: VERSION_ID,
          approvedBy: USER_A,
        }),
        mockTx,
      );
      expect(bomsRepository.updateVersion).toHaveBeenCalledWith(
        VERSION_ID,
        { isUsedInProduction: true },
        mockTx,
      );
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'manufacturing.production_order.approve',
          entityType: 'production_order',
          entityId: ORDER_ID,
        }),
        mockTx,
      );
      expect(result.status).toBe('APPROVED');
    });

    it('rejects approving an order that is not DRAFT or PLANNED', async () => {
      ordersFindByIdForUpdate.mockResolvedValue({
        ...ORDER,
        status: 'COMPLETED',
      });

      await expect(
        runInOrganizationA(() => service.approveOrder(ORDER_ID)),
      ).rejects.toBeInstanceOf(ProductionOrderInvalidStatusException);
      expect(reservationsService.createReservation).not.toHaveBeenCalled();
    });
  });
});
