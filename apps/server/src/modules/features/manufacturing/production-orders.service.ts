import { Injectable } from '@nestjs/common';
import { pooledDb } from '@/db';
import { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import { WarehousesRepository } from '../inventory/warehouses.repository';
import { WarehouseNotFoundException } from '../inventory/inventory.exception';
import { ReservationsService } from '../inventory/reservations.service';
import {
  MANUFACTURING_DEFAULT_PAGE,
  MANUFACTURING_DEFAULT_PAGE_SIZE,
  PRODUCTION_ORDER_CODE_PREFIX,
} from '@rona/config/manufacturing';
import type {
  PaginatedResult,
  ProductionOrderCreateInput,
  ProductionOrderListParams,
  ProductionOrderListSearchParamsSchema,
} from '@rona/types/manufacturing';
import {
  ProductionOrderInvalidStatusException,
  ProductionOrderNotFoundException,
  ProductionOrderNumberConflictException,
} from './manufacturing.exception';
import { BomsRepository } from './boms.repository';
import { BomsService } from './boms.service';
import { ProductionMathService } from './production-math.service';
import { ProductionBatchesRepository } from './production-batches.repository';
import { ProductionOrdersRepository } from './production-orders.repository';
import type { OrderMaterialInsert } from './production-orders.repository';

@Injectable()
export class ProductionOrdersService {
  constructor(
    private readonly ordersRepository: ProductionOrdersRepository,
    private readonly batchesRepository: ProductionBatchesRepository,
    private readonly bomsRepository: BomsRepository,
    private readonly bomsService: BomsService,
    private readonly reservationsService: ReservationsService,
    private readonly math: ProductionMathService,
    private readonly warehousesRepository: WarehousesRepository,
    private readonly auditService: AuditService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async createOrder(input: ProductionOrderCreateInput) {
    const bom = await this.bomsService.getBom(input.bomId);
    if (!bom.isActive) {
      throw new ProductionOrderInvalidStatusException(
        'BOM is inactive and cannot be used for production orders',
      );
    }

    const warehouse = await this.warehousesRepository.findById(
      input.warehouseId,
    );
    if (!warehouse) throw new WarehouseNotFoundException();

    const orderNumber = input.orderNumber ?? this.generateOrderNumber();
    const existing = await this.ordersRepository.findByOrderNumber(orderNumber);
    if (existing) throw new ProductionOrderNumberConflictException();

    const expectedQuantity = input.expectedYieldPercent
      ? this.math.calculateExpectedQuantity(
          input.plannedQuantity,
          input.expectedYieldPercent,
        )
      : null;

    const order = await this.ordersRepository.create({
      orderNumber,
      bomId: input.bomId,
      itemId: bom.itemId,
      warehouseId: input.warehouseId,
      plannedQuantity: input.plannedQuantity,
      expectedYieldPercent: input.expectedYieldPercent ?? null,
      expectedQuantity,
      plannedStartDate: input.plannedStartDate ?? null,
      plannedEndDate: input.plannedEndDate ?? null,
      notes: input.notes ?? null,
    });

    await this.auditService.record({
      organizationId: this.tenantContext.organizationId,
      action: 'manufacturing.production_order.create',
      entityType: 'production_order',
      entityId: order.id,
      after: {
        orderNumber,
        bomId: input.bomId,
        plannedQuantity: input.plannedQuantity,
      },
    });

    return order;
  }

  async getOrder(orderId: string) {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) throw new ProductionOrderNotFoundException();
    return order;
  }

  async listOrders(
    params: ProductionOrderListSearchParamsSchema,
  ): Promise<PaginatedResult<unknown>> {
    const resolved: ProductionOrderListParams = {
      ...params,
      page: params.page ?? MANUFACTURING_DEFAULT_PAGE,
      limit: params.limit ?? MANUFACTURING_DEFAULT_PAGE_SIZE,
    };
    const { rows, total } = await this.ordersRepository.list(resolved);
    return {
      data: rows,
      pagination: {
        page: resolved.page,
        limit: resolved.limit,
        totalItems: total,
        totalPages: Math.ceil(total / resolved.limit),
      },
    };
  }

  async getOrderMaterials(orderId: string) {
    await this.getOrder(orderId);
    return this.ordersRepository.findMaterials(orderId);
  }

  async approveOrder(orderId: string) {
    return pooledDb.transaction(async (tx) => {
      const order = await this.ordersRepository.findByIdForUpdate(orderId, tx);
      if (!order) throw new ProductionOrderNotFoundException();
      if (!['DRAFT', 'PLANNED'].includes(order.status)) {
        throw new ProductionOrderInvalidStatusException(
          `Only DRAFT or PLANNED orders can be approved (current: ${order.status})`,
        );
      }

      const version =
        await this.bomsService.resolveApprovedVersionForProduction(
          order.bomId,
          tx,
        );
      const lines = await this.bomsRepository.findLinesByVersion(version.id);

      const materials: OrderMaterialInsert[] = [];
      for (const line of lines) {
        const requiredQuantity = this.math.calculateRequiredQuantity(
          line.quantityPerUnit,
          order.plannedQuantity,
        );
        const { reservation } =
          await this.reservationsService.createReservation(
            {
              itemId: line.componentItemId,
              warehouseId: order.warehouseId,
              quantity: requiredQuantity,
              reference: order.orderNumber,
            },
            tx,
          );
        materials.push({
          componentItemId: line.componentItemId,
          quantityPerUnit: line.quantityPerUnit,
          requiredQuantity,
          reservationId: reservation.id,
        });
      }

      await this.ordersRepository.createMaterials(orderId, materials, tx);

      const approved = await this.ordersRepository.update(
        orderId,
        {
          status: 'APPROVED',
          bomVersionId: version.id,
          approvedAt: new Date(),
          approvedBy: this.tenantContext.userId,
        },
        tx,
      );

      if (!version.isUsedInProduction) {
        await this.bomsRepository.updateVersion(
          version.id,
          { isUsedInProduction: true },
          tx,
        );
      }

      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'manufacturing.production_order.approve',
          entityType: 'production_order',
          entityId: orderId,
          before: { status: order.status },
          after: {
            status: 'APPROVED',
            bomVersionId: version.id,
            materials: materials.length,
          },
        },
        tx,
      );

      return approved;
    });
  }

  async startOrder(orderId: string) {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) throw new ProductionOrderNotFoundException();
    if (order.status !== 'APPROVED') {
      throw new ProductionOrderInvalidStatusException(
        `Only APPROVED orders can be started (current: ${order.status})`,
      );
    }

    const started = await this.ordersRepository.update(orderId, {
      status: 'IN_PROGRESS',
      startedAt: new Date(),
    });

    await this.auditService.record({
      organizationId: this.tenantContext.organizationId,
      action: 'manufacturing.production_order.start',
      entityType: 'production_order',
      entityId: orderId,
      before: { status: 'APPROVED' },
      after: { status: 'IN_PROGRESS' },
    });

    return started;
  }

  async completeOrder(orderId: string) {
    return pooledDb.transaction(async (tx) => {
      const order = await this.ordersRepository.findByIdForUpdate(orderId, tx);
      if (!order) throw new ProductionOrderNotFoundException();
      if (order.status !== 'IN_PROGRESS') {
        throw new ProductionOrderInvalidStatusException(
          `Only IN_PROGRESS orders can be completed (current: ${order.status})`,
        );
      }

      const openBatches = await this.batchesRepository.findOpenByOrder(
        orderId,
        tx,
      );
      for (const batch of openBatches) {
        await this.batchesRepository.update(
          batch.id,
          { status: 'COMPLETED', completedAt: new Date() },
          tx,
        );
      }

      const actualQuantity = await this.batchesRepository.sumOutputsByOrder(
        orderId,
        tx,
      );
      const actualYieldPercent = this.math.calculateActualYieldPercent(
        actualQuantity,
        order.plannedQuantity,
      );

      const materials = await this.ordersRepository.findMaterials(orderId);
      const materialVariance = materials.map((material) => ({
        componentItemId: material.componentItemId,
        requiredQuantity: material.requiredQuantity,
        consumedQuantity: material.consumedQuantity,
        varianceQuantity: this.math.calculateVarianceQuantity(
          material.consumedQuantity,
          material.requiredQuantity,
        ),
      }));

      for (const material of materials) {
        if (!material.reservationId) continue;
        await this.reservationsService.releaseReservation(
          material.reservationId,
          tx,
        );
      }

      const completed = await this.ordersRepository.update(
        orderId,
        {
          status: 'COMPLETED',
          completedAt: new Date(),
          actualQuantity,
          actualYieldPercent,
          materialVariance,
        },
        tx,
      );

      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'manufacturing.production_order.complete',
          entityType: 'production_order',
          entityId: orderId,
          before: { status: 'IN_PROGRESS' },
          after: {
            status: 'COMPLETED',
            actualQuantity,
            actualYieldPercent,
          },
        },
        tx,
      );

      return completed;
    });
  }

  async cancelOrder(orderId: string) {
    return pooledDb.transaction(async (tx) => {
      const order = await this.ordersRepository.findByIdForUpdate(orderId, tx);
      if (!order) throw new ProductionOrderNotFoundException();
      if (!['DRAFT', 'PLANNED', 'APPROVED'].includes(order.status)) {
        throw new ProductionOrderInvalidStatusException(
          `Orders in status ${order.status} cannot be cancelled`,
        );
      }

      const materials = await this.ordersRepository.findMaterials(orderId);
      for (const material of materials) {
        if (!material.reservationId) continue;
        await this.reservationsService.releaseReservation(
          material.reservationId,
          tx,
        );
      }

      const cancelled = await this.ordersRepository.update(
        orderId,
        { status: 'CANCELLED' },
        tx,
      );

      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'manufacturing.production_order.cancel',
          entityType: 'production_order',
          entityId: orderId,
          before: { status: order.status },
          after: { status: 'CANCELLED' },
        },
        tx,
      );

      return cancelled;
    });
  }

  private generateOrderNumber() {
    return `${PRODUCTION_ORDER_CODE_PREFIX}-${Date.now()}`;
  }
}
