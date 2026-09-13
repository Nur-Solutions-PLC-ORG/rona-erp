"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  HiOutlineArchiveBox,
  HiOutlineArrowsRightLeft,
  HiOutlineBookmarkSquare,
  HiOutlineBuildingStorefront,
  HiOutlineCalendarDays,
  HiOutlineClipboard,
  HiOutlineCog6Tooth,
  HiOutlineCube,
  HiOutlineDocumentCheck,
  HiOutlineDocumentText,
  HiOutlineExclamationTriangle,
  HiOutlineFingerPrint,
  HiOutlineHome,
  HiOutlineMagnifyingGlass,
  HiOutlineQueueList,
  HiOutlineUsers,
} from "react-icons/hi2";

const BAR_FILL = "#18181B";
const SCENE_MS = 5000;

const SCENES = ["dashboard", "movements", "items", "trace"] as const;
type SceneId = (typeof SCENES)[number];

const SCENE_LABEL: Record<SceneId, string> = {
  dashboard: "Dashboard",
  movements: "Movements",
  items: "Items",
  trace: "Lot trace",
};

const navChips = SCENES.map((id) => ({
  scene: id,
  label: SCENE_LABEL[id],
}));

const sidebar = [
  { icon: HiOutlineHome, label: "Dashboard", scene: "dashboard" as SceneId },
  { icon: HiOutlineCube, label: "Items", scene: "items" as SceneId },
  { icon: HiOutlineBuildingStorefront, label: "Warehouses", scene: "items" as SceneId },
  { icon: HiOutlineArrowsRightLeft, label: "Movements", scene: "movements" as SceneId },
  { icon: HiOutlineArchiveBox, label: "Stock", scene: "items" as SceneId },
  { icon: HiOutlineQueueList, label: "Reservations", scene: "movements" as SceneId },
  { icon: HiOutlineClipboard, label: "Inspections", scene: "movements" as SceneId },
  { icon: HiOutlineFingerPrint, label: "Traceability", scene: "trace" as SceneId },
  { icon: HiOutlineUsers, label: "Employees", scene: "dashboard" as SceneId },
  { icon: HiOutlineCalendarDays, label: "Attendance", scene: "dashboard" as SceneId },
];

const kpis = [
  { label: "Total Items", value: "24", trend: "+3", up: true },
  { label: "On Hand Value", value: "84.2K", trend: "+12%", up: true },
  { label: "Warehouses", value: "4", trend: "", up: true },
  { label: "Open Orders", value: "7", trend: "-2", up: false },
  { label: "Lots Active", value: "38", trend: "+5", up: true },
  { label: "Quarantined", value: "2", trend: "+1", up: false },
];

const warehouseBars = [
  { label: "Main WH", pct: 78, qty: "12,480" },
  { label: "Cold Store", pct: 52, qty: "4,160" },
  { label: "Transit Hub", pct: 31, qty: "2,480" },
  { label: "FG Store", pct: 65, qty: "5,200" },
];

const movements = [
  { ref: "PO-2026-001", item: "Wheat Flour", qty: "+500 KG", source: "Ethio Grain Co.", type: "Inbound", status: "Approved" },
  { ref: "PO-2026-010", item: "White Sugar", qty: "+300 KG", source: "Sugar plc", type: "Inbound", status: "Quarantined" },
  { ref: "PO-2026-011", item: "Yeast Active", qty: "+50 KG", source: "BioTech Ltd.", type: "Inbound", status: "Approved" },
  { ref: "PO-2025-090", item: "Wheat Flour", qty: "+200 KG", source: "Old Mill Ltd.", type: "Inbound", status: "Expired" },
  { ref: "TR-2026-003", item: "Wheat Flour", qty: "200 KG", source: "Main WH → Transit", type: "Transfer", status: "Approved" },
  { ref: "FG-LOT-2026-001", item: "Bread Loaf", qty: "+95 PCS", source: "BOM-BREAD", type: "Production", status: "Produced" },
  { ref: "IS-2026-005", item: "White Sugar", qty: "-25 KG", source: "Batch #44", type: "Outbound", status: "Approved" },
  { ref: "TR-2026-004", item: "Yeast Active", qty: "15 KG", source: "Main WH → Cold", type: "Transfer", status: "Approved" },
];

