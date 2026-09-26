import { and, count, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db } from '@/db';
import { costs, invoices, payments } from '@/db/schemas/finance';
import { customers, salesOrders } from '@/db/schemas/sales';
import { TenantScopedRepository } from '@/modules/tenancy/tenant-scoped.repository';
import type {
  FinanceContext,
  InvoiceStatus,
  PeriodSpec,
  TrendComparison,
} from '../types/ai-contexts.types.js';
import { AiTenantRepository } from './ai-tenant.repository.js';

@Injectable()
export class AiFinanceRepository extends TenantScopedRepository {
  constructor(private readonly tenantRepo: AiTenantRepository) {
    super();
  }

  async fetchFinance(period: PeriodSpec): Promise<FinanceContext> {
    const start = new Date(`${period.start}T00:00:00.000Z`);
    const end = new Date(`${period.end}T23:59:59.999Z`);
    const currency = await this.tenantRepo.fetchCurrency();
    const now = new Date();

    const [invoiceRows, paidRows, costRows, salesRows] = await Promise.all([
      this.loadInvoices(),
      this.loadPayments(),
      this.loadCosts(start, end),
      this.loadSalesTotals(start, end),
    ]);

    const paidMap = new Map(paidRows.map((r) => [r.invoiceId, Number(r.paid)]));

    const revenue = Number(salesRows[0]?.total ?? 0);
    const expenses = costRows.reduce((sum, c) => sum + Number(c.amount), 0);
    const grossProfit = revenue - expenses;
    const netProfit = grossProfit;

    const invoiceRecords = invoiceRows.map((row) => {
      const amount = Number(row.total);
      const amountPaid = paidMap.get(row.id) ?? 0;
      const outstanding = Math.max(0, amount - amountPaid);
      const dueDate = new Date(row.dueDate);
      const daysOverdue = Math.max(
        0,
        Math.floor((now.getTime() - dueDate.getTime()) / 86_400_000),
      );
      return {
        invoiceId: row.invoiceNumber,
        counterparty: row.customerName ?? 'Customer',
        direction: 'receivable' as const,
        amount,
        amountPaid: round2(amountPaid),
        amountOutstanding: round2(outstanding),
        currency,
        issueDate: new Date(row.issueDate).toISOString().slice(0, 10),
        dueDate: dueDate.toISOString().slice(0, 10),
        daysOverdue: outstanding > 0 ? daysOverdue : 0,
        status: this.invoiceStatus(row.status, outstanding, daysOverdue),
      };
    });

    const outstandingReceivables = round2(
      sum(
        invoiceRecords.filter(
          (i) => i.status !== 'cancelled' && i.status !== 'paid',
        ),
        (i) => i.amountOutstanding,
      ),
    );
    const overdueRecords = invoiceRecords.filter(
      (i) => i.status === 'overdue' && i.direction === 'receivable',
    );

    const trends: TrendComparison[] = [];
    if (period.previousStart && period.previousEnd) {
      const previous = await this.netProfitFor(
        period.previousStart,
        period.previousEnd,
      );
      if (previous != null && previous !== 0) {
        const current = round2(netProfit);
        const changePct = round1(
          ((current - previous) / Math.abs(previous)) * 100,
        );
        trends.push({
          metricLabel: 'Net Profit',
          currentValue: current,
          previousValue: previous,
          changePct,
          direction: changePct > 0 ? 'up' : changePct < 0 ? 'down' : 'flat',
          previousPeriodLabel: period.previousLabel ?? 'previous period',
        });
      }
    }

    return {
      tenantId: this.organizationId,
      domain: 'finance',
      periodLabel: period.label,
      periodStart: period.start,
      periodEnd: period.end,
      generatedAt: new Date(),
      sourceSystem: 'rona-erp',
      recordCountTruncated: false,
      currency,
      revenue: round2(revenue),
      expenses: round2(expenses),
      grossProfit: round2(grossProfit),
      netProfit: round2(netProfit),
      profitMarginPct: revenue > 0 ? round1((netProfit / revenue) * 100) : 0,
      outstandingReceivables,
      outstandingPayables: 0,
      overdueReceivables: round2(
        sum(overdueRecords, (i) => i.amountOutstanding),
      ),
      overdueInvoiceCount: overdueRecords.length,
      expenseBreakdown: costRows.map((row) => ({
        category: row.category,
        amount: round2(Number(row.amount)),
        budgetAmount: null,
        variancePct: null,
        isOverBudget: false,
      })),
      invoices: invoiceRecords,
      payroll: null,
      trends,
    };
  }

