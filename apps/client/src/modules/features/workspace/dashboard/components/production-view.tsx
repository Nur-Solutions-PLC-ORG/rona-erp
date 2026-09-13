"use client";

import {
  HiOutlineClipboardDocumentList,
  HiOutlineClock,
  HiOutlineCog8Tooth,
  HiOutlineCube,
} from "react-icons/hi2";
import {
  CLIENT_MOVEMENTS_PAGE,
  CLIENT_PRODUCTION_ORDERS_PAGE,
} from "@rona/routes/workspace";
import { useProductionDashboardData } from "../role-hooks";
import {
  DashboardHeader,
  DataCard,
  KpiCard,
  LoadingCard,
  RequiresAttention,
  requireAttention,
  ViewAllLink,
} from "./shell";
import { MovementsTable, ProductionOrdersTable } from "./tables";

export default function ProductionDashboardView() {
  const data = useProductionDashboardData();

  if (data.isLoading) {
    return <LoadingCard />;
  }

  const attentionItems = requireAttention([
    {
      key: "execution",
      icon: <HiOutlineCog8Tooth className="h-4 w-4 text-amber-600" />,
      label: "Orders awaiting execution",
      detail: "Draft, planned or approved",
      value: String(data.awaitingExecution),
      href: CLIENT_PRODUCTION_ORDERS_PAGE,
      tone: "warn",
    },
    {
      key: "progress",
      icon: <HiOutlineClock className="h-4 w-4 text-sky-600" />,
      label: "Orders in progress",
      detail: "Actively producing",
      value: String(data.inProgress),
      href: CLIENT_PRODUCTION_ORDERS_PAGE,
      tone: "info",
    },
  ]);

  return (
    <div className="space-y-5">
      <DashboardHeader
        roleLabel="Production Manager"
        icon={<HiOutlineCog8Tooth className="h-5 w-5" />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<HiOutlineClipboardDocumentList className="h-5 w-5" />}
          label="Open Orders"
          value={data.openOrders.length}
          hint="Not yet completed"
          isLoading={data.isLoading}
        />
        <KpiCard
          icon={<HiOutlineClock className="h-4 w-4" />}
          label="In Progress"
          value={data.inProgress}
          accent="warn"
          hint="Actively producing"
          isLoading={data.isLoading}
        />
        <KpiCard
          icon={<HiOutlineCog8Tooth className="h-5 w-5" />}
          label="Awaiting Execution"
          value={data.awaitingExecution}
          hint="Draft, planned or approved"
          isLoading={data.isLoading}
        />
        <KpiCard
          icon={<HiOutlineCube className="h-5 w-5" />}
          label="Stock Positions"
          value={data.stockPositions}
          hint="Items with on-hand stock"
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
            title="Recent Stock Movements"
            action={<ViewAllLink href={CLIENT_MOVEMENTS_PAGE} />}
            isLoading={data.isLoading}
            isEmpty={data.movements.length === 0}
            emptyMessage="No stock movements recorded yet."
          >
            <MovementsTable movements={data.movements} itemLookup={data.itemLookup} />
          </DataCard>
        </div>

        <RequiresAttention items={attentionItems} />
      </div>
    </div>
  );
}
