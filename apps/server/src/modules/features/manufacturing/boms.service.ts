import { Injectable } from '@nestjs/common';
import { pooledDb } from '@/db';
import type { Executor } from '@/db/executor';
import { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import { ItemsRepository } from '../inventory/items.repository';
import { ItemNotFoundException } from '../inventory/inventory.exception';
import {
  MANUFACTURING_DEFAULT_PAGE,
  MANUFACTURING_DEFAULT_PAGE_SIZE,
} from '@rona/config/manufacturing';
import type {
  BomCreateInput,
  BomListParams,
  BomListSearchParamsSchema,
  BomUpdateInput,
  BomVersionCreateInput,
  BomVersionLinesUpdateInput,
  PaginatedResult,
} from '@rona/types/manufacturing';
import {
  BomCodeConflictException,
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
import { BomsRepository, type BomLineInsert } from './boms.repository';

@Injectable()
export class BomsService {
  constructor(
    private readonly bomsRepository: BomsRepository,
    private readonly itemsRepository: ItemsRepository,
    private readonly auditService: AuditService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async createBom(input: BomCreateInput) {
    const existing = await this.bomsRepository.findByCode(input.code);
    if (existing) throw new BomCodeConflictException();

    const item = await this.itemsRepository.findById(input.itemId);
    if (!item) throw new ItemNotFoundException();

    return pooledDb.transaction(async (tx) => {
      const bom = await this.bomsRepository.create(
        {
          code: input.code,
          name: input.name,
          description: input.description ?? null,
          itemId: input.itemId,
        },
        tx,
      );

      const version = await this.bomsRepository.createVersion(
        { bomId: bom.id, version: '1' },
        tx,
      );
      await this.bomsRepository.createLines(
        version.id,
        this.toLineInserts(input.lines),
        tx,
      );

      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'manufacturing.bom.create',
          entityType: 'bom',
          entityId: bom.id,
          after: {
            code: bom.code,
            name: bom.name,
            itemId: bom.itemId,
            version: 1,
            lines: input.lines.length,
          },
        },
        tx,
      );

      return { bom, version };
    });
  }

  async updateBom(bomId: string, input: BomUpdateInput) {
    const bom = await this.bomsRepository.findById(bomId);
    if (!bom) throw new BomNotFoundException();
    if (input.name === undefined && input.description === undefined) {
      return bom;
    }

    const updated = await this.bomsRepository.update(bomId, {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
    });

    await this.auditService.record({
      organizationId: this.tenantContext.organizationId,
      action: 'manufacturing.bom.update',
      entityType: 'bom',
      entityId: bomId,
      before: { name: bom.name, description: bom.description },
      after: { name: updated.name, description: updated.description },
    });

    return updated;
  }

  async getBom(bomId: string) {
    const bom = await this.bomsRepository.findById(bomId);
    if (!bom) throw new BomNotFoundException();
    return bom;
  }

  async listBoms(
    params: BomListSearchParamsSchema,
  ): Promise<PaginatedResult<unknown>> {
    const resolved: BomListParams = {
      ...params,
      page: params.page ?? MANUFACTURING_DEFAULT_PAGE,
      limit: params.limit ?? MANUFACTURING_DEFAULT_PAGE_SIZE,
    };
    const { rows, total } = await this.bomsRepository.list(resolved);
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

  async deactivateBom(bomId: string) {
    const bom = await this.bomsRepository.findById(bomId);
    if (!bom) throw new BomNotFoundException();

    const updated = await this.bomsRepository.update(bomId, {
      isActive: false,
    });

    await this.auditService.record({
      organizationId: this.tenantContext.organizationId,
      action: 'manufacturing.bom.deactivate',
      entityType: 'bom',
      entityId: bomId,
      before: { isActive: bom.isActive },
      after: { isActive: false },
    });

    return updated;
  }

  async listVersions(
    bomId: string,
    params: { page?: number; limit?: number; status?: string },
  ): Promise<PaginatedResult<unknown>> {
    const bom = await this.bomsRepository.findById(bomId);
    if (!bom) throw new BomNotFoundException();

    const resolved = {
      page: params.page ?? MANUFACTURING_DEFAULT_PAGE,
      limit: params.limit ?? MANUFACTURING_DEFAULT_PAGE_SIZE,
      status: params.status,
    };
    const { rows, total } = await this.bomsRepository.listVersions(
      bomId,
      resolved,
    );
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

  async getVersion(versionId: string) {
    const version = await this.bomsRepository.findVersionById(versionId);
    if (!version) throw new BomVersionNotFoundException();
    return version;
  }

  async getVersionLines(versionId: string) {
    const version = await this.bomsRepository.findVersionById(versionId);
    if (!version) throw new BomVersionNotFoundException();
    return this.bomsRepository.findLinesByVersion(versionId);
  }

  async createDraftVersion(bomId: string, input: BomVersionCreateInput) {
    const bom = await this.bomsRepository.findById(bomId);
    if (!bom) throw new BomNotFoundException();

    const draft = await this.bomsRepository.findDraftVersion(bomId);
    if (draft) throw new BomDraftVersionExistsException();

    const maxVersion = await this.bomsRepository.findMaxVersion(bomId);
    const nextVersion = String(Number(maxVersion) + 1);

    return pooledDb.transaction(async (tx) => {
      const version = await this.bomsRepository.createVersion(
        { bomId, version: nextVersion },
        tx,
      );
      await this.bomsRepository.createLines(
        version.id,
        this.toLineInserts(input.lines),
        tx,
      );

      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'manufacturing.bom.version.create',
          entityType: 'bom_version',
          entityId: version.id,
          after: { bomId, version: nextVersion, lines: input.lines.length },
        },
        tx,
      );

      return version;
    });
  }

  async updateDraftVersionLines(
    versionId: string,
    input: BomVersionLinesUpdateInput,
  ) {
    return pooledDb.transaction(async (tx) => {
      const version = await this.bomsRepository.findVersionByIdForUpdate(
        versionId,
        tx,
      );
      if (!version) throw new BomVersionNotFoundException();
      if (version.status !== 'DRAFT') throw new BomVersionNotDraftException();
      if (version.isUsedInProduction) {
        throw new BomVersionImmutableException();
      }

      await this.bomsRepository.deleteLines(versionId, tx);
      const lines = await this.bomsRepository.createLines(
        versionId,
        this.toLineInserts(input.lines),
        tx,
      );

      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'manufacturing.bom.version.update_lines',
          entityType: 'bom_version',
          entityId: versionId,
          before: { version: version.version, status: version.status },
          after: { lines: input.lines.length },
        },
        tx,
      );

      return lines;
    });
  }

  async approveVersion(versionId: string) {
    return pooledDb.transaction(async (tx) => {
      const version = await this.bomsRepository.findVersionByIdForUpdate(
        versionId,
        tx,
      );
      if (!version) throw new BomVersionNotFoundException();
      if (version.status === 'APPROVED') {
        throw new BomVersionAlreadyApprovedException();
      }
      if (version.status !== 'DRAFT') throw new BomVersionNotDraftException();

      const currentApproved = await this.bomsRepository.findApprovedVersion(
        version.bomId,
        tx,
      );
      if (
        currentApproved &&
        currentApproved.id !== versionId &&
        !currentApproved.isUsedInProduction
      ) {
        await this.bomsRepository.updateVersion(
          currentApproved.id,
          { status: 'RETIRED' },
          tx,
        );
      }

      const approved = await this.bomsRepository.updateVersion(
        versionId,
        {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: this.tenantContext.userId,
        },
        tx,
      );

      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'manufacturing.bom.version.approve',
          entityType: 'bom_version',
          entityId: versionId,
          before: { status: 'DRAFT', version: version.version },
          after: { status: 'APPROVED', version: version.version },
        },
        tx,
      );

      return approved;
    });
  }

  async retireVersion(versionId: string) {
    return pooledDb.transaction(async (tx) => {
      const version = await this.bomsRepository.findVersionByIdForUpdate(
        versionId,
        tx,
      );
      if (!version) throw new BomVersionNotFoundException();
      if (version.status !== 'APPROVED') {
        throw new BomVersionNotApprovedException();
      }
      if (version.isUsedInProduction) throw new BomVersionImmutableException();

      const retired = await this.bomsRepository.updateVersion(
        versionId,
        { status: 'RETIRED' },
        tx,
      );

      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'manufacturing.bom.version.retire',
          entityType: 'bom_version',
          entityId: versionId,
          before: { status: 'APPROVED', version: version.version },
          after: { status: 'RETIRED', version: version.version },
        },
        tx,
      );

      return retired;
    });
  }

  async resolveApprovedVersionForProduction(bomId: string, tx?: Executor) {
    const bom = await this.bomsRepository.findById(bomId);
    if (!bom) throw new BomNotFoundException();
    if (!bom.isActive) throw new BomInactiveException();

    const version = await this.bomsRepository.findApprovedVersion(bomId, tx);
    if (!version) throw new BomNoApprovedVersionException();
    return version;
  }

  private toLineInserts(
    lines: Array<{
      componentItemId: string;
      quantityPerUnit: string;
      notes?: string;
    }>,
  ): BomLineInsert[] {
    return lines.map((line) => ({
      componentItemId: line.componentItemId,
      quantityPerUnit: line.quantityPerUnit,
      notes: line.notes ?? null,
    }));
  }
}
