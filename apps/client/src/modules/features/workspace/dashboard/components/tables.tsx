"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { displayOr, formatQuantity } from "@/lib/format";
import { HiOutlineArchiveBox, HiOutlineBuildingStorefront } from "react-icons/hi2";
import { humanize, StatusBadge, TruncatedText } from "@/modules/workspace/components/ui";
import { Skeleton } from "@/components/custom/skeleton";
import type { AttendanceEvent, Employee } from "@rona/types/hr";
import type {
  ItemDto,
  MovementDto,
} from "@rona/types/inventory";
import type { ProductionOrderDto } from "@rona/types/manufacturing";
import type { InspectionDto } from "@rona/types/quality";
import type {
  ItemStockRow,
  StockStatus,
  WarehouseStock,
} from "../inventory-dashboard-hooks";

const TH =
  "px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap text-slate-500";
const TH_RIGHT = `${TH} text-right`;
const TD_MONO =
  "px-4 py-2.5 font-mono text-xs font-semibold text-slate-700 tabular-nums";
const TD_RIGHT = "px-4 py-2.5 text-right font-mono text-xs text-slate-700 tabular-nums";

export function formatTimestamp(value: string | Date): string {
  return format(new Date(value), "dd MMM yyyy HH:mm");
}

type StockFilter = "ALL" | "LOW" | "OUT";

const FILTER_TABS: { key: StockFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "LOW", label: "Low Stock" },
  { key: "OUT", label: "Out of Stock" },
];

const STATUS_META: Record<StockStatus, { label: string; className: string }> = {
  OUT: { label: "Out of Stock", className: "text-rose-700" },
  LOW: { label: "Low Stock", className: "text-amber-700" },
  OK: { label: "In Stock", className: "text-emerald-700" },
};

