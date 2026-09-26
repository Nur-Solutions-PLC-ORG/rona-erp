import {
  and,
  asc,
  count,
  eq,
  ilike,
  inArray,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db, pooledDb } from '@/db';
import type { Executor } from '@/db/executor';
import { items } from '@/db/schemas/inventory/master-data';
import { warehouses } from '@/db/schemas/inventory/master-data';
import { inventoryReservations } from '@/db/schemas/inventory/ledger';
import { TenantScopedRepository } from '@/modules/tenancy/tenant-scoped.repository';
import type { ReservationListParams } from '@rona/types/inventory';

@Injectable()
export class ReservationsRepository extends TenantScopedRepository {
  async create(
    data: {
      itemId: string;
      warehouseId: string;
      quantity: string;
      allocatedLots: Array<{
        lotId: string;
        locationId: string;
        quantity: string;
      }>;
      reference?: string | null;
      notes?: string | null;
      expiresAt?: Date | null;
    },
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .insert(inventoryReservations)
      .values({
        organizationId: this.organizationId,
        createdBy: this.tenantContext.userId,
        ...data,
      })
      .returning();
    return row;
  }

  async findById(reservationId: string) {
    const [row] = await db
      .select()
      .from(inventoryReservations)
      .where(
        this.tenantScope(
          inventoryReservations,
          eq(inventoryReservations.id, reservationId),
        ),
      )
      .limit(1);
    return row;
  }

  async findByIdForUpdate(reservationId: string, tx: Executor) {
    const [row] = await tx
      .select()
      .from(inventoryReservations)
      .where(
        this.tenantScope(
          inventoryReservations,
          eq(inventoryReservations.id, reservationId),
        ),
      )
      .limit(1)
      .for('update');
    return row;
  }

  async update(
    reservationId: string,
    data: Partial<typeof inventoryReservations.$inferInsert>,
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .update(inventoryReservations)
      .set(data)
      .where(
        this.tenantScope(
          inventoryReservations,
          eq(inventoryReservations.id, reservationId),
        ),
      )
      .returning();
    return row;
  }

  async list(params: ReservationListParams) {
    const conditions: SQL[] = [];
    if (params.itemId) {
      conditions.push(eq(inventoryReservations.itemId, params.itemId));
    }
    if (params.warehouseId) {
      conditions.push(
        eq(inventoryReservations.warehouseId, params.warehouseId),
      );
    }
    if (params.status) {
      conditions.push(eq(inventoryReservations.status, params.status));
    }
    if (params.searchQuery) {
      const pattern = `%${params.searchQuery}%`;
      const searchCondition = or(
        ilike(inventoryReservations.reference, pattern),
        inArray(
          inventoryReservations.itemId,
          db
            .select({ id: items.id })
            .from(items)
            .where(
              and(
                eq(items.organizationId, this.organizationId),
                or(ilike(items.code, pattern), ilike(items.name, pattern)),
              ),
            ),
        ),
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    const where = this.tenantScope(inventoryReservations, ...conditions);
    const offset = (params.page - 1) * params.limit;

    const rows = await db
      .select({
        id: inventoryReservations.id,
        organizationId: inventoryReservations.organizationId,
        itemId: inventoryReservations.itemId,
        warehouseId: inventoryReservations.warehouseId,
        status: inventoryReservations.status,
        quantity: inventoryReservations.quantity,
        allocatedLots: inventoryReservations.allocatedLots,
        reference: inventoryReservations.reference,
        notes: inventoryReservations.notes,
        createdBy: inventoryReservations.createdBy,
        createdAt: inventoryReservations.createdAt,
        updatedAt: inventoryReservations.updatedAt,
        expiresAt: inventoryReservations.expiresAt,
        itemName: items.name,
        warehouseName: warehouses.name,
      })
      .from(inventoryReservations)
      .innerJoin(items, eq(items.id, inventoryReservations.itemId))
      .innerJoin(
        warehouses,
        eq(warehouses.id, inventoryReservations.warehouseId),
      )
      .where(where)
      .orderBy(asc(inventoryReservations.createdAt))
      .limit(params.limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(inventoryReservations)
      .where(where);

    return { rows, total: Number(total) };
  }

  async sumActiveReservations(
    itemId: string,
    warehouseId: string,
    tx?: Executor,
  ) {
    const executor = tx ?? db;
    const [row] = await executor
      .select({
        total: sql<string>`coalesce(sum(${inventoryReservations.quantity}), 0)`,
      })
      .from(inventoryReservations)
      .where(
        this.tenantScope(
          inventoryReservations,
          eq(inventoryReservations.itemId, itemId),
          eq(inventoryReservations.warehouseId, warehouseId),
          eq(inventoryReservations.status, 'ACTIVE'),
        ),
      );
    return row?.total ?? '0';
  }

  async findActiveByReference(reference: string, tx?: Executor) {
    const executor = tx ?? db;
    return executor
      .select()
      .from(inventoryReservations)
      .where(
        this.tenantScope(
          inventoryReservations,
          eq(inventoryReservations.reference, reference),
          eq(inventoryReservations.status, 'ACTIVE'),
        ),
      )
      .for('update');
  }
}
