"use client";

import { useMemo } from "react";
import {
  HiOutlineBanknotes,
  HiOutlineDocumentText,
  HiOutlineExclamationTriangle,
  HiOutlineChartPie,
} from "react-icons/hi2";
import { formatMoney, safeNumber } from "@/lib/format";
import { humanize } from "@/modules/workspace/components/ui";
import {
  BarChart,
  BarList,
  ChartCard,
  DonutChart,
  Sparkline,
  toCategoryPoints,
  toMonthlySeries,
} from "@/modules/workspace/components/charts";
import {
  CLIENT_COSTS_PAGE,
  CLIENT_INVOICES_PAGE,
  CLIENT_PAYMENTS_PAGE,
} from "@rona/routes/workspace";
import { useFinanceDashboardData } from "../role-hooks";
import { DashboardHeader, LoadingCard } from "./shell";

function isOverdue(invoice: { status: string; dueDate: Date | null }): boolean {
  if (invoice.status === "PAID" || invoice.status === "VOID") return false;
  return invoice.dueDate ? new Date(invoice.dueDate) < new Date() : false;
}

export default function FinanceDashboardView() {
  const data = useFinanceDashboardData();

  const totals = useMemo(() => {
    let invoiced = 0;
    let collected = 0;
    let outstanding = 0;
    let overdueCount = 0;

    for (const invoice of data.invoices) {
      if (invoice.status === "VOID") continue;
      invoiced += safeNumber(invoice.total);
      collected += safeNumber(invoice.paidTotal);
      outstanding += safeNumber(invoice.remainingBalance);
      if (isOverdue(invoice)) overdueCount += 1;
    }

    const costs = data.costs.reduce(
      (sum, cost) => sum + safeNumber(cost.amount),
      0,
    );

    return { invoiced, collected, outstanding, overdueCount, costs };
  }, [data.invoices, data.costs]);

  const invoicedSeries = useMemo(
    () =>
      toMonthlySeries(
        data.invoices,
        6,
        (invoice) => invoice.issueDate ?? invoice.createdAt,
        (invoice) => (invoice.status === "VOID" ? 0 : safeNumber(invoice.total)),
        { key: "invoiced", label: "Invoiced amount", color: "#4f46e5" },
      ),
    [data.invoices],
  );

  const costSeries = useMemo(
    () =>
      toMonthlySeries(
        data.costs,
        6,
        (cost) => cost.costDate,
        (cost) => safeNumber(cost.amount),
        { key: "costs", label: "Costs", color: "#e11d48" },
      ),
    [data.costs],
  );

  const collectedSeries = useMemo(
    () =>
      toMonthlySeries(
        data.payments,
        6,
        (payment) => payment.paidAt,
        (payment) => safeNumber(payment.amount),
        { key: "collected", label: "Collected", color: "#14b8a6" },
      ),
    [data.payments],
  );

  const invoiceStatusPoints = useMemo(
    () =>
      toCategoryPoints(
        data.invoices,
        (invoice) => humanize(invoice.status),
        () => 1,
      ),
    [data.invoices],
  );

  const methodPoints = useMemo(
    () =>
      toCategoryPoints(
        data.payments,
        (payment) => humanize(payment.method),
        (payment) => safeNumber(payment.amount),
      ),
    [data.payments],
  );

  const costTypePoints = useMemo(
    () =>
      toCategoryPoints(
        data.costs,
        (cost) => humanize(cost.type),
        (cost) => safeNumber(cost.amount),
      ),
    [data.costs],
  );

  const totalCollected = totals.collected;

  if (data.isLoading) {
    return <LoadingCard label="Loading finance dashboard…" />;
  }

  return (
    <div className="space-y-5">
      <DashboardHeader
        roleLabel="Finance"
        icon={<HiOutlineBanknotes className="h-5 w-5" />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: <HiOutlineDocumentText className="h-5 w-5" />,
            label: "Total Invoiced",
            value: formatMoney(totals.invoiced),
            hint: "Non-void invoices",
            spark: invoicedSeries.points.map((point) => point.value),
            sparkColor: "#4f46e5",
          },
          {
            icon: <HiOutlineBanknotes className="h-5 w-5" />,
            label: "Collected",
            value: formatMoney(totals.collected),
            hint: "Payments received",
            spark: collectedSeries.points.map((point) => point.value),
            sparkColor: "#14b8a6",
          },
          {
            icon: <HiOutlineExclamationTriangle className="h-5 w-5" />,
            label: "Outstanding",
            value: formatMoney(totals.outstanding),
            hint: `${totals.overdueCount} overdue`,
            spark: null,
            sparkColor: undefined,
          },
          {
            icon: <HiOutlineChartPie className="h-5 w-5" />,
            label: "Costs",
            value: formatMoney(totals.costs),
            hint: `${data.costs.length} entries`,
            spark: costSeries.points.map((point) => point.value),
            sparkColor: "#e11d48",
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-zinc-500">{kpi.label}</p>
              <span className="text-zinc-400">{kpi.icon}</span>
            </div>
            <div className="mt-1.5 flex items-end justify-between gap-2">
              <p className="font-mono text-lg font-bold tabular-nums text-zinc-900">
                {kpi.value}
              </p>
              {kpi.spark ? (
                <Sparkline
                  values={kpi.spark}
                  color={kpi.sparkColor}
                  className="mb-0.5 shrink-0"
                />
              ) : null}
            </div>
            <p className="mt-0.5 text-[11px] text-zinc-500">{kpi.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <ChartCard
            title="Cash flow, last 6 months"
            description="Monthly invoiced vs collected vs costs."
            isEmpty={
              data.invoices.length === 0 &&
              data.payments.length === 0 &&
              data.costs.length === 0
            }
            emptyMessage="No finance records yet"
          >
            <BarChart
              series={[
                invoicedSeries,
                collectedSeries,
                costSeries,
              ]}
              valueFormat={(value) => formatMoney(value)}
            />
          </ChartCard>
        </div>

        <ChartCard
          title="Collection rate"
          description="Share of invoiced value collected so far."
          isEmpty={totals.invoiced === 0}
          emptyMessage="No invoices yet"
        >
          <DonutChart
            points={[
              { label: "Collected", value: totals.collected },
              { label: "Outstanding", value: totals.outstanding },
            ]}
            centerLabel="Collected"
            centerValue={`${
              totals.collected + totals.outstanding > 0
                ? Math.round(
                    (totals.collected / (totals.collected + totals.outstanding)) *
                      100,
                  )
                : 0
            }%`}
            valueFormat={(value) => formatMoney(value)}
          />
        </ChartCard>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <ChartCard
          title="Collections by method"
          description="Share of BANK / CASH / CREDIT_NOTE collections."
          isEmpty={data.payments.length === 0}
          emptyMessage="No payments yet"
        >
          <DonutChart
            points={methodPoints}
            centerLabel="Collected"
            centerValue={formatMoney(totalCollected)}
            valueFormat={(value) => formatMoney(value)}
          />
        </ChartCard>

        <ChartCard
          title="Costs by type"
          description="Share of spend per category."
          isEmpty={data.costs.length === 0}
          emptyMessage="No costs recorded yet"
        >
          <DonutChart
            points={costTypePoints}
            centerLabel="Total"
            centerValue={formatMoney(totals.costs)}
            valueFormat={(value) => formatMoney(value)}
          />
        </ChartCard>

        <ChartCard
          title="Invoices by status"
          description="Distribution across the invoice lifecycle."
          isEmpty={data.invoices.length === 0}
          emptyMessage="No invoices yet"
        >
          <BarList
            points={invoiceStatusPoints}
            valueFormat={(value) => String(value)}
          />
        </ChartCard>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <ChartCard
          title="Invoiced by month"
          description="Total value of non-void invoices, last 6 months."
          isEmpty={data.invoices.length === 0}
          emptyMessage="No invoices yet"
        >
          <BarList
            points={invoicedSeries.points}
            valueFormat={(value) => formatMoney(value)}
          />
        </ChartCard>

        <ChartCard
          title="Costs by month"
          description="Recorded operational costs, last 6 months."
          isEmpty={data.costs.length === 0}
          emptyMessage="No costs recorded yet"
        >
          <BarList
            points={costSeries.points}
            valueFormat={(value) => formatMoney(value)}
          />
        </ChartCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { href: CLIENT_INVOICES_PAGE, label: "Manage invoices" },
          { href: CLIENT_PAYMENTS_PAGE, label: "Record payments" },
          { href: CLIENT_COSTS_PAGE, label: "Record costs" },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="rounded-xl border border-zinc-200/80 bg-white px-4 py-3 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:border-brand-sea hover:text-primary"
          >
            {link.label} →
          </a>
        ))}
      </div>
    </div>
  );
}