  private invoiceStatus(
    status: string,
    outstanding: number,
    daysOverdue: number,
  ): InvoiceStatus {
    switch (status) {
      case 'VOID':
        return 'cancelled';
      case 'PAID':
        return 'paid';
      case 'PARTIALLY_PAID':
        return 'partially_paid';
      case 'DRAFT':
        return 'draft';
      default:
        return daysOverdue > 0 && outstanding > 0 ? 'overdue' : 'sent';
    }
  }

  private loadInvoices() {
    return db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        customerName: customers.name,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        total: invoices.total,
        status: invoices.status,
      })
      .from(invoices)
      .leftJoin(
        customers,
        and(
          eq(customers.id, invoices.customerId),
          eq(customers.organizationId, invoices.organizationId),
        ),
      )
      .where(eq(invoices.organizationId, this.organizationId))
      .orderBy(desc(invoices.issueDate));
  }

  private loadPayments() {
    return db
      .select({
        invoiceId: payments.invoiceId,
        paid: sql<number>`coalesce(sum(${payments.amount}), 0)`,
      })
      .from(payments)
      .where(eq(payments.organizationId, this.organizationId))
      .groupBy(payments.invoiceId);
  }

  private loadCosts(start: Date, end: Date) {
    return db
      .select({
        category: costs.category,
        amount: sql<number>`coalesce(sum(${costs.amount}), 0)`,
      })
      .from(costs)
      .where(
        and(
          eq(costs.organizationId, this.organizationId),
          gte(costs.date, start),
          lte(costs.date, end),
        ),
      )
      .groupBy(costs.category);
  }

  private loadSalesTotals(start: Date, end: Date) {
    return db
      .select({
        total: sql<number>`coalesce(sum(${salesOrders.total}), 0)`,
        orderCount: count(),
      })
      .from(salesOrders)
      .where(
        and(
          eq(salesOrders.organizationId, this.organizationId),
          gte(salesOrders.orderDate, start),
          lte(salesOrders.orderDate, end),
          inArray(salesOrders.status, ['CONFIRMED', 'FULFILLING', 'FULFILLED']),
        ),
      );
  }

  private async netProfitFor(
    startIso: string,
    endIso: string,
  ): Promise<number | null> {
    const start = new Date(`${startIso}T00:00:00.000Z`);
    const end = new Date(`${endIso}T23:59:59.999Z`);

    const [sales, costTotals] = await Promise.all([
      db
        .select({ total: sql<number>`coalesce(sum(${salesOrders.total}), 0)` })
        .from(salesOrders)
        .where(
          and(
            eq(salesOrders.organizationId, this.organizationId),
            gte(salesOrders.orderDate, start),
            lte(salesOrders.orderDate, end),
            inArray(salesOrders.status, [
              'CONFIRMED',
              'FULFILLING',
              'FULFILLED',
            ]),
          ),
        ),
      db
        .select({ total: sql<number>`coalesce(sum(${costs.amount}), 0)` })
        .from(costs)
        .where(
          and(
            eq(costs.organizationId, this.organizationId),
            gte(costs.date, start),
            lte(costs.date, end),
          ),
        ),
    ]);

    const revenue = Number(sales[0]?.total ?? 0);
    if (!revenue) return null;
    return round2(revenue - Number(costTotals[0]?.total ?? 0));
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
