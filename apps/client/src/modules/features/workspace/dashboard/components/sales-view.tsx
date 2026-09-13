"use client";

import Link from "next/link";
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
          isLoading={data.isLoading}
        />
        <KpiCard
          icon={<HiOutlineBuildingOffice2 className="h-5 w-5" />}
          label="Open Order Value"
          value={data.totalOrderValue}
          hint="Sum of open order totals"
          unit="ETB"
          isLoading={data.isLoading}
        />
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
