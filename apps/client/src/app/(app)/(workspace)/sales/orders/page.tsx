"use client";

import { HiOutlineShoppingCart } from "react-icons/hi2";
import {
  DataTable,
  humanize,
  PageHeader,
  StatusBadge,
  type Column,
} from "@/modules/workspace/components/ui";
import {
  AreaChart,
  BarList,
  ChartCard,
  ChartStatStrip,
  toCategoryPoints,
  toMonthlySeries,
} from "@/modules/workspace/components/charts";
import type { SalesOrderDto } from "@rona/types/sales";
import { useSalesOrders } from "@/modules/features/workspace/sales/hooks";

function formatMoney(value: string) {
  const amount = Number(value);
  if (Number.isNaN(amount)) return value;
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function SalesOrdersPage() {
  const { orders, isLoading } = useSalesOrders();

  const columns: Column<SalesOrderDto>[] = [
    {
      key: "orderNumber",
      header: "Order #",
      render: (row) => (
        <span className="font-mono text-xs font-medium text-zinc-900">
          {row.orderNumber}
        </span>
      ),
    },
    {
      key: "customerName",
      header: "Customer",
      render: (row) => <span className="text-zinc-700">{row.customerName ?? "â€”"}</span>,
    },
    {
      key: "orderDate",
      header: "Date",
      render: (row) => (
        <span className="font-mono text-xs text-zinc-600">
          {new Date(row.orderDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "total",
      header: "Total",
      className: "text-right",
      render: (row) => (
        <span className="font-mono text-xs tabular-nums text-zinc-900">
          {formatMoney(row.total)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const active = orders.filter(
    (order) => order.status !== "CANCELLED",
  );
  const totalValue = active.reduce((sum, order) => sum + Number(order.total), 0);
  const confirmedValue = orders
    .filter((order) =>
      ["CONFIRMED", "FULFILLING", "FULFILLED"].includes(order.status),
    )
    .reduce((sum, order) => sum + Number(order.total), 0);
  const draftCount = orders.filter((order) => order.status === "DRAFT").length;

  const valueSeries = toMonthlySeries(
    active,
    6,
    (order) => order.orderDate,
    (order) => Number(order.total),
    {
      key: "order-value",
      label: "Order value",
      color: "#18181b",
    },
  );

  const statusPoints = toCategoryPoints(
    orders,
    (order) => humanize(order.status),
    () => 1,
  );

  const topCustomers = toCategoryPoints(
    active,
    (order) => order.customerName ?? "Unknown",
    (order) => Number(order.total),
  );

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<HiOutlineShoppingCart className="h-4 w-4" />}
        title="Sales Orders"
        description="Sales orders with FIFO batch allocation and reservations."
      />

      <ChartStatStrip
        stats={[
          { label: "Pipeline value", value: formatMoney(String(totalValue)) },
          { label: "Confirmed value", value: formatMoney(String(confirmedValue)), tone: "emerald" },
          { label: "Draft orders", value: String(draftCount), tone: "amber" },
          { label: "Total orders", value: String(orders.length) },
        ]}
      />

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard
            title="Order value by month"
            description="Value of non-cancelled sales orders, last 6 months."
            isLoading={isLoading}
            isEmpty={orders.length === 0}
            emptyMessage="No sales orders yet"
          >
            <AreaChart
              series={valueSeries}
              valueFormat={(value) => formatMoney(String(value))}
            />
          </ChartCard>
        </div>

        <ChartCard
          title="Orders by status"
          description="Distribution across the order lifecycle."
          isLoading={isLoading}
          isEmpty={orders.length === 0}
          emptyMessage="No sales orders yet"
        >
          <BarList
            points={statusPoints}
            valueFormat={(value) => String(value)}
          />
        </ChartCard>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <ChartCard
          title="Top customers"
          description="Highest order value per customer."
          isLoading={isLoading}
          isEmpty={orders.length === 0}
          emptyMessage="No sales orders yet"
        >
          <BarList
            points={topCustomers}
            valueFormat={(value) => formatMoney(String(value))}
          />
        </ChartCard>

        <ChartCard
          title="Sales by month (order count)"
          description="Number of non-cancelled orders placed, last 6 months."
          isLoading={isLoading}
          isEmpty={orders.length === 0}
          emptyMessage="No sales orders yet"
        >
          <BarList
            points={toMonthlySeries(
              active,
              6,
              (order) => order.orderDate,
              () => 1,
              {
                key: "order-count",
                label: "Orders",
                color: "#18181b",
              },
            ).points}
            valueFormat={(value) => String(value)}
          />
        </ChartCard>
      </div>

      <DataTable
        columns={columns}
        rows={orders}
        isLoading={isLoading}
        emptyMessage="No sales orders yet"
        emptyDescription="Orders you create will appear here."
      />
    </div>
  );
}
