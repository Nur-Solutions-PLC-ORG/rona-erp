"use client";

import Spinner from "@/components/custom/spinner";
import { Card } from "@/modules/workspace/components/ui";
import { useCurrentOrganization } from "@/modules/workspace/hooks";
import type { RoleKey } from "@rona/types/tenancy";
import EmployeeDashboardView from "./employee-view";
import FinanceDashboardView from "./finance-view";
import HrDashboardView from "./hr-view";
import OpsDashboardView from "./ops-view";
import ProductionDashboardView from "./production-view";
import QualityDashboardView from "./quality-view";
import SalesDashboardView from "./sales-view";
import WarehouseDashboardView from "./warehouse-view";

type DashboardKey =
  | "employee"
  | "warehouse"
  | "production"
  | "quality"
  | "hr"
  | "sales"
  | "finance"
  | "ops";

const BROAD_ROLES: RoleKey[] = ["OWNER", "ADMIN", "MANAGER"];

const FOCUSED_ROLES: { role: RoleKey; key: DashboardKey }[] = [
  { role: "WAREHOUSE_MANAGER", key: "warehouse" },
  { role: "PRODUCTION_MANAGER", key: "production" },
  { role: "QUALITY_MANAGER", key: "quality" },
  { role: "QUALITY_OFFICER", key: "quality" },
  { role: "HR_MANAGER", key: "hr" },
  { role: "HR_OFFICER", key: "hr" },
  { role: "SALES_MANAGER", key: "sales" },
  { role: "SALES_OFFICER", key: "sales" },
  { role: "FINANCE_MANAGER", key: "finance" },
  { role: "FINANCE_OFFICER", key: "finance" },
];

function dashboardKeyFor(roles: RoleKey[]): DashboardKey {
  const set = new Set(roles);
  if (BROAD_ROLES.some((role) => set.has(role))) return "ops";

  const focused = FOCUSED_ROLES.filter(({ role }) => set.has(role));
  if (focused.length === 1) return focused[0].key;
  if (focused.length > 1) return "ops";

  return "employee";
}

export default function DashboardRoot() {
  const { membership, isLoading } = useCurrentOrganization();
  const roles = (membership?.roles ?? []) as RoleKey[];

  if (isLoading && !membership) {
    return (
      <Card className="flex items-center justify-center px-4 py-16">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Spinner className="h-5 w-5 text-slate-500" />
          Loading your dashboard…
        </div>
      </Card>
    );
  }

  switch (dashboardKeyFor(roles)) {
    case "warehouse":
      return <WarehouseDashboardView />;
    case "production":
      return <ProductionDashboardView />;
    case "quality":
      return <QualityDashboardView />;
    case "hr":
      return <HrDashboardView />;
    case "sales":
      return <SalesDashboardView />;
    case "finance":
      return <FinanceDashboardView />;
    case "ops":
      return <OpsDashboardView />;
    default:
      return <EmployeeDashboardView />;
  }
}
