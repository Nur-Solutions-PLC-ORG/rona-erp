"use client";

import { EmptyState } from "@/modules/workspace/components/ui";
import {
  HiOutlineBuildingStorefront,
  HiOutlineCube,
  HiOutlineCursorArrowRipple,
  HiOutlineExclamationTriangle,
  HiOutlineXCircle,
} from "react-icons/hi2";
import {
  CLIENT_ITEMS_PAGE,
  CLIENT_MOVEMENTS_PAGE,
  CLIENT_RESERVATIONS_PAGE,
} from "@rona/routes/workspace";
import { useWarehouseDashboardData } from "../role-hooks";
import {
  DashboardHeader,
  DataCard,
  KpiCard,
  LoadingCard,
  RequiresAttention,
  requireAttention,
  ViewAllLink,
} from "./shell";
import { DistributionCard, LowStockTable, MovementsTable } from "./tables";

export default function WarehouseDashboardView() {
  const data = useWarehouseDashboardData();

  if (data.isLoading) {
    return <LoadingCard />;
  }

  const attentionItems = requireAttention([
    {
      key: "low",
      icon: <HiOutlineExclamationTriangle className="h-4 w-4 text-amber-600" />,
      label: "Low stock items",
      detail: "At or below reorder point",
      value: String(data.lowCount),
      href: CLIENT_ITEMS_PAGE,
      tone: "warn",
    },
    {
      key: "out",
      icon: <HiOutlineXCircle className="h-4 w-4 text-rose-600" />,
      label: "Out of stock",
      detail: "Zero on-hand balance",
      value: String(data.outCount),
      href: CLIENT_ITEMS_PAGE,
      tone: "danger",
    },
    {
      key: "reservations",
      icon: <HiOutlineCursorArrowRipple className="h-4 w-4 text-sky-600" />,
      label: "Active reservations",
      detail: "Allocated for fulfillment",
      value: String(data.activeReservations.length),
      href: CLIENT_RESERVATIONS_PAGE,
      tone: "info",
    },
  ]);

  return (
    <div className="space-y-5">
      <DashboardHeader
        roleLabel="Warehouse Manager"
        icon={<HiOutlineBuildingStorefront className="h-5 w-5" />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<HiOutlineCube className="h-5 w-5" />}
          label="Total Tracked Items"
          value={data.items.length}
          hint="Master item records"
          isLoading={data.isLoading}
        />
        <KpiCard
          icon={<HiOutlineExclamationTriangle className="h-4 w-4" />}
          label="Low Stock Items"
          value={data.lowCount}
          hint="At or below reorder point"
          accent="warn"
          isLoading={data.isLoading}
        />
        <KpiCard
          icon={<HiOutlineXCircle className="h-4 w-4" />}
          label="Out of Stock"
          value={data.outCount}
          hint="Zero on-hand balance"
          accent="danger"
          isLoading={data.isLoading}
        />
        <KpiCard
          icon={<HiOutlineCursorArrowRipple className="h-5 w-5" />}
          label="Active Reservations"
          value={data.activeReservations.length}
          hint={
            data.activeReservations.length > 0
              ? "Allocated for fulfillment"
              : "No open allocations"
          }
          isLoading={data.reservationsLoading}
        />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {data.itemRows.length === 0 ? (
            <EmptyState
              icon={<HiOutlineCube className="h-6 w-6" />}
              title="No tracked stock"
              description="Once items are received into a warehouse, their stock levels appear here."
            />
          ) : (
            <LowStockTable rows={data.itemRows} isLoading={data.isLoading} />
          )}
          <DataCard
            title="Recent Stock Movements"
            action={<ViewAllLink href={CLIENT_MOVEMENTS_PAGE} />}
            isLoading={data.movementsLoading}
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
    </div>
  );
}
