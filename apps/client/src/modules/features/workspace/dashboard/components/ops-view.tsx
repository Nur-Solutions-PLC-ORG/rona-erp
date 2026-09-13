"use client";

import { useMemo } from "react";
import {
  HiOutlineBeaker,
  HiOutlineBuildingStorefront,
  HiOutlineClipboardDocumentList,
  HiOutlineCube,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";
import {
  CLIENT_INSPECTIONS_PAGE,
  CLIENT_ITEMS_PAGE,
  CLIENT_MOVEMENTS_PAGE,
  CLIENT_PRODUCTION_ORDERS_PAGE,
} from "@rona/routes/workspace";
import { safeNumber } from "@/lib/format";
import { humanize } from "@/modules/workspace/components/ui";
import { usePermissions } from "@/modules/workspace/hooks";
import {
  BarList,
  ChartCard,
  DonutChart,
  toCategoryPoints,
} from "@/modules/workspace/components/charts";
import { useOpsDashboardData, useFinanceDashboardData } from "../role-hooks";
import {
  DashboardHeader,
  DataCard,
  KpiCard,
  LoadingCard,
  RequiresAttention,
  requireAttention,
  ViewAllLink,
} from "./shell";
import {
  DistributionCard,
  InspectionsTable,
  MovementsTable,
  ProductionOrdersTable,
} from "./tables";

function formatMoney(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function FinanceSection() {
  const finance = useFinanceDashboardData();

  const totals = useMemo(() => {
    let invoiced = 0;
    let collected = 0;
    let outstanding = 0;

    for (const invoice of finance.invoices) {
      if (invoice.status === "VOID") continue;
      invoiced += safeNumber(invoice.total);
      collected += safeNumber(invoice.paidTotal);
      outstanding += safeNumber(invoice.remainingBalance);
    }

    const costs = finance.costs.reduce(
      (sum, cost) => sum + safeNumber(cost.amount),
      0,
    );

    return { invoiced, collected, outstanding, costs };
  }, [finance.invoices, finance.costs]);

  const methodPoints = useMemo(
    () =>
      toCategoryPoints(
        finance.payments,
        (payment) => humanize(payment.method),
        (payment) => safeNumber(payment.amount),
      ),
    [finance.payments],
  );

  const costTypePoints = useMemo(
    () =>
      toCategoryPoints(
        finance.costs,
        (cost) => humanize(cost.type),
        (cost) => safeNumber(cost.amount),
      ),
    [finance.costs],
  );

  const invoiceStatusPoints = useMemo(
    () =>
      toCategoryPoints(
        finance.invoices,
        (invoice) => humanize(invoice.status),
        () => 1,
      ),
    [finance.invoices],
  );

  if (finance.isLoading) {
    return (
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Collections by method" isLoading>
            <div />
          </ChartCard>
        </div>
        <ChartCard title="Costs by type" isLoading>
          <div />
        </ChartCard>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <ChartCard
          title="Finance overview"
          description={`Invoiced ${formatMoney(totals.invoiced)} · Collected ${formatMoney(
            totals.collected,
          )} · Outstanding ${formatMoney(totals.outstanding)} · Costs ${formatMoney(
            totals.costs,
          )}`}
          isEmpty={
            finance.invoices.length === 0 &&
            finance.payments.length === 0 &&
            finance.costs.length === 0
          }
          emptyMessage="No finance records yet"
        >
          <BarList
            points={[
              { label: "Invoiced", value: totals.invoiced },
              { label: "Collected", value: totals.collected },
              { label: "Outstanding", value: totals.outstanding },
              { label: "Costs", value: totals.costs },
            ]}
            valueFormat={(value) => formatMoney(value)}
          />
        </ChartCard>
      </div>

      <ChartCard
        title="Collections by method"
        description="Share of BANK / CASH / CREDIT_NOTE collections."
        isEmpty={finance.payments.length === 0}
        emptyMessage="No payments yet"
      >
        <DonutChart
          points={methodPoints}
          centerLabel="Collected"
          centerValue={formatMoney(totals.collected)}
          valueFormat={(value) => formatMoney(value)}
        />
      </ChartCard>

      <ChartCard
        title="Costs by type"
        description="Where money is spent most."
        isEmpty={finance.costs.length === 0}
        emptyMessage="No costs recorded yet"
      >
        <BarList
          points={costTypePoints}
          valueFormat={(value) => formatMoney(value)}
        />
      </ChartCard>

      <ChartCard
        title="Invoices by status"
        description="Distribution across the invoice lifecycle."
        isEmpty={finance.invoices.length === 0}
        emptyMessage="No invoices yet"
      >
        <DonutChart
          points={invoiceStatusPoints}
          centerLabel="Invoices"
          centerValue={String(finance.invoices.length)}
          valueFormat={(value) => String(value)}
        />
      </ChartCard>
    </div>
  );
}

export default function OpsDashboardView() {
  const data = useOpsDashboardData();
  const { hasPermission } = usePermissions();
  const canSeeFinance =
    hasPermission("finance.invoice.read") ||
    hasPermission("finance.payment.read") ||
    hasPermission("finance.cost.read");

  if (data.isLoading) {
    return <LoadingCard />;
  }

  const restockTone: "danger" | "warn" = data.outCount > 0 ? "danger" : "warn";
  const attentionItems = requireAttention([
    {
      key: "restock",
      icon: <HiOutlineExclamationTriangle className="h-4 w-4 text-amber-600" />,
      label: "Items to reorder",
      detail: "At or below reorder point",
      value: String(data.lowCount + data.outCount),
      href: CLIENT_ITEMS_PAGE,
      tone: restockTone,
    },
    {
      key: "orders",
      icon: <HiOutlineClipboardDocumentList className="h-4 w-4 text-amber-600" />,
      label: "Open production orders",
      detail: "Awaiting completion",
      value: String(data.openOrders.length),
      href: CLIENT_PRODUCTION_ORDERS_PAGE,
      tone: "warn",
    },
    {
      key: "inspections",
      icon: <HiOutlineBeaker className="h-4 w-4 text-sky-600" />,
      label: "Inspections in progress",
      detail: "Waiting for tests or review",
      value: String(data.openInspections.length),
      href: CLIENT_INSPECTIONS_PAGE,
      tone: "info",
    },
  ]);

  return (
    <div className="space-y-5">
      <DashboardHeader
        roleLabel="Operations"
        icon={<HiOutlineBuildingStorefront className="h-5 w-5" />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<HiOutlineCube className="h-5 w-5" />}
          label="Active Items"
          value={data.items.length}
          hint="Master item records"
          isLoading={data.isLoading}
        />
        <KpiCard
          icon={<HiOutlineBuildingStorefront className="h-5 w-5" />}
          label="Stock On Hand"
          value={data.stockPositions}
          hint="Total tracked units"
          isLoading={data.isLoading}
        />
        <KpiCard
          icon={<HiOutlineClipboardDocumentList className="h-5 w-5" />}
          label="Open Orders"
          value={data.openOrders.length}
          hint="Not yet completed"
          isLoading={data.isLoading}
        />
        <KpiCard
          icon={<HiOutlineBeaker className="h-5 w-5" />}
          label="Open Inspections"
          value={data.openInspections.length}
          hint="Awaiting review"
          isLoading={data.isLoading}
        />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <DataCard
            title="Active Production Orders"
            action={<ViewAllLink href={CLIENT_PRODUCTION_ORDERS_PAGE} />}
            isLoading={data.isLoading}
            isEmpty={data.openOrders.length === 0}
            emptyMessage="No active production orders."
          >
            <ProductionOrdersTable orders={data.openOrders} itemLookup={data.itemLookup} />
          </DataCard>

          <DataCard
            title="Inspections"
            action={<ViewAllLink href={CLIENT_INSPECTIONS_PAGE} />}
            isLoading={data.isLoading}
            isEmpty={data.inspections.length === 0}
            emptyMessage="No inspections recorded yet."
          >
            <InspectionsTable inspections={data.inspections} itemLookup={data.itemLookup} />
          </DataCard>

          <DataCard
            title="Recent Stock Movements"
            action={<ViewAllLink href={CLIENT_MOVEMENTS_PAGE} />}
            isLoading={data.isLoading}
            isEmpty={data.movements.length === 0}
            emptyMessage="No stock movements recorded yet."
          >
            <MovementsTable movements={data.movements} itemLookup={data.itemLookup} />
          </DataCard>
        </div>

        <div className="space-y-5">
          <DistributionCard data={data.warehouseStock} isLoading={data.isLoading} />
          <RequiresAttention items={attentionItems} />
        </div>
      </div>

      {/* Finance charts — permission-gated so restricted managers don't
          see (or query) finance data they lack access to. */}
      {canSeeFinance ? <FinanceSection /> : null}
    </div>
  );
}
