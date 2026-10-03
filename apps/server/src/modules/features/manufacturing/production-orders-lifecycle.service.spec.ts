import { runWithRequestContext } from '@/context/request-context';
import { pooledDb } from '@/db';
import type { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import type { WarehousesRepository } from '../inventory/warehouses.repository';
import type { ReservationsService } from '../inventory/reservations.service';
import {
  ProductionOrderInvalidStatusException,
  ProductionOrderNotFoundException,
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
const WAREHOUSE_ID = 'warehouse-1';
const ITEM_ID = 'item-fg';
const COMPONENT_ID = 'item-rm';

const IN_PROGRESS_ORDER = {
  id: ORDER_ID,
  organizationId: ORG_A,
  orderNumber: 'PO-2026-001',
  status: 'IN_PROGRESS',
  bomId: BOM_ID,
  itemId: ITEM_ID,
  warehouseId: WAREHOUSE_ID,
  plannedQuantity: '100',
};

const MATERIALS = [
  {
    id: 'material-1',
    componentItemId: COMPONENT_ID,
    requiredQuantity: '50.0000',
    consumedQuantity: '48.0000',
    returnedQuantity: '0.0000',
    reservationId: 'reservation-1',
  },
];

const ordersFindById = jest.fn();
const ordersFindByIdForUpdate = jest.fn();
const ordersUpdate = jest.fn();
const ordersFindMaterials = jest.fn();

const ordersRepository = {
  findById: ordersFindById,
  findByIdForUpdate: ordersFindByIdForUpdate,
  update: ordersUpdate,
  findMaterials: ordersFindMaterials,
} as unknown as ProductionOrdersRepository;

const findOpenByOrder = jest.fn();
const batchesUpdate = jest.fn();
const sumOutputsByOrder = jest.fn();

const batchesRepository = {
  findOpenByOrder,
  update: batchesUpdate,
  sumOutputsByOrder,
} as unknown as ProductionBatchesRepository;

const bomsRepository = {} as unknown as BomsRepository;
const bomsService = {} as unknown as BomsService;

const releaseReservation = jest.fn();
const reservationsService = {
  releaseReservation,
} as unknown as ReservationsService;

const warehousesRepository = {} as unknown as WarehousesRepository;

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

describe('ProductionOrdersService (complete & cancel)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (pooledDb.transaction as unknown as jest.Mock).mockImplementation(
      async (callback: (tx: unknown) => Promise<unknown>) => callback(mockTx),
    );

    ordersFindById.mockResolvedValue(IN_PROGRESS_ORDER);
    ordersFindByIdForUpdate.mockResolvedValue(IN_PROGRESS_ORDER);
    ordersUpdate.mockResolvedValue({
      ...IN_PROGRESS_ORDER,
      status: 'COMPLETED',
    });
    ordersFindMaterials.mockResolvedValue(MATERIALS);
    findOpenByOrder.mockResolvedValue([]);
    sumOutputsByOrder.mockResolvedValue('95.0000');
    releaseReservation.mockResolvedValue(undefined);
    auditRecord.mockResolvedValue(undefined);
  });

  describe('startOrder', () => {
    it('transitions APPROVED to IN_PROGRESS and audits it', async () => {
      ordersFindById.mockResolvedValue({
        ...IN_PROGRESS_ORDER,
        status: 'APPROVED',
      });
      ordersUpdate.mockResolvedValue({
        ...IN_PROGRESS_ORDER,
        status: 'IN_PROGRESS',
      });

      await runInOrganizationA(() => service.startOrder(ORDER_ID));

      expect(ordersUpdate).toHaveBeenCalledWith(ORDER_ID, {
        status: 'IN_PROGRESS',
        startedAt: expect.any(Date) as Date,
      });
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'manufacturing.production_order.start',
          before: { status: 'APPROVED' },
          after: { status: 'IN_PROGRESS' },
        }),
      );
    });

    it('rejects starting an order that is not APPROVED', async () => {
      ordersFindById.mockResolvedValue(IN_PROGRESS_ORDER);

      await expect(
        runInOrganizationA(() => service.startOrder(ORDER_ID)),
      ).rejects.toBeInstanceOf(ProductionOrderInvalidStatusException);
    });
  });

  describe('completeOrder', () => {
    it('completes open batches, computes yield/variance and releases reservations atomically', async () => {
      const openBatch = { id: 'batch-1', status: 'IN_PROGRESS' };
      findOpenByOrder.mockResolvedValue([openBatch]);

      const result = await runInOrganizationA(() =>
        service.completeOrder(ORDER_ID),
      );

      expect(batchesUpdate).toHaveBeenCalledWith(
        'batch-1',
        { status: 'COMPLETED', completedAt: expect.any(Date) as Date },
        mockTx,
      );
      expect(sumOutputsByOrder).toHaveBeenCalledWith(ORDER_ID, mockTx);
      expect(ordersUpdate).toHaveBeenCalledWith(
        ORDER_ID,
        expect.objectContaining({
          status: 'COMPLETED',
          actualQuantity: '95.0000',
          actualYieldPercent: '95.0000',
          materialVariance: [
            {
              componentItemId: COMPONENT_ID,
              requiredQuantity: '50.0000',
              consumedQuantity: '48.0000',
              varianceQuantity: '-2.0000',
            },
          ],
        }),
        mockTx,
      );
      expect(releaseReservation).toHaveBeenCalledWith('reservation-1', mockTx);
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'manufacturing.production_order.complete',
          after: expect.objectContaining({
            status: 'COMPLETED',
            actualQuantity: '95.0000',
          }) as Record<string, unknown>,
        }),
        mockTx,
      );
      expect(result.status).toBe('COMPLETED');
    });

    it('rejects completing an order that is not IN_PROGRESS', async () => {
      ordersFindByIdForUpdate.mockResolvedValue({
        ...IN_PROGRESS_ORDER,
        status: 'APPROVED',
      });

      await expect(
        runInOrganizationA(() => service.completeOrder(ORDER_ID)),
      ).rejects.toBeInstanceOf(ProductionOrderInvalidStatusException);
      expect(releaseReservation).not.toHaveBeenCalled();
    });

    it('throws ProductionOrderNotFoundException for an order outside the organization', async () => {
      ordersFindByIdForUpdate.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() => service.completeOrder('order-other-org')),
      ).rejects.toBeInstanceOf(ProductionOrderNotFoundException);
    });
  });

  describe('cancelOrder', () => {
    it('releases reservations and cancels the order atomically', async () => {
      ordersFindByIdForUpdate.mockResolvedValue({
        ...IN_PROGRESS_ORDER,
        status: 'APPROVED',
      });
      ordersUpdate.mockResolvedValue({
        ...IN_PROGRESS_ORDER,
        status: 'CANCELLED',
      });

      await runInOrganizationA(() => service.cancelOrder(ORDER_ID));

      expect(releaseReservation).toHaveBeenCalledWith('reservation-1', mockTx);
      expect(ordersUpdate).toHaveBeenCalledWith(
        ORDER_ID,
        { status: 'CANCELLED' },
        mockTx,
      );
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'manufacturing.production_order.cancel',
          before: { status: 'APPROVED' },
          after: { status: 'CANCELLED' },
        }),
        mockTx,
      );
    });

    it('rejects cancelling an IN_PROGRESS order', async () => {
      ordersFindByIdForUpdate.mockResolvedValue(IN_PROGRESS_ORDER);

      await expect(
        runInOrganizationA(() => service.cancelOrder(ORDER_ID)),
      ).rejects.toBeInstanceOf(ProductionOrderInvalidStatusException);
      expect(releaseReservation).not.toHaveBeenCalled();
    });
  });
});
