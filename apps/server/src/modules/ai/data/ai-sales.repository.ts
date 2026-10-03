import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db } from '@/db';
import { users } from '@/db/schemas/auth';
import { items } from '@/db/schemas/inventory';
import { customers, salesOrderLines, salesOrders } from '@/db/schemas/sales';
import { TenantScopedRepository } from '@/modules/tenancy/tenant-scoped.repository';
import type {
  CustomerRecord,
  PeriodSpec,
  SalesContext,
  SalesOrderRecord,
  TrendComparison,
} from '../types/ai-contexts.types.js';
import { AiTenantRepository } from './ai-tenant.repository.js';

@Injectable()
export class AiSalesRepository extends TenantScopedRepository {
  constructor(private readonly tenantRepo: AiTenantRepository) {
    super();
  }

  async fetchSales(period: PeriodSpec): Promise<SalesContext> {
    const start = new Date(`${period.start}T00:00:00.000Z`);
    const end = new Date(`${period.end}T23:59:59.999Z`);
    const currency = await this.tenantRepo.fetchCurrency();
    const now = new Date();

    const [orderRows, lineRows] = await Promise.all([
      this.loadOrders(start, end),
      this.loadLines(start, end),
    ]);
    const customerRows = await this.loadCustomers();

    const linesByOrder = new Map<
      string,
      { quantity: number; summary: string }
    >();
    for (const line of lineRows) {
      const existing = linesByOrder.get(line.orderId);
      const qty = Number(line.quantity);
      const summary = `${qty} x ${line.description}`;
      linesByOrder.set(line.orderId, {
        quantity: (existing?.quantity ?? 0) + qty,
        summary: existing ? `${existing.summary}; ${summary}` : summary,
      });
    }

    const orders: SalesOrderRecord[] = orderRows.map((row) => {
      const line = linesByOrder.get(row.id);
      const orderDate = new Date(row.orderDate);
      const promised = new Date(orderDate.getTime() + 14 * 86_400_000);
      const daysLate =
        row.status === 'FULFILLED'
          ? 0
          : Math.max(
              0,
              Math.floor((now.getTime() - promised.getTime()) / 86_400_000),
            );
      return {
        orderId: row.orderNumber,
        customer: row.customerName ?? 'Customer',
        productSummary: line?.summary ?? 'Items',
        quantity: round1(line?.quantity ?? 0),
        totalValue: round2(Number(row.total)),
        currency,
        orderDate: orderDate.toISOString().slice(0, 10),
        promisedDeliveryDate: promised.toISOString().slice(0, 10),
        daysLate,
        status: this.mapStatus(row.status),
      };
    });

    const fulfilled = orders.filter(
      (o) =>
        (o.status === 'shipped' || o.status === 'delivered') &&
        o.daysLate === 0,
    ).length;
    const overdue = orders.filter((o) => o.daysLate > 0).length;
    const pending = orders.length - fulfilled - overdue;

    const productSales = new Map<string, { units: number; revenue: number }>();
    for (const order of orders) {
      const agg = productSales.get(order.productSummary) ?? {
        units: 0,
        revenue: 0,
      };
      agg.units += order.quantity;
      agg.revenue += order.totalValue;
      productSales.set(order.productSummary, agg);
    }
    const topProducts = [...productSales.entries()]
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .map(([product, agg]) => ({
        product,
        unitsSold: round1(agg.units),
        revenue: round2(agg.revenue),
      }));

    const totalRevenue = round2(sum(orders, (o) => o.totalValue));

    const customersList: CustomerRecord[] = customerRows.map((c) => ({
      customerId: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      status: c.status,
      salesperson: c.salespersonName ?? null,
    }));

    const trends: TrendComparison[] = [];
    if (period.previousStart && period.previousEnd) {
      const previous = await this.revenueFor(
        period.previousStart,
        period.previousEnd,
      );
      if (previous != null && previous > 0) {
        const changePct = round1(((totalRevenue - previous) / previous) * 100);
        trends.push({
          metricLabel: 'Total Revenue',
          currentValue: totalRevenue,
          previousValue: previous,
          changePct,
          direction: changePct > 0 ? 'up' : changePct < 0 ? 'down' : 'flat',
          previousPeriodLabel: period.previousLabel ?? 'previous period',
        });
      }
    }

    return {
      tenantId: this.organizationId,
      domain: 'sales',
      periodLabel: period.label,
      periodStart: period.start,
      periodEnd: period.end,
      generatedAt: new Date(),
      sourceSystem: 'rona-erp',
      recordCountTruncated: false,
      currency,
      totalOrderCount: orders.length,
      totalRevenue,
      fulfilledCount: fulfilled,
      pendingCount: pending,
      overdueCount: overdue,
      orders,
      customers: customersList,
      topProducts,
      trends,
    };
  }

  private mapStatus(status: string): SalesOrderRecord['status'] {
    switch (status) {
      case 'CONFIRMED':
        return 'confirmed';
      case 'FULFILLING':
        return 'in_production';
      case 'FULFILLED':
        return 'delivered';
      case 'CANCELLED':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  private loadOrders(start: Date, end: Date) {
    return db
      .select({
        id: salesOrders.id,
        orderNumber: salesOrders.orderNumber,
        customerName: customers.name,
        orderDate: salesOrders.orderDate,
        status: salesOrders.status,
        total: salesOrders.total,
      })
      .from(salesOrders)
      .leftJoin(
        customers,
        and(
          eq(customers.id, salesOrders.customerId),
          eq(customers.organizationId, salesOrders.organizationId),
        ),
      )
      .where(
        and(
          eq(salesOrders.organizationId, this.organizationId),
          gte(salesOrders.orderDate, start),
          lte(salesOrders.orderDate, end),
        ),
      )
      .orderBy(desc(salesOrders.orderDate));
  }

  private loadLines(start: Date, end: Date) {
    return db
      .select({
        orderId: salesOrderLines.orderId,
        description: items.name,
        quantity: salesOrderLines.quantity,
      })
      .from(salesOrderLines)
      .leftJoin(
        items,
        and(
          eq(items.id, salesOrderLines.itemId),
          eq(items.organizationId, this.organizationId),
        ),
      )
      .where(
        and(
          eq(salesOrderLines.organizationId, this.organizationId),
          gte(salesOrderLines.createdAt, start),
          lte(salesOrderLines.createdAt, end),
        ),
      );
  }

  private loadCustomers() {
    return db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        email: customers.email,
        status: customers.status,
        salespersonName: users.fullName,
      })
      .from(customers)
      .leftJoin(users, eq(users.id, customers.salespersonUserId))
      .where(eq(customers.organizationId, this.organizationId))
      .orderBy(desc(customers.createdAt));
  }

  private async revenueFor(
    startIso: string,
    endIso: string,
  ): Promise<number | null> {
    const start = new Date(`${startIso}T00:00:00.000Z`);
    const end = new Date(`${endIso}T23:59:59.999Z`);
    const [row] = await db
      .select({ total: sql<number>`coalesce(sum(${salesOrders.total}), 0)` })
      .from(salesOrders)
      .where(
        and(
          eq(salesOrders.organizationId, this.organizationId),
          gte(salesOrders.orderDate, start),
          lte(salesOrders.orderDate, end),
        ),
      );
    const total = Number(row?.total ?? 0);
    return total > 0 ? round2(total) : null;
  }
}

function sum<T>(rows: T[], pick: (row: T) => number): number {
  return rows.reduce((total, row) => total + pick(row), 0);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