const itemsRows = [
  { code: "RM-FLOUR", item: "Wheat Flour", cat: "Raw Material", onHand: "700 KG", reorder: "200 KG", status: "Approved" },
  { code: "RM-SUGAR", item: "White Sugar", cat: "Raw Material", onHand: "450 KG", reorder: "150 KG", status: "Quarantined" },
  { code: "RM-YEAST", item: "Active Yeast", cat: "Raw Material", onHand: "35 KG", reorder: "20 KG", status: "Approved" },
  { code: "RM-SALT", item: "Salt Fine", cat: "Raw Material", onHand: "120 KG", reorder: "50 KG", status: "Approved" },
  { code: "FG-BREAD", item: "Bread Loaf", cat: "Finished Good", onHand: "95 PCS", reorder: "100 PCS", status: "Produced" },
  { code: "FG-ROLLS", item: "Dinner Rolls", cat: "Finished Good", onHand: "240 PCS", reorder: "80 PCS", status: "Approved" },
  { code: "FG-CAKE", item: "Vanilla Cake", cat: "Finished Good", onHand: "12 PCS", reorder: "20 PCS", status: "Approved" },
  { code: "PK-BAG60", item: "Bread Bag 60cm", cat: "Packaging", onHand: "1,200 EA", reorder: "500 EA", status: "Approved" },
];

const attention = [
  { label: "White Sugar", detail: "Quarantined lot · LOT-2026-010", type: "warn" as const },
  { label: "Wheat Flour", detail: "Expired lot · LOT-2025-090", type: "error" as const },
  { label: "Vanilla Cake", detail: "Below reorder point (12 < 20)", type: "warn" as const },
];

const productionOrders = [
  { id: "PO-BREAD-044", item: "Bread Loaf", qty: "200 PCS", status: "In Progress", progress: 65 },
  { id: "PO-ROLLS-012", item: "Dinner Rolls", qty: "150 PCS", status: "Scheduled", progress: 0 },
  { id: "PO-CAKE-008", item: "Vanilla Cake", qty: "30 PCS", status: "Completed", progress: 100 },
];

const traceSteps = [
  { icon: HiOutlineArchiveBox, title: "Received", detail: "Wheat Flour · +500 KG", source: "Ethio Grain Co.", time: "09:12 AM" },
  { icon: HiOutlineClipboard, title: "Inspected", detail: "Quality inspection · approved", source: "QA gate", time: "09:45 AM" },
  { icon: HiOutlineBookmarkSquare, title: "Reserved", detail: "50 KG reserved for production", source: "PO-2026-001", time: "10:02 AM" },
  { icon: HiOutlineCog6Tooth, title: "Consumed", detail: "Consumed 50.0000 KG · AISLE-A-01", source: "BOM-BREAD", time: "11:30 AM" },
  { icon: HiOutlineDocumentText, title: "Produced", detail: "FG-LOT-2026-001 · 95% yield", source: "Bread Loaf", time: "02:15 PM" },
  { icon: HiOutlineDocumentCheck, title: "Inspected (FG)", detail: "Final QC · passed", source: "QA gate", time: "02:48 PM" },
  { icon: HiOutlineArchiveBox, title: "Stored", detail: "FG Store · Bin C-03", source: "FG Store", time: "03:10 PM" },
];

const recentActivity = [
  { time: "3:10 PM", text: "Bread Loaf stored in FG Store" },
  { time: "2:48 PM", text: "FG QC inspection passed" },
  { time: "2:15 PM", text: "Production order completed" },
  { time: "11:30 AM", text: "50 KG flour consumed" },
];