function csvCell(value: string | number): string {
  const text = String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(rows: ItemStockRow[]) {
  const header = ["SKU", "Item Name", "Category", "Warehouse/Location", "Current Stock", "Status"];
  const lines = rows.map((row) =>
    [
      csvCell(row.item.code),
      csvCell(row.item.name),
      csvCell(humanize(row.item.type)),
      csvCell(row.locations.join(" + ")),
      csvCell(row.onHand),
      csvCell(STATUS_META[row.status].label),
    ].join(","),
  );
  const csv = "\ufeff" + [header.join(","), ...lines].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "stock-report.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function LowStockTable({
  rows,
  isLoading,
}: {
  rows: ItemStockRow[];
  isLoading: boolean;
}) {
  const [filter, setFilter] = useState<StockFilter>("ALL");

  const visibleRows = rows.filter((row) =>
    filter === "ALL" ? true : row.status === filter,
  );

  const lowCount = rows.filter((row) => row.status === "LOW").length;
  const outCount = rows.filter((row) => row.status === "OUT").length;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-semibold text-slate-600">
            Stock to reorder
          </h2>
          <div className="flex rounded-md border border-slate-200 bg-slate-50 p-0.5">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={cn(
                  "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                  filter === tab.key
                    ? "bg-white text-slate-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                {tab.label}
                {tab.key === "LOW" ? ` (${lowCount})` : ""}
                {tab.key === "OUT" ? ` (${outCount})` : ""}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => downloadCsv(visibleRows)}
          disabled={rows.length === 0}
          className="inline-flex items-center justify-center gap-1.5 self-start rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40 sm:self-auto"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          </svg>
          Export View (CSV)
        </button>
      </header>

      {isLoading ? (
        <div className="space-y-2.5 px-4 py-4 sm:px-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4">
              <Skeleton className="h-3.5 w-14 shrink-0 rounded" />
              <Skeleton className="h-3.5 w-40 rounded" />
              <Skeleton className="h-3.5 flex-1 rounded" />
              <Skeleton className="h-3.5 w-16 shrink-0 rounded" />
              <Skeleton className="h-3.5 w-20 shrink-0 rounded" />
            </div>
          ))}
        </div>
      ) : visibleRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1.5 px-4 py-12 text-center">
          <HiOutlineArchiveBox className="h-8 w-8 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">
            {filter === "ALL"
              ? "No tracked stock yet."
              : filter === "LOW"
                ? "No items are low on stock."
                : "Nothing is out of stock right now."}
          </p>
          <p className="text-xs text-slate-500">
            Stock levels will appear here as items move through warehouses.
          </p>
          <Link
            href="/inventory/items"
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-primary/90"
          >
            <HiOutlineArchiveBox className="h-3.5 w-3.5" />
            {filter === "ALL" ? "Create an item" : "View items"}
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className={TH}>SKU</th>
                <th className={TH}>Item Name</th>
                <th className={TH}>Category</th>
                <th className={TH}>Warehouse / Location</th>
                <th className={`${TH_RIGHT}`}>Current Stock</th>
                <th className={TH}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 border-b border-slate-100">
              {visibleRows.map((row, index) => (
                <tr key={row.item.id} className={cn("transition-colors hover:bg-slate-50/60", index % 2 === 1 && "bg-slate-50/30")}>
                  <td className={TD_MONO}>{row.item.code}</td>
                  <td className="px-4 py-2 font-medium text-slate-800">
                    <TruncatedText value={row.item.name} maxWidthClass="max-w-44" />
                  </td>
                  <td className="px-4 py-2 text-slate-600">{humanize(row.item.type)}</td>
                  <td className="px-4 py-2 text-slate-600">
                    <TruncatedText
                      value={row.locations.join(", ")}
                      maxWidthClass="max-w-40"
                    />
                  </td>
                  <td className={TD_RIGHT}>{formatQuantity(row.onHand, "Units")}</td>
                  <td className={cn("px-4 py-2 font-semibold", STATUS_META[row.status].className)}>
                    {STATUS_META[row.status].label}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const BAR_CLASSES = [
  "bg-brand-teal",
  "bg-brand-aqua",
  "bg-brand-green",
  "bg-brand-sea",
  "bg-slate-400",
  "bg-brand-mint",
];

export function DistributionCard({
  data,
  isLoading,
}: {
  data: WarehouseStock[];
  isLoading: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 px-4 py-3 sm:px-5">
        <h2 className="text-xs font-semibold text-slate-600">
          Stock distribution
        </h2>
      </header>
      <div className="px-4 py-4 sm:px-5">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index}>
                <div className="mb-1 flex items-center justify-between gap-3">
                  <Skeleton className="h-3 w-24 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1.5 py-6 text-center">
            <HiOutlineBuildingStorefront className="h-8 w-8 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">
              No stock distributed
            </p>
            <p className="text-xs text-slate-500">
              Nothing has been recorded in any warehouse yet.
            </p>
            <Link
              href="/inventory/warehouses"
              className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-primary/90"
            >
              <HiOutlineBuildingStorefront className="h-3.5 w-3.5" />
              View warehouses
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((entry, index) => (
              <div key={entry.warehouse.id}>
                <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                  <span className="truncate font-medium text-slate-700">
                    {entry.warehouse.name}
                  </span>
                  <span className="shrink-0 font-mono text-slate-500 tabular-nums">
                    {entry.share}% · {formatQuantity(entry.onHand, "Units")}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cn(
                      "h-full rounded-full transition-colors",
                      BAR_CLASSES[index % BAR_CLASSES.length],
                    )}
                    style={{ width: `${Math.max(entry.share, 2)}%` }}
                  />
                </div>
              </div>
            ))}
            <p className="pt-1 text-[11px] text-slate-400">
              Share of tracked stock held in each warehouse (sums to 100%).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function MovementsTable({
  movements,
  itemLookup,
}: {
  movements: MovementDto[];
  itemLookup: Map<string, ItemDto>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
      <thead>
        <tr className="border-b border-slate-200 bg-slate-50/80">
          <th className={TH}>Date</th>
          <th className={TH}>Item</th>
          <th className={TH}>Type</th>
          <th className={`${TH_RIGHT}`}>Quantity</th>
          <th className={TH}>Reference</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 border-b border-slate-100">
        {movements.slice(0, 8).map((movement, index) => (
          <tr key={movement.id} className={cn("transition-colors hover:bg-slate-50/60", index % 2 === 1 && "bg-slate-50/30")}>
            <td className="px-4 py-2 whitespace-nowrap text-slate-600">
              {formatTimestamp(movement.createdAt)}
            </td>
            <td className="px-4 py-2 text-slate-600">
              <TruncatedText
                value={itemLookup.get(movement.itemId)?.name}
                maxWidthClass="max-w-44"
              />
            </td>
            <td className="px-4 py-2">
              <StatusBadge status={movement.type} />
            </td>
            <td className={TD_RIGHT}>{formatQuantity(movement.quantity, "Units")}</td>
            <td className="px-4 py-2 text-slate-600">
              <TruncatedText value={movement.reference} maxWidthClass="max-w-32" />
            </td>
          </tr>
        ))}
      </tbody>
            </table>
    </div>
  );
}

export function ProductionOrdersTable({
  orders,
  itemLookup,
}: {
  orders: ProductionOrderDto[];
  itemLookup: Map<string, ItemDto>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
      <thead>
        <tr className="border-b border-slate-200 bg-slate-50/80">
          <th className={TH}>Order</th>
          <th className={TH}>Item</th>
          <th className={TH}>Status</th>
          <th className={`${TH_RIGHT}`}>Planned</th>
          <th className={`${TH_RIGHT}`}>Produced</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 border-b border-slate-100">
        {orders.slice(0, 8).map((order, index) => (
          <tr key={order.id} className={cn("transition-colors hover:bg-slate-50/60", index % 2 === 1 && "bg-slate-50/30")}>
            <td className={TD_MONO}>{order.orderNumber}</td>
            <td className={TD_MONO}>
              <TruncatedText
                value={
                  order.itemName ??
                  itemLookup.get(order.itemId)?.name ??
                  "Unknown item"
                }
                maxWidthClass="max-w-36"
              />
            </td>
            <td className="px-4 py-2">
              <StatusBadge status={order.status} />
            </td>
            <td className={TD_RIGHT}>{formatQuantity(order.plannedQuantity, "Units")}</td>
            <td className={TD_RIGHT}>{formatQuantity(order.producedQuantity, "Units")}</td>
          </tr>
        ))}
      </tbody>
            </table>
    </div>
  );
}

const INSPECTION_TYPE_LABELS: Record<string, string> = {
  INCOMING: "Incoming",
  IN_PROCESS: "In Process",
  FINISHED_GOOD: "Finished Good",
};

export function InspectionsTable({
  inspections,
  itemLookup,
}: {
  inspections: InspectionDto[];
  itemLookup: Map<string, ItemDto>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
      <thead>
        <tr className="border-b border-slate-200 bg-slate-50/80">
          <th className={TH}>Inspection</th>
          <th className={TH}>Item</th>
          <th className={TH}>Type</th>
          <th className={TH}>Status</th>
          <th className={TH}>Created</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 border-b border-slate-100">
        {inspections.slice(0, 8).map((inspection, index) => (
          <tr key={inspection.id} className={cn("transition-colors hover:bg-slate-50/60", index % 2 === 1 && "bg-slate-50/30")}>
            <td className={TD_MONO}>{inspection.inspectionNumber}</td>
            <td className={TD_MONO}>
              <TruncatedText
                value={itemLookup.get(inspection.itemId)?.name}
                maxWidthClass="max-w-36"
              />
            </td>
            <td className="px-4 py-2 text-slate-600">
              {INSPECTION_TYPE_LABELS[inspection.type] ?? inspection.type}
            </td>
            <td className="px-4 py-2">
              <StatusBadge status={inspection.status} />
            </td>
            <td className="px-4 py-2 whitespace-nowrap text-slate-600">
              {formatTimestamp(inspection.createdAt)}
            </td>
          </tr>
        ))}
      </tbody>
            </table>
    </div>
  );
}

export interface SimpleLot {
  id: string;
  lotNumber: string;
  itemId: string;
  qualityStatus: string;
  receiptDate: Date | null;
  expiryDate: Date | null;
}

export function LotsTable({
  lots,
  itemLookup,
}: {
  lots: SimpleLot[];
  itemLookup: Map<string, ItemDto>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
      <thead>
        <tr className="border-b border-slate-200 bg-slate-50/80">
          <th className={TH}>Lot</th>
          <th className={TH}>Item</th>
          <th className={TH}>Quality</th>
          <th className={TH}>Receipt</th>
          <th className={TH}>Expiry</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 border-b border-slate-100">
        {lots.slice(0, 8).map((lot, index) => (
          <tr key={lot.id} className={cn("transition-colors hover:bg-slate-50/60", index % 2 === 1 && "bg-slate-50/30")}>
            <td className={TD_MONO}>{lot.lotNumber}</td>
            <td className={TD_MONO}>
              <TruncatedText
                value={itemLookup.get(lot.itemId)?.name}
                maxWidthClass="max-w-36"
              />
            </td>
            <td className="px-4 py-2">
              <StatusBadge status={lot.qualityStatus} />
            </td>
            <td className="px-4 py-2 whitespace-nowrap text-slate-600">
              {lot.receiptDate ? formatTimestamp(lot.receiptDate) : "N/A"}
            </td>
            <td className="px-4 py-2 whitespace-nowrap text-slate-600">
              {lot.expiryDate ? formatTimestamp(lot.expiryDate) : "N/A"}
            </td>
          </tr>
        ))}
      </tbody>
            </table>
    </div>
  );
}

export function EmployeesTable({ employees }: { employees: Employee[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
      <thead>
        <tr className="border-b border-slate-200 bg-slate-50/80">
          <th className={TH}>EID</th>
          <th className={TH}>Name</th>
          <th className={TH}>Department</th>
          <th className={TH}>Position</th>
          <th className={TH}>Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 border-b border-slate-100">
        {employees.slice(0, 8).map((employee, index) => (
          <tr key={employee.id} className={cn("transition-colors hover:bg-slate-50/60", index % 2 === 1 && "bg-slate-50/30")}>
            <td className={TD_MONO}>{employee.eId}</td>
            <td className="px-4 py-2 font-medium text-slate-800">
              {employee.fullName}
            </td>
            <td className="px-4 py-2 text-slate-600">
              {displayOr(employee.departmentName)}
            </td>
            <td className="px-4 py-2 text-slate-600">
              {displayOr(employee.positionTitle)}
            </td>
            <td className="px-4 py-2">
              <StatusBadge status={employee.status} />
            </td>
          </tr>
        ))}
      </tbody>
            </table>
    </div>
  );
}

export function AttendanceEventsTable({
  events,
  nameLookup,
}: {
  events: AttendanceEvent[];
  nameLookup: Map<string, string>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
      <thead>
        <tr className="border-b border-slate-200 bg-slate-50/80">
          <th className={TH}>Time</th>
          <th className={TH}>Employee</th>
          <th className={TH}>Event</th>
          <th className={TH}>Recorded By</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 border-b border-slate-100">
        {events.slice(0, 8).map((event, index) => (
          <tr key={event.id} className={cn("transition-colors hover:bg-slate-50/60", index % 2 === 1 && "bg-slate-50/30")}>
            <td className="px-4 py-2 whitespace-nowrap text-slate-600">
              {formatTimestamp(event.eventAt)}
            </td>
            <td className="px-4 py-2 font-medium text-slate-800">
              <TruncatedText
                value={nameLookup.get(event.employeeId)}
                maxWidthClass="max-w-36"
              />
            </td>
            <td className="px-4 py-2">
              <StatusBadge status={event.eventType} />
            </td>
            <td className="px-4 py-2 text-slate-600">
              {displayOr(event.recordedBy)}
            </td>
          </tr>
        ))}
      </tbody>
            </table>
    </div>
  );
}
