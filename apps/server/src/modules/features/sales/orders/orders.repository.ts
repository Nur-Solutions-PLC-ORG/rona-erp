import { and, asc, count, eq, ilike, type SQL } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db, pooledDb } from '@/db';
import type { Executor } from '@/db/executor';
import { salesOrders, salesOrderLines, customers } from '@/db/schemas/sales';
import { TenantScopedRepository } from '@/modules/tenancy/tenant-scoped.repository';
import type {
  SalesOrderCreateInput,
  SalesOrderListParams,
  SalesOrderStatus,
} from '@rona/types/sales';
import { SalesOrderCustomerNotFoundException } from './orders.exception';

@Injectable()
export class SalesOrderRepository extends TenantScopedRepository {
  async create(data: SalesOrderCreateInput, tx?: Executor) {
    const executor = tx ?? pooledDb;
    const [customer] = await executor
      .select({ name: customers.name })
      .from(customers)
      .where(
        and(
          eq(customers.id, data.customerId),
          eq(customers.organizationId, this.organizationId),
        ),
      )
      .limit(1);
    if (!customer) throw new SalesOrderCustomerNotFoundException();

    const [order] = await executor
      .insert(salesOrders)
      .values({
        organizationId: this.organizationId,
        customerId: data.customerId,
        customerName: customer.name,
        warehouseId: data.warehouseId,
        salespersonUserId: data.salespersonUserId ?? null,
        status: 'DRAFT',
        orderNumber: `SO-${Date.now()}`,
        subtotal: '0',
        discountTotal: '0',
        vatTotal: '0',
        total: '0',
        notes: data.notes ?? null,
        paymentTerms: data.paymentTerms ?? null,
        orderDate: data.orderDate ?? new Date(),
      })
      .returning();

    return order;
  }

  async findById(orderId: string) {
    const [row] = await db
      .select()
      .from(salesOrders)
      .where(
        and(
          eq(salesOrders.id, orderId),
          eq(salesOrders.organizationId, this.organizationId),
        ),
      )
      .limit(1);

    return row;
  }

  async findByIdForUpdate(orderId: string, tx: Executor) {
    const [row] = await tx
      .select()
      .from(salesOrders)
      .where(
        and(
          eq(salesOrders.id, orderId),
          eq(salesOrders.organizationId, this.organizationId),
        ),
      )
      .limit(1)
      .for('update');

    return row;
  }

  async findLines(orderId: string) {
    return db
      .select()
      .from(salesOrderLines)
      .where(
        and(
          eq(salesOrderLines.orderId, orderId),
          eq(salesOrderLines.organizationId, this.organizationId),
        ),
      );
  }

  async list(params: SalesOrderListParams) {
    const conditions: SQL[] = [];

    if (params.status) {
      conditions.push(eq(salesOrders.status, params.status));
    }
    if (params.customerId) {
      conditions.push(eq(salesOrders.customerId, params.customerId));
    }
    if (params.searchQuery) {
      conditions.push(
        ilike(salesOrders.orderNumber, `%${params.searchQuery}%`),
      );
    }

    const where = this.tenantScope(salesOrders, ...conditions);
    const offset = (params.page - 1) * params.limit;

    const rows = await db
      .select()
      .from(salesOrders)
      .where(where)
      .orderBy(asc(salesOrders.createdAt))
      .limit(params.limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(salesOrders)
      .where(where);

    return { rows, total: Number(total) };
  }

  async updateStatus(
    orderId: string,
    status: 'CONFIRMED' | 'CANCELLED' | 'FULFILLING' | 'FULFILLED',
    extra?: Partial<any>,
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .update(salesOrders)
      .set({ status, ...extra })
      .where(
        and(
          eq(salesOrders.id, orderId),
          eq(salesOrders.organizationId, this.organizationId),
        ),
      )
      .returning();

    return row;
  }

  async transitionStatus(
    orderId: string,
    expectedStatus: SalesOrderStatus,
    status: SalesOrderStatus,
    extra?: Partial<any>,
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .update(salesOrders)
      .set({ status, ...extra })
      .where(
        and(
          eq(salesOrders.id, orderId),
          eq(salesOrders.organizationId, this.organizationId),
          eq(salesOrders.status, expectedStatus),
        ),
      )
      .returning();

    return row;
  }

  async updateTotals(
    orderId: string,
    totals: {
      subtotal: string;
      discountTotal: string;
      vatTotal: string;
      total: string;
    },
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .update(salesOrders)
      .set(totals)
      .where(
        and(
          eq(salesOrders.id, orderId),
          eq(salesOrders.organizationId, this.organizationId),
        ),
      )
      .returning();

    return row;
  }

  async addLine(
    data: {
      orderId: string;
      itemId: string;
      quantity: string;
      unitPrice: string;
      discountPercent?: string;
      vatPercent?: string;
      lineNet: string;
      lineVat: string;
      lineTotal: string;
    },
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [line] = await executor
      .insert(salesOrderLines)
      .values({ ...data, organizationId: this.organizationId })
      .returning();

    return line;
  }

  async deleteLines(orderId: string, tx?: Executor) {
    const executor = tx ?? pooledDb;
    await executor
      .delete(salesOrderLines)
      .where(
        and(
          eq(salesOrderLines.orderId, orderId),
          eq(salesOrderLines.organizationId, this.organizationId),
        ),
      );
  }
}
