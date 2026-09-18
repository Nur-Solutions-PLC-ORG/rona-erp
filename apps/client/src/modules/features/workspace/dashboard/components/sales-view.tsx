"use client";

import Link from "next/link";
import { useMemo } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatCount, formatMoney } from "@/lib/format";
import {
  HiOutlineBuildingOffice2,
  HiOutlineCheckCircle,
  HiOutlineClipboardDocumentList,
  HiOutlineShoppingBag,
  HiOutlineUsers,
} from "react-icons/hi2";
import {
  CLIENT_CUSTOMERS_PAGE,
  CLIENT_SALES_ORDERS_PAGE,
} from "@rona/routes/workspace";
import {
  AreaChart,
  BarChart,
  BarList,
  ChartCard,
  DonutChart,
  FunnelChart,
  humanize,
  toCategoryPoints,
  toMonthlySeries,
  toDailySeries,
} from "@/modules/workspace/components/charts";
import { useSalesDashboardData } from "../role-hooks";
import {
  DashboardHeader,
  DataCard,
  KpiCard,
  LoadingCard,
  ViewAllLink,
} from "./shell";
import { StatusBadge, TruncatedText } from "@/modules/workspace/components/ui";

const TH =
  "px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap text-slate-500";
const TH_RIGHT = `${TH} text-right`;
const TD_MONO =
  "px-4 py-2.5 font-mono text-xs font-semibold text-slate-700 tabular-nums";
const TD_RIGHT =
  "px-4 py-2.5 text-right font-mono text-xs text-slate-700 tabular-nums";

export default function SalesDashboardView() {
  const data = useSalesDashboardData();

  const monthlySales = useMemo(
    () =>
      toMonthlySeries(
        data.orders,
        6,
        (order) => order.orderDate,
        (order) => Number(order.total) || 0,
        { key: "sales", label: "Order value", color: "#4f46e5" },
      ),
    [data.orders],
  );

  const ordersByStatus = useMemo(
    () =>
      toCategoryPoints(data.orders, (order) => humanize(order.status), () => 1),
    [data.orders],
  );

  const topCustomers = useMemo(
    () =>
      toCategoryPoints(
        data.orders,
        (order) => order.customerName ?? "Unknown customer",
        (order) => Number(order.total) || 0,
      ),
    [data.orders],
  );

  const dailyOrders = useMemo(
    () =>
      toDailySeries(
        data.orders,
        30,
        (order) => order.orderDate,
        () => 1,
        { key: "orders", label: "Orders", color: "#4f46e5" },
      ),
    [data.orders],
  );

  const monthlyFulfilled = useMemo(
    () =>
      toMonthlySeries(
        data.fulfilledOrders,
        6,
        (order) => order.fulfilledAt ?? order.orderDate,
        () => 1,
        { key: "fulfilled", label: "Fulfilled", color: "#10b981" },
      ),
    [data.fulfilledOrders],
  );

  const monthlyOpenValue = useMemo(
    () =>
      toMonthlySeries(
        data.openOrders,
        6,
        (order) => order.orderDate,
        (order) => Number(order.total) || 0,
        { key: "open-value", label: "Open value", color: "#7c3aed" },
      ),
    [data.openOrders],
  );

  const pipeline = useMemo(
    () => [
      {
        label: "Draft",
        value: data.orders.filter((order) => order.status === "DRAFT").length,
        color: "bg-slate-400",
      },
      {
        label: "Confirmed",
        value: data.orders.filter((order) => order.status === "CONFIRMED").length,
        color: "bg-indigo-500",
      },
      {
        label: "Fulfilling",
        value: data.orders.filter((order) => order.status === "FULFILLING").length,
        color: "bg-violet-500",
      },
      {
        label: "Fulfilled",
        value: data.fulfilledOrders.length,
        color: "bg-emerald-500",
      },
    ],
    [data.orders, data.fulfilledOrders],
  );

  if (data.isLoading) {
    return <LoadingCard />;
  }

  return (
    <div className="space-y-5">
      <DashboardHeader
        roleLabel="Sales"
        icon={<HiOutlineShoppingBag className="h-5 w-5" />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<HiOutlineUsers className="h-5 w-5" />}
          label="Active Customers"
          value={data.activeCustomers.length}
          hint={`${formatCount(data.customers.length)} total records`}
          isLoading={data.isLoading}
        />
        <KpiCard
          icon={<HiOutlineClipboardDocumentList className="h-5 w-5" />}
          label="Open Orders"
          value={data.openOrders.length}
          hint="Not yet fulfilled"
          isLoading={data.isLoading}
        />
        <KpiCard
          icon={<HiOutlineCheckCircle className="h-5 w-5" />}
          label="Fulfilled Orders"
          value={data.fulfilledOrders.length}
          hint="Completed deliveries"
          spark={monthlyFulfilled.points.map((point) => point.value)}
          sparkColor="#10b981"
          isLoading={data.isLoading}
        />
        <KpiCard
          icon={<HiOutlineBuildingOffice2 className="h-5 w-5" />}
          label="Open Order Value"
          value={data.totalOrderValue}
          hint="Sum of open order totals"
          unit="ETB"
          spark={monthlyOpenValue.points.map((point) => point.value)}
          sparkColor="#7c3aed"
          isLoading={data.isLoading}
        />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard
            title="Order value, last 6 months"
            description="Monthly sum of sales order totals."
            isEmpty={data.orders.length === 0}
            emptyMessage="No sales orders yet"
          >
            <AreaChart
              series={monthlySales}
              valueFormat={(value) => formatMoney(value, "ETB")}
            />
          </ChartCard>
        </div>

        <ChartCard
          title="Order pipeline"
          description="Orders sitting at each stage, with step conversion."
          isEmpty={data.orders.length === 0}
          emptyMessage="No sales orders yet"
        >
          <FunnelChart
            stages={pipeline}
            valueFormat={(value) => formatCount(value)}
          />
        </ChartCard>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard
            title="Orders per day, last 30 days"
            description="Daily order count."
            isEmpty={data.orders.length === 0}
            emptyMessage="No sales orders yet"
          >
            <BarChart series={[dailyOrders]} />
          </ChartCard>
        </div>

        <ChartCard
          title="Orders by status"
          description="Distribution across the order lifecycle."
          isEmpty={data.orders.length === 0}
          emptyMessage="No sales orders yet"
        >
          <DonutChart
            points={ordersByStatus}
            centerLabel="Orders"
            centerValue={formatCount(data.orders.length)}
            valueFormat={(value) => String(value)}
          />
        </ChartCard>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <DataCard
            title="Recent Sales Orders"
            action={<ViewAllLink href={CLIENT_SALES_ORDERS_PAGE} />}
            isEmpty={data.recentOrders.length === 0}
            emptyMessage="No sales orders yet."
            emptyDescription="Orders you create for customers appear here."
            emptyAction={
              <Link
                href={CLIENT_SALES_ORDERS_PAGE}
                className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-purple-700"
              >
                <HiOutlineClipboardDocumentList className="h-3.5 w-3.5" />
                Create an order
              </Link>
            }
          >
            <SalesOrdersTable orders={data.recentOrders} />
          </DataCard>
        </div>

        <div className="space-y-5">
          <ChartCard
            title="Top customers"
            description="Customers ranked by total order value."
            isEmpty={data.orders.length === 0}
            emptyMessage="No sales orders yet"
          >
            <BarList
              points={topCustomers}
              valueFormat={(value) => formatMoney(value, "ETB")}
            />
          </ChartCard>

          <DataCard
            title="Customers"
            action={<ViewAllLink href={CLIENT_CUSTOMERS_PAGE} />}
            isEmpty={data.customers.length === 0}
            emptyMessage="No customers yet."
            emptyDescription="Add your customers to start taking orders."
            emptyAction={
              <Link
                href={CLIENT_CUSTOMERS_PAGE}
                className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-purple-700"
              >
                <HiOutlineUsers className="h-3.5 w-3.5" />
                Add a customer
              </Link>
            }
          >
            <CustomersTable customers={data.customers} />
          </DataCard>
        </div>
      </div>
    </div>
  );
}

