"use client";

import { useMemo } from "react";
import {
  HiOutlineBeaker,
  HiOutlineCheckCircle,
  HiOutlineClipboardDocumentCheck,
  HiOutlineShieldCheck,
  HiOutlineXCircle,
} from "react-icons/hi2";
import {
  CLIENT_INSPECTIONS_PAGE,
  CLIENT_LOTS_PAGE,
} from "@rona/routes/workspace";
import {
  AreaChart,
  ChartCard,
  DonutChart,
  humanize,
  toCategoryPoints,
  toMonthlySeries,
} from "@/modules/workspace/components/charts";
import { formatCount } from "@/lib/format";
import { useQualityDashboardData } from "../role-hooks";
import {
  DashboardHeader,
  DataCard,
  KpiCard,
  LoadingCard,
  RequiresAttention,
  requireAttention,
  ViewAllLink,
} from "./shell";
import { InspectionsTable, LotsTable } from "./tables";

export default function QualityDashboardView() {
  const data = useQualityDashboardData();

  const monthlyInspections = useMemo(
    () =>
      toMonthlySeries(
        data.inspections,
        6,
        (inspection) => inspection.createdAt,
        () => 1,
        { key: "inspections", label: "Inspections", color: "#0ea5e9" },
      ),
    [data.inspections],
  );

  const inspectionsByStatus = useMemo(
    () =>
      toCategoryPoints(
        data.inspections,
        (inspection) => humanize(inspection.status),
        () => 1,
      ),
    [data.inspections],
  );

  if (data.isLoading) {
    return <LoadingCard />;
  }

  const attentionItems = requireAttention([
    {
      key: "inspections",
      icon: <HiOutlineBeaker className="h-4 w-4 text-amber-600" />,
      label: "Inspections in progress",
      detail: "Waiting for tests or review",
      value: String(data.openInspections),
      href: CLIENT_INSPECTIONS_PAGE,
      tone: "warn",
    },
    {
      key: "quarantine",
      icon: <HiOutlineXCircle className="h-4 w-4 text-rose-600" />,
      label: "Quarantined lots",
      detail: "Held from allocation",
      value: String(data.quarantinedLots),
      href: CLIENT_LOTS_PAGE,
      tone: "danger",
    },
    {
      key: "rejected",
      icon: <HiOutlineXCircle className="h-4 w-4 text-rose-600" />,
      label: "Rejected lots",
      detail: "Not fit for use",
      value: String(data.rejectedLots),
      href: CLIENT_LOTS_PAGE,
      tone: "danger",
    },
  ]);

  return (
    <div className="space-y-5">
      <DashboardHeader
        roleLabel="Quality Manager"
        icon={<HiOutlineShieldCheck className="h-5 w-5" />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<HiOutlineBeaker className="h-4 w-4" />}
          label="Open Inspections"
          value={data.openInspections}
          accent="warn"
          hint="Waiting for tests or review"
          isLoading={data.isLoading}
        />
        <KpiCard
          icon={<HiOutlineXCircle className="h-4 w-4" />}
          label="Quarantined Lots"
          value={data.quarantinedLots}
          accent="danger"
          hint="Held from allocation"
          isLoading={data.isLoading}
        />
        <KpiCard
          icon={<HiOutlineCheckCircle className="h-5 w-5" />}
          label="Approved / Released"
          value={data.approvedLots}
          hint="Available for use"
          isLoading={data.isLoading}
        />
        <KpiCard
          icon={<HiOutlineClipboardDocumentCheck className="h-5 w-5" />}
          label="Rejected Lots"
          value={data.rejectedLots}
          hint="Not fit for use"
          isLoading={data.isLoading}
        />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <ChartCard
            title="Inspections, last 6 months"
            description="Quality inspections recorded per month."
            isEmpty={data.inspections.length === 0}
            emptyMessage="No inspections yet"
          >
            <AreaChart
              series={monthlyInspections}
              valueFormat={(value) => formatCount(value)}
            />
          </ChartCard>
        </div>

        <ChartCard
          title="Inspections by status"
          description="Where inspections sit in the review flow."
          isEmpty={data.inspections.length === 0}
          emptyMessage="No inspections yet"
        >
          <DonutChart
            points={inspectionsByStatus}
            centerLabel="Inspections"
            centerValue={formatCount(data.inspections.length)}
            valueFormat={(value) => String(value)}
          />
        </ChartCard>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <div className="min-w-0 space-y-5 lg:col-span-2">
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
            title="Lot Quality Status"
            action={<ViewAllLink href={CLIENT_LOTS_PAGE} />}
            isLoading={data.isLoading}
            isEmpty={data.lots.length === 0}
            emptyMessage="No lots recorded yet."
          >
            <LotsTable lots={data.lots} itemLookup={data.itemLookup} />
          </DataCard>
        </div>

        <RequiresAttention items={attentionItems} />
      </div>
    </div>
  );
}
