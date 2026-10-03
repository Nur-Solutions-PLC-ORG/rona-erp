import { and, asc, eq } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db } from '@/db';
import { items, unitsOfMeasure } from '@/db/schemas/inventory';
import { bomLines, boms, bomVersions } from '@/db/schemas/manufacturing';
import { TenantScopedRepository } from '@/modules/tenancy/tenant-scoped.repository';
import type {
  BomComponentRecord,
  BomContext,
  BomRecord,
  PeriodSpec,
} from '../types/ai-contexts.types.js';

@Injectable()
export class AiBomRepository extends TenantScopedRepository {
  async fetchBom(period: PeriodSpec): Promise<BomContext> {
    const [bomRows, versionRows, lineRows, itemsRows, uomRows] =
      await Promise.all([
        this.loadBoms(),
        this.loadVersions(),
        this.loadLines(),
        this.loadItems(),
        this.loadUoms(),
      ]);

    const uomCodes = new Map(uomRows.map((u) => [u.id, u.code]));
    const uomByItem = new Map(
      itemsRows.map((i) => [
        i.id,
        i.unitOfMeasureId ? (uomCodes.get(i.unitOfMeasureId) ?? '') : '',
      ]),
    );
    const itemNames = new Map(itemsRows.map((i) => [i.id, i.name]));

    const versionsByBom = new Map<string, typeof versionRows>();
    for (const version of versionRows) {
      const list = versionsByBom.get(version.bomId) ?? [];
      list.push(version);
      versionsByBom.set(version.bomId, list);
    }

    const linesByVersion = new Map<string, typeof lineRows>();
    for (const line of lineRows) {
      const list = linesByVersion.get(line.bomVersionId) ?? [];
      list.push(line);
      linesByVersion.set(line.bomVersionId, list);
    }

    let approvedCount = 0;
    let draftCount = 0;

    const bomsList: BomRecord[] = bomRows.map((bom) => {
      const versions = (versionsByBom.get(bom.id) ?? []).sort(
        (a, b) => Number(b.version) - Number(a.version),
      );
      const latest = versions[0];
      const status = latest ? latest.status : 'DRAFT';
      if (status === 'APPROVED') approvedCount += 1;
      if (status === 'DRAFT') draftCount += 1;

      const components = latest
        ? (linesByVersion.get(latest.id) ?? []).map<BomComponentRecord>(
            (line) => ({
              component:
                itemNames.get(line.componentItemId) ?? line.componentItemId,
              quantityPerUnit: String(line.quantityPerUnit),
              unitOfMeasure: uomByItem.get(line.componentItemId) ?? '',
            }),
          )
        : [];

      return {
        bomId: bom.id,
        code: bom.code,
        name: bom.name,
        finishedItem: itemNames.get(bom.itemId) ?? bom.itemId,
        latestVersion: latest ? String(latest.version) : '1',
        status,
        componentCount: components.length,
        components,
      };
    });

    return {
      tenantId: this.organizationId,
      domain: 'bom',
      periodLabel: period.label,
      periodStart: period.start,
      periodEnd: period.end,
      generatedAt: new Date(),
      sourceSystem: 'rona-erp',
      recordCountTruncated: false,
      totalBomCount: bomsList.length,
      activeBomCount: bomRows.length,
      approvedCount,
      draftCount,
      boms: bomsList,
    };
  }

  private loadBoms() {
    return db
      .select({
        id: boms.id,
        code: boms.code,
        name: boms.name,
        itemId: boms.itemId,
      })
      .from(boms)
      .where(
        and(
          eq(boms.organizationId, this.organizationId),
          eq(boms.isActive, true),
        ),
      )
      .orderBy(asc(boms.name));
  }

  private loadVersions() {
    return db
      .select({
        id: bomVersions.id,
        bomId: bomVersions.bomId,
        version: bomVersions.version,
        status: bomVersions.status,
      })
      .from(bomVersions)
      .where(eq(bomVersions.organizationId, this.organizationId));
  }

  private loadLines() {
    return db
      .select({
        id: bomLines.id,
        bomVersionId: bomLines.bomVersionId,
        componentItemId: bomLines.componentItemId,
        quantityPerUnit: bomLines.quantityPerUnit,
      })
      .from(bomLines)
      .where(eq(bomLines.organizationId, this.organizationId));
  }

  private loadItems() {
    return db
      .select({
        id: items.id,
        name: items.name,
        unitOfMeasureId: items.unitOfMeasureId,
      })
      .from(items)
      .where(
        and(
          eq(items.organizationId, this.organizationId),
          eq(items.isArchived, false),
        ),
      );
  }

  private loadUoms() {
    return db
      .select({ id: unitsOfMeasure.id, code: unitsOfMeasure.code })
      .from(unitsOfMeasure)
      .where(eq(unitsOfMeasure.organizationId, this.organizationId));
  }
}
