import { Injectable } from '@nestjs/common';
import { pooledDb } from '@/db';
import { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import type {
  ItemCreateInput,
  ItemListParams,
  ItemListSearchParamsSchema,
  ItemUpdateInput,
  PaginatedResult,
} from '@rona/types/inventory';
import {
  INVENTORY_DEFAULT_PAGE,
  INVENTORY_DEFAULT_PAGE_SIZE,
} from '@rona/config/inventory';
import {
  ItemArchivedException,
  ItemCodeConflictException,
  ItemNotFoundException,
  UnitOfMeasureNotFoundException,
} from './inventory.exception';
import { ItemsRepository } from './items.repository';

@Injectable()
export class ItemsService {
  constructor(
    private readonly itemsRepository: ItemsRepository,
    private readonly auditService: AuditService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async createItem(input: ItemCreateInput) {
    const unit = await this.itemsRepository.findUnitOfMeasure(
      input.unitOfMeasureId,
    );
    if (!unit) throw new UnitOfMeasureNotFoundException();

    const existing = await this.itemsRepository.findByCode(input.code);
    if (existing) throw new ItemCodeConflictException();

    const item = await pooledDb.transaction(async (tx) => {
      const created = await this.itemsRepository.create(input, tx);
      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'inventory.item.create',
          entityType: 'item',
          entityId: created.id,
          after: { code: created.code, name: created.name, type: created.type },
        },
        tx,
      );
      return created;
    });

    return item;
  }

  async getItem(itemId: string) {
    const item = await this.itemsRepository.findById(itemId);
    if (!item) throw new ItemNotFoundException();
    return item;
  }

  async updateItem(itemId: string, input: ItemUpdateInput) {
    const item = await this.itemsRepository.findById(itemId);
    if (!item) throw new ItemNotFoundException();

    if (input.code && input.code !== item.code) {
      const existing = await this.itemsRepository.findByCode(input.code);
      if (existing && existing.id !== itemId) {
        throw new ItemCodeConflictException();
      }
    }

    if (
      input.unitOfMeasureId &&
      input.unitOfMeasureId !== item.unitOfMeasureId
    ) {
      const unit = await this.itemsRepository.findUnitOfMeasure(
        input.unitOfMeasureId,
      );
      if (!unit) throw new UnitOfMeasureNotFoundException();
    }

    return pooledDb.transaction(async (tx) => {
      const updated = await this.itemsRepository.update(itemId, input, tx);
      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'inventory.item.update',
          entityType: 'item',
          entityId: itemId,
          before: { code: item.code, name: item.name },
          after: { code: updated.code, name: updated.name },
        },
        tx,
      );
      return updated;
    });
  }

  async archiveItem(itemId: string) {
    const item = await this.itemsRepository.findById(itemId);
    if (!item) throw new ItemNotFoundException();
    if (item.isArchived) throw new ItemArchivedException();

    return pooledDb.transaction(async (tx) => {
      const archived = await this.itemsRepository.archive(itemId, tx);
      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'inventory.item.archive',
          entityType: 'item',
          entityId: itemId,
          before: { isArchived: false },
          after: { isArchived: true },
        },
        tx,
      );
      return archived;
    });
  }

  async listItems(
    params: ItemListSearchParamsSchema,
  ): Promise<PaginatedResult<unknown>> {
    const resolved: ItemListParams = {
      ...params,
      page: params.page ?? INVENTORY_DEFAULT_PAGE,
      limit: params.limit ?? INVENTORY_DEFAULT_PAGE_SIZE,
    };
    const { rows, total } = await this.itemsRepository.list(resolved);
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

  async createUnitOfMeasure(input: { code: string; name: string }) {
    const unit = await pooledDb.transaction(async (tx) => {
      const created = await this.itemsRepository.createUnitOfMeasure(input, tx);
      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'inventory.uom.create',
          entityType: 'unit_of_measure',
          entityId: created?.id,
          after: { code: created?.code, name: created?.name },
        },
        tx,
      );
      return created;
    });
    return unit;
  }

  async listUnitsOfMeasure() {
    return this.itemsRepository.listUnitsOfMeasure();
  }
}
