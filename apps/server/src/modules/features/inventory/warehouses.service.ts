import { Injectable } from '@nestjs/common';
import { pooledDb } from '@/db';
import { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import type {
  LotCreateInput,
  LotListParams,
  LotListSearchParamsSchema,
  LotQualityStatusUpdateSchema,
  PaginatedResult,
  WarehouseCreateInput,
  WarehouseListParams,
  WarehouseListSearchParamsSchema,
  WarehouseLocationCreateInput,
  WarehouseUpdateInput,
} from '@rona/types/inventory';
import {
  INVENTORY_DEFAULT_PAGE,
  INVENTORY_DEFAULT_PAGE_SIZE,
} from '@rona/config/inventory';
import {
  InvalidStockOperationException,
  ItemNotFoundException,
  LotNotFoundException,
  WarehouseCodeConflictException,
  WarehouseLocationCodeConflictException,
  WarehouseLocationNotFoundException,
  WarehouseNotFoundException,
} from './inventory.exception';
import { ItemsRepository } from './items.repository';
import { WarehousesRepository } from './warehouses.repository';

@Injectable()
export class WarehousesService {
  constructor(
    private readonly warehousesRepository: WarehousesRepository,
    private readonly itemsRepository: ItemsRepository,
    private readonly auditService: AuditService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async createWarehouse(input: WarehouseCreateInput) {
    const existing = await this.warehousesRepository.findByCode(input.code);
    if (existing) throw new WarehouseCodeConflictException();

    return pooledDb.transaction(async (tx) => {
      const created = await this.warehousesRepository.create(input, tx);
      await this.audit(
        'inventory.warehouse.create',
        'warehouse',
        created.id,
        undefined,
        { code: created.code, name: created.name },
        tx,
      );
      return created;
    });
  }

  async getWarehouse(warehouseId: string) {
    const warehouse = await this.warehousesRepository.findById(warehouseId);
    if (!warehouse) throw new WarehouseNotFoundException();
    return warehouse;
  }

  async updateWarehouse(warehouseId: string, input: WarehouseUpdateInput) {
    const warehouse = await this.warehousesRepository.findById(warehouseId);
    if (!warehouse) throw new WarehouseNotFoundException();

    return pooledDb.transaction(async (tx) => {
      const updated = await this.warehousesRepository.update(
        warehouseId,
        input,
        tx,
      );
      await this.audit(
        'inventory.warehouse.update',
        'warehouse',
        warehouseId,
        { name: warehouse.name, isActive: warehouse.isActive },
        { name: updated.name, isActive: updated.isActive },
        tx,
      );
      return updated;
    });
  }

  async listWarehouses(
    params: WarehouseListSearchParamsSchema,
  ): Promise<PaginatedResult<unknown>> {
    const resolved: WarehouseListParams = {
      ...params,
      page: params.page ?? INVENTORY_DEFAULT_PAGE,
      limit: params.limit ?? INVENTORY_DEFAULT_PAGE_SIZE,
    };
    const { rows, total } = await this.warehousesRepository.list(resolved);
    return this.toResult(rows, total, resolved);
  }

  async createLocation(input: WarehouseLocationCreateInput) {
    const { warehouseId, ...data } = input;
    const warehouse = await this.warehousesRepository.findById(warehouseId);
    if (!warehouse) throw new WarehouseNotFoundException();

    const existing = await this.warehousesRepository.findLocationByCode(
      warehouseId,
      data.code,
    );
    if (existing) throw new WarehouseLocationCodeConflictException();

    return pooledDb.transaction(async (tx) => {
      const created = await this.warehousesRepository.createLocation(
        warehouseId,
        data,
        tx,
      );
      await this.audit(
        'inventory.warehouse_location.create',
        'warehouse_location',
        created.id,
        undefined,
        { warehouseId, code: created.code, name: created.name },
        tx,
      );
      return created;
    });
  }

  async listLocations(warehouseId: string) {
    const warehouse = await this.warehousesRepository.findById(warehouseId);
    if (!warehouse) throw new WarehouseNotFoundException();
    return this.warehousesRepository.listLocations(warehouseId);
  }

  async getLocation(locationId: string) {
    const location =
      await this.warehousesRepository.findLocationById(locationId);
    if (!location) throw new WarehouseLocationNotFoundException();
    return location;
  }

  async createLot(input: LotCreateInput) {
    const { itemId, ...data } = input;
    const item = await this.itemsRepository.findById(itemId);
    if (!item) throw new ItemNotFoundException();

    const existing = await this.warehousesRepository.findLotByNumber(
      itemId,
      data.lotNumber,
    );
    if (existing) {
      throw new InvalidStockOperationException(
        `Lot ${data.lotNumber} already exists for this item`,
      );
    }

    return pooledDb.transaction(async (tx) => {
      const created = await this.warehousesRepository.createLot(
        itemId,
        data,
        tx,
      );
      await this.audit(
        'inventory.lot.create',
        'batch_lot',
        created.id,
        undefined,
        { itemId, lotNumber: created.lotNumber },
        tx,
      );
      return created;
    });
  }

  async getLot(lotId: string) {
    const lot = await this.warehousesRepository.findLotById(lotId);
    if (!lot) throw new LotNotFoundException();
    return lot;
  }

  async listLots(
    params: LotListSearchParamsSchema,
  ): Promise<PaginatedResult<unknown>> {
    const resolved: LotListParams = {
      ...params,
      page: params.page ?? INVENTORY_DEFAULT_PAGE,
      limit: params.limit ?? INVENTORY_DEFAULT_PAGE_SIZE,
    };
    const { rows, total } = await this.warehousesRepository.listLots(resolved);
    return this.toResult(rows, total, resolved);
  }

  async updateLotQualityStatus(
    lotId: string,
    input: LotQualityStatusUpdateSchema,
  ) {
    const lot = await this.warehousesRepository.findLotById(lotId);
    if (!lot) throw new LotNotFoundException();

    return pooledDb.transaction(async (tx) => {
      const updated = await this.warehousesRepository.updateLot(
        lotId,
        { qualityStatus: input.qualityStatus },
        tx,
      );
      await this.audit(
        'inventory.lot.quality_status.update',
        'batch_lot',
        lotId,
        { qualityStatus: lot.qualityStatus },
        { qualityStatus: updated.qualityStatus },
        tx,
      );
      return updated;
    });
  }

  private audit(
    action: string,
    entityType: string,
    entityId: string,
    before: Record<string, unknown> | undefined,
    after: Record<string, unknown> | undefined,
    tx?: Parameters<Parameters<typeof pooledDb.transaction>[0]>[0],
  ) {
    return this.auditService.record(
      {
        organizationId: this.tenantContext.organizationId,
        action,
        entityType,
        entityId,
        before,
        after,
      },
      tx,
    );
  }

  private toResult(
    rows: unknown[],
    total: number,
    params: { page: number; limit: number },
  ): PaginatedResult<unknown> {
    return {
      data: rows,
      pagination: {
        page: params.page,
        limit: params.limit,
        totalItems: total,
        totalPages: Math.ceil(total / params.limit),
      },
    };
  }
}