function StatusChip({ status }: { status: string }) {
  const tone =
    status === "Approved" || status === "Produced" || status === "Completed"
      ? "bg-emerald-50 text-emerald-700"
      : status === "Expired"
        ? "bg-rose-50 text-rose-700"
        : status === "In Progress"
          ? "bg-blue-50 text-blue-700"
          : status === "Scheduled"
            ? "bg-slate-100 text-slate-600"
            : "bg-amber-50 text-amber-700";
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold ${tone}`}>
      {status}
    </span>
  );
}

function MiniSparkline({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="flex items-end gap-[2px] h-4">
      {Array.from({ length: 7 }, (_, i) => {
        const h = Math.max(2, ((pct + (i - 3) * 5) / 100) * 14);
        return (
          <div
            key={i}
            className="w-[3px] rounded-sm"
            style={{
              height: `${h}px`,
              backgroundColor: i === 6 ? color : `${color}30`,
            }}
          />
        );
      })}
    </div>
  );
}

export function ProductVideo() {
  const [index, setIndex] = useState(0);
  const scene = SCENES[index];

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % SCENES.length), SCENE_MS);
    return () => clearInterval(id);
  }, []);

  const active = (id: SceneId) => (id === scene ? "active" : "inactive");

  return (
    <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
      <div className="flex h-[480px] sm:h-[580px] flex-col">
        <div className="shrink-0 h-12 bg-white border-b border-slate-200 px-3 sm:px-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Image
              src="/rona-logo.png"
              alt="Rona ERP"
              width={500}
              height={179}
              className="h-5 w-auto shrink-0"
            />
            <div className="hidden md:flex items-center gap-1 pl-3">
              {navChips.map((chip) => (
                <span
                  key={chip.scene}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                    active(chip.scene) === "active"
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-400"
                  }`}
                >
                  {chip.label}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-[10px] text-slate-400">
              <HiOutlineMagnifyingGlass className="h-3 w-3" />
              Search
            </div>
            <span
              className="rounded-md bg-zinc-950 px-2 py-1 text-[10px] font-semibold text-white"
            >
              Owner
            </span>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-500">
              AM
            </div>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="hidden sm:flex w-44 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50">
            <div className="px-4 py-3 border-b border-zinc-200">
              <div className="text-[11px] font-semibold text-zinc-900">Rona Manufacturing PLC</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">Main Warehouse</div>
            </div>
            <nav className="flex-1 overflow-hidden py-3 px-2.5">
              {sidebar.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[11px] mb-0.5 transition-colors duration-300 ${
                    active(item.scene) === "active"
                      ? "bg-zinc-200/70 text-zinc-900 font-semibold"
                      : "text-zinc-500"
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
              ))}
            </nav>
            <div className="px-4 py-3 border-t border-zinc-200">
              <div className="text-[10px] text-zinc-500">Multi-tenant workspace</div>
            </div>
          </div>

          <div className="relative flex-1 min-w-0 min-h-0">
            {scene === "dashboard" && (
              <div key="dashboard" className="absolute inset-0 flex flex-col gap-3 px-3 sm:px-4 py-3 overflow-hidden animate-scene-video">
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 shrink-0">
                  {kpis.map((kpi) => (
                    <div key={kpi.label} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                      <div className="flex items-center justify-between">
                        <div className="text-[9px] text-slate-400 font-medium leading-tight">{kpi.label}</div>
                        <MiniSparkline
                          pct={parseInt(kpi.value) || 50}
                          color={kpi.up ? "#10b981" : "#f43f5e"}
                        />
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-sm font-bold text-slate-900">{kpi.value}</span>
                        {kpi.trend && (
                          <span className={`text-[9px] font-semibold ${kpi.up ? "text-emerald-600" : "text-rose-500"}`}>
                            {kpi.trend}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-3 flex-1 min-h-0">
                  <div className="flex flex-col min-h-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-600">Recent Stock Movements</span>
                      <span className="text-[10px] text-slate-400">8 entries</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <table className="w-full text-[10px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            {["Reference", "Item", "Qty", "Type", "Status"].map((col) => (
                              <th key={col} className="px-3 py-1.5 text-left font-semibold text-slate-500 uppercase tracking-wider">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {movements.slice(0, 6).map((row, i) => (
                            <tr key={row.ref} className={`border-b border-slate-100 last:border-0 ${i % 2 === 1 ? "bg-slate-50/40" : ""}`}>
                              <td className="px-3 py-2 font-mono text-slate-500">{row.ref}</td>
                              <td className="px-3 py-2 font-medium text-slate-700">{row.item}</td>
                              <td className="px-3 py-2 text-slate-600">{row.qty}</td>
                              <td className="px-3 py-2 text-slate-500">
                                <span className={`inline-block rounded px-1.5 py-0.5 text-[8px] font-medium ${
                                  row.type === "Inbound" ? "bg-blue-50 text-blue-600"
                                    : row.type === "Transfer" ? "bg-zinc-100 text-zinc-600"
                                      : row.type === "Production" ? "bg-emerald-50 text-emerald-600"
                                        : "bg-orange-50 text-orange-600"
                                }`}>
                                  {row.type}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <StatusChip status={row.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="hidden sm:flex flex-col gap-3 min-h-0">
                    <div className="flex-1 flex flex-col rounded-lg border border-slate-200 bg-white overflow-hidden">
                      <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-1.5">
                        <HiOutlineExclamationTriangle className="w-3 h-3 text-amber-500" />
                        <span className="text-[11px] font-semibold text-slate-600">Requires attention</span>
                      </div>
                      <div className="flex-1 px-3 py-2 space-y-2 overflow-hidden">
                        {attention.map((item) => (
                          <div key={item.label} className="rounded-md border border-slate-100 px-2.5 py-2">
                            <div className="flex items-center gap-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.type === "error" ? "bg-rose-500" : "bg-amber-400"}`} />
                              <div className="text-[11px] font-semibold text-slate-800 truncate">{item.label}</div>
                            </div>
                            <div className="text-[9px] text-slate-400 mt-0.5 ml-3">{item.detail}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col rounded-lg border border-slate-200 bg-white overflow-hidden">
                      <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-1.5">
                        <HiOutlineCog6Tooth className="w-3 h-3 text-slate-400" />
                        <span className="text-[11px] font-semibold text-slate-600">Production</span>
                      </div>
                      <div className="px-3 py-2 space-y-2">
                        {productionOrders.map((po) => (
                          <div key={po.id} className="flex items-center justify-between">
                            <div className="min-w-0">
                              <div className="text-[10px] font-medium text-slate-700 truncate">{po.item}</div>
                              <div className="text-[9px] text-slate-400">{po.qty}</div>
                            </div>
                            <StatusChip status={po.status} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-600">Warehouse Utilization</span>
                    <span className="text-[10px] text-slate-400">4 locations</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {warehouseBars.map((wh) => (
                      <div key={wh.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-medium text-slate-600">{wh.label}</span>
                          <span className="text-[9px] text-slate-400">{wh.pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${wh.pct}%`,
                            backgroundColor: wh.pct > 70 ? "#f59e0b" : BAR_FILL,
                          }}
                        />
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">{wh.qty} units</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {scene === "movements" && (
              <div key="movements" className="absolute inset-0 px-3 sm:px-4 py-3 overflow-hidden animate-scene-video">
                <div className="h-full flex flex-col rounded-lg border border-slate-200 bg-white overflow-hidden">
                  <div className="shrink-0 px-3.5 py-2.5 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-slate-600">Stock Movements</span>
                      <span className="text-[10px] text-slate-400">8 entries · Main Warehouse</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {["All", "Inbound", "Outbound", "Transfer", "Production"].map((tab, i) => (
                        <span
                          key={tab}
                          className={`rounded-md px-2 py-0.5 text-[9px] font-medium ${
                            i === 0 ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {tab}
                        </span>
                      ))}
                      <div className="flex-1" />
                      <div className="flex items-center gap-1 rounded-md bg-slate-50 border border-slate-200 px-2 py-0.5 text-[9px] text-slate-400">
                        <HiOutlineMagnifyingGlass className="h-2.5 w-2.5" />
                        Search...
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto">
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          {["Reference", "Item", "Qty", "Source", "Type", "Status"].map((col) => (
                            <th key={col} className="px-3 py-1.5 text-left font-semibold text-slate-500 uppercase tracking-wider">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {movements.map((row, i) => (
                          <tr key={`${row.ref}-${i}`} className={`border-b border-slate-100 last:border-0 ${i % 2 === 1 ? "bg-slate-50/40" : ""}`}>
                            <td className="px-3 py-2.5 font-mono text-slate-500">{row.ref}</td>
                            <td className="px-3 py-2.5 font-medium text-slate-700">{row.item}</td>
                            <td className="px-3 py-2.5 text-slate-600">{row.qty}</td>
                            <td className="px-3 py-2.5 text-slate-500">{row.source}</td>
                            <td className="px-3 py-2.5">
                              <span className={`inline-block rounded px-1.5 py-0.5 text-[8px] font-medium ${
                                row.type === "Inbound" ? "bg-blue-50 text-blue-600"
                                  : row.type === "Transfer" ? "bg-zinc-100 text-zinc-600"
                                    : row.type === "Production" ? "bg-emerald-50 text-emerald-600"
                                      : "bg-orange-50 text-orange-600"
                              }`}>
                                {row.type}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              <StatusChip status={row.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="shrink-0 px-3.5 py-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Showing 1–8 of 8</span>
                    <div className="flex items-center gap-1">
                      <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[9px] font-medium text-white">1</span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">2</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {scene === "items" && (
              <div key="items" className="absolute inset-0 px-3 sm:px-4 py-3 overflow-hidden animate-scene-video">
                <div className="h-full flex flex-col rounded-lg border border-slate-200 bg-white overflow-hidden">
                  <div className="shrink-0 px-3.5 py-2.5 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-slate-600">Inventory Items</span>
                      <span className="text-[10px] text-slate-400">8 items · All warehouses</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {["All", "Raw Materials", "Finished Goods", "Packaging"].map((tab, i) => (
                        <span
                          key={tab}
                          className={`rounded-md px-2 py-0.5 text-[9px] font-medium ${
                            i === 0 ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {tab}
                        </span>
                      ))}
                      <div className="flex-1" />
                      <div className="flex items-center gap-1 rounded-md bg-slate-50 border border-slate-200 px-2 py-0.5 text-[9px] text-slate-400">
                        <HiOutlineMagnifyingGlass className="h-2.5 w-2.5" />
                        Search...
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto">
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          {["Code", "Item", "Category", "On Hand", "Reorder", "Status"].map((col) => (
                            <th key={col} className="px-3 py-1.5 text-left font-semibold text-slate-500 uppercase tracking-wider">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {itemsRows.map((row, i) => (
                          <tr key={row.code} className={`border-b border-slate-100 last:border-0 ${i % 2 === 1 ? "bg-slate-50/40" : ""}`}>
                            <td className="px-3 py-2.5 font-mono text-slate-500">{row.code}</td>
                            <td className="px-3 py-2.5 font-medium text-slate-700">{row.item}</td>
                            <td className="px-3 py-2.5">
                              <span className={`inline-block rounded px-1.5 py-0.5 text-[8px] font-medium ${
                                row.cat === "Raw Material" ? "bg-blue-50 text-blue-600"
                                  : row.cat === "Finished Good" ? "bg-emerald-50 text-emerald-600"
                                    : "bg-zinc-100 text-zinc-600"
                              }`}>
                                {row.cat}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-slate-600">{row.onHand}</td>
                            <td className="px-3 py-2.5 text-slate-400">{row.reorder}</td>
                            <td className="px-3 py-2.5">
                              <StatusChip status={row.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="shrink-0 px-3.5 py-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Showing 1–8 of 24</span>
                    <div className="flex items-center gap-1">
                      <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[9px] font-medium text-white">1</span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">2</span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">3</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {scene === "trace" && (
              <div key="trace" className="absolute inset-0 px-3 sm:px-4 py-3 overflow-hidden animate-scene-video">
                <div className="h-full flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 flex flex-col rounded-lg border border-slate-200 bg-white overflow-hidden">
                    <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-600">Lot Trace</span>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-600">
                          LOT-2026-001
                        </span>
                      </div>
                      <span className="hidden sm:block text-[10px] text-slate-400">Wheat Flour · Main Warehouse</span>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto px-3.5 py-3">
                      {traceSteps.map((step, index) => (
                        <div key={step.title} className="relative flex gap-3 pb-4 last:pb-0">
                          {index < traceSteps.length - 1 ? (
                            <span className="absolute left-[18px] top-9 bottom-0 w-px bg-slate-200" />
                          ) : null}
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg relative z-10 bg-slate-100 text-slate-600">
                            <step.icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1 flex items-center justify-between gap-3 rounded-md border border-slate-100 px-3 py-2">
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-slate-900">{step.title}</span>
                              <span className="block text-[11px] text-slate-500 truncate">{step.detail}</span>
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[9px] text-slate-400">{step.time}</span>
                              <span className="rounded-md border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                                {step.source}
                              </span>
                            </div>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="hidden sm:flex w-[200px] shrink-0 flex-col gap-3">
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Lot Info</div>
                      <div className="space-y-1.5">
                        {[
                          ["Lot #", "LOT-2026-001"],
                          ["Item", "Wheat Flour"],
                          ["Quantity", "500 KG"],
                          ["Received", "10 Sep 2026"],
                          ["Expiry", "10 Mar 2027"],
                          ["Status", "Approved"],
                        ].map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between">
                            <span className="text-[9px] text-slate-400">{k}</span>
                            <span className="text-[10px] font-medium text-slate-700">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Chain of Custody</div>
                      <div className="space-y-2">
                        {[
                          { actor: "Ethio Grain Co.", role: "Supplier" },
                          { actor: "QA Inspector", role: "Inspector" },
                          { actor: "Store Manager", role: "Allocator" },
                        ].map((c) => (
                          <div key={c.actor} className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500">
                              {c.actor.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                            </div>
                            <div>
                              <div className="text-[10px] font-medium text-slate-700">{c.actor}</div>
                              <div className="text-[9px] text-slate-400">{c.role}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Recent Activity</div>
                      <div className="space-y-2">
                        {recentActivity.map((a) => (
                          <div key={a.time} className="flex items-start gap-2">
                            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                            <div>
                              <div className="text-[9px] font-medium text-slate-600">{a.text}</div>
                              <div className="text-[8px] text-slate-400">{a.time}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
