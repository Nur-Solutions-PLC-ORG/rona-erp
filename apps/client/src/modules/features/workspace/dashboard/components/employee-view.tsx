"use client";

import { EmptyState } from "@/modules/workspace/components/ui";
import {
  HiOutlineBuildingStorefront,
  HiOutlineCube,
  HiOutlineExclamationTriangle,
  HiOutlineXCircle,
} from "react-icons/hi2";
import { useInventoryDashboardData } from "../inventory-dashboard-hooks";
import { DashboardHeader, KpiCard, LoadingCard } from "./shell";
import { DistributionCard, LowStockTable } from "./tables";

export default function EmployeeDashboardView() {
  const data = useInventoryDashboardData();

  if (data.isLoading || data.keyResultsLoading) {
    return <LoadingCard />;
  }

  return (
    <div className="space-y-5">
      <DashboardHeader
        roleLabel="Read-Only Staff"
        icon={<HiOutlineCube className="h-5 w-5" />}
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
          icon={<HiOutlineBuildingStorefront className="h-5 w-5" />}
          label="Assigned Warehouses"
          value={data.warehouseStock.length}
          hint={
            data.primaryWarehouse
              ? `Main: ${data.primaryWarehouse.name}`
              : "No active warehouses"
          }
          isLoading={data.isLoading}
        />
      </div>

      <div className="space-y-5">
        {data.itemRows.length === 0 ? (
          <EmptyState
            icon={<HiOutlineCube className="h-6 w-6" />}
            title="No tracked stock"
            description="Once items are received into a warehouse, their stock levels appear here."
          />
        ) : (
          <LowStockTable rows={data.itemRows} isLoading={data.isLoading} />
        )}
        <DistributionCard data={data.warehouseStock} isLoading={data.isLoading} />
      </div>
    </div>
  );
}