function SalesOrdersTable({ orders }: { orders: SalesOrderRow[] }) {
  return (
    <table className="w-full text-[13px]">
      <thead>
        <tr className="border-b border-slate-200 bg-slate-50/80">
          <th className={TH}>Order</th>
          <th className={TH}>Customer</th>
          <th className={TH}>Status</th>
          <th className={TH}>Date</th>
          <th className={`${TH_RIGHT}`}>Total</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 border-b border-slate-100">
        {orders.map((order, index) => (
          <tr
            key={order.id}
            className={cn(
              "transition-colors hover:bg-slate-50/60",
              index % 2 === 1 && "bg-slate-50/30",
            )}
          >
            <td className={TD_MONO}>{order.orderNumber}</td>
            <td className="px-4 py-2 text-slate-600">
              <TruncatedText value={order.customerName} maxWidthClass="max-w-40" />
            </td>
            <td className="px-4 py-2">
              <StatusBadge status={order.status} />
            </td>
            <td className="px-4 py-2 whitespace-nowrap text-slate-600">
              {format(new Date(order.orderDate), "dd MMM yyyy")}
            </td>
            <td className={TD_RIGHT}>{formatMoney(order.total, "ETB")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CustomersTable({ customers }: { customers: CustomerRow[] }) {
  return (
    <table className="w-full text-[13px]">
      <thead>
        <tr className="border-b border-slate-200 bg-slate-50/80">
          <th className={TH}>Name</th>
          <th className={TH}>Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 border-b border-slate-100">
        {customers.slice(0, 8).map((customer, index) => (
          <tr
            key={customer.id}
            className={cn(
              "transition-colors hover:bg-slate-50/60",
              index % 2 === 1 && "bg-slate-50/30",
            )}
          >
            <td className="px-4 py-2 font-medium text-slate-800">
              <TruncatedText value={customer.name} maxWidthClass="max-w-44" />
            </td>
            <td className="px-4 py-2">
              <StatusBadge status={customer.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

type SalesOrderRow = ReturnType<typeof useSalesDashboardData>["orders"][number];
type CustomerRow = ReturnType<typeof useSalesDashboardData>["customers"][number];
