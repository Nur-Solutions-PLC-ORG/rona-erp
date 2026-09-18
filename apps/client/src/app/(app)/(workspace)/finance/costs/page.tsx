"use client";

import { useState } from "react";
import { HiOutlineChartPie, HiOutlinePlus } from "react-icons/hi2";
import {
  BTN_PRIMARY,
  DataTable,
  humanize,
  PageHeader,
  type Column,
} from "@/modules/workspace/components/ui";
import {
  AreaChart,
  BarList,
  ChartCard,
  ChartStatStrip,
  DonutChart,
  toCategoryPoints,
  toMonthlySeries,
} from "@/modules/workspace/components/charts";
import type { CostDto } from "@rona/types/finance";
import { usePermissions } from "@/modules/workspace/hooks";
import { useCosts } from "@/modules/features/workspace/finance/hooks";
import { RecordCostModal } from "@/modules/features/workspace/finance/record-modals";

function formatMoney(value: string) {
  const amount = Number(value);
  if (Number.isNaN(amount)) return value;
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function FinanceCostsPage() {
  const { costs, isLoading } = useCosts();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission("finance.cost.create");
  const [isRecordOpen, setIsRecordOpen] = useState(false);

  const columns: Column<CostDto>[] = [
    {
      key: "description",
      header: "Description",
      render: (row) => (
        <span className="font-medium text-zinc-900">{row.description}</span>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (row) => <span className="text-zinc-700">{humanize(row.type)}</span>,
    },
    {
      key: "costCenterName",
      header: "Cost Center",
      render: (row) => (
        <span className="text-zinc-600">{row.costCenterName ?? "—"}</span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      className: "text-right",
      render: (row) => (
        <span className="money text-xs font-semibold text-zinc-900">
          {formatMoney(row.amount)}
        </span>
      ),
    },
    {
      key: "costDate",
      header: "Date",
      render: (row) => (
        <span className="tabular text-xs text-zinc-600">
          {new Date(row.costDate).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const totalCosts = costs.reduce((sum, cost) => sum + Number(cost.amount), 0);

  const typePoints = toCategoryPoints(
    costs,
    (cost) => humanize(cost.type),
    (cost) => Number(cost.amount),
  );

  const costSeries = toMonthlySeries(
    costs,
    6,
    (cost) => cost.costDate,
    (cost) => Number(cost.amount),
    {
      key: "costs",
      label: "Recorded costs",
      color: "#e11d48",
    },
  );

  const thisMonth = new Date().getMonth();
  const monthCosts = costs
    .filter((cost) => new Date(cost.costDate).getMonth() === thisMonth)
    .reduce((sum, cost) => sum + Number(cost.amount), 0);

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<HiOutlineChartPie className="h-4 w-4" />}
        title="Costs"
        description="Operational costs by category and cost center."
        actions={
          canCreate ? (
            <button
              type="button"
              className={BTN_PRIMARY}
              onClick={() => setIsRecordOpen(true)}
            >
              <HiOutlinePlus className="h-4 w-4" />
              Record cost
            </button>
          ) : undefined
        }
      />

      <RecordCostModal open={isRecordOpen} onClose={() => setIsRecordOpen(false)} />

      <ChartStatStrip
        stats={[
          { label: "Total costs", value: formatMoney(String(totalCosts)), tone: "rose" },
          { label: "Entries recorded", value: String(costs.length) },
          { label: "This month", value: formatMoney(String(monthCosts)), tone: "amber" },
          {
            label: "Average entry",
            value: formatMoney(
              String(costs.length > 0 ? totalCosts / costs.length : 0),
            ),
          },
        ]}
      />

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard
            title="Costs by month"
            description="Recorded operational costs, last 6 months."
            isLoading={isLoading}
            isEmpty={costs.length === 0}
            emptyMessage="No costs recorded yet"
          >
            <AreaChart
              series={costSeries}
              valueFormat={(value) => formatMoney(String(value))}
            />
          </ChartCard>
        </div>

        <div className="space-y-4">
          <ChartCard
            title="Costs by type"
            description="Share of spend per category."
            isLoading={isLoading}
            isEmpty={costs.length === 0}
            emptyMessage="No costs recorded yet"
          >
            <DonutChart
              points={typePoints}
              centerLabel="Total"
              centerValue={formatMoney(String(totalCosts))}
            />
          </ChartCard>
        </div>
      </div>

      <ChartCard
        title="Top cost categories"
        description="Where money is spent most."
        isLoading={isLoading}
        isEmpty={costs.length === 0}
        emptyMessage="No costs recorded yet"
      >
        <BarList
          points={typePoints}
          valueFormat={(value) => formatMoney(String(value))}
        />
      </ChartCard>

      <DataTable
        columns={columns}
        rows={costs}
        isLoading={isLoading}
        emptyMessage="No costs recorded yet"
        emptyDescription="Costs you record will appear here."
      />
    </div>
  );
}
