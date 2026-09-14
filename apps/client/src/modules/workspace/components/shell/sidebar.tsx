"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  HiOutlineArchiveBox,
  HiOutlineArrowsRightLeft,
  HiOutlineBanknotes,
  HiOutlineBookmarkSquare,
  HiOutlineBriefcase,
  HiOutlineBuildingOffice2,
  HiOutlineBuildingStorefront,
  HiOutlineCalendarDays,
  HiOutlineChartPie,
  HiOutlineChevronDown,
  HiOutlineChevronDoubleLeft,
  HiOutlineChevronDoubleRight,
  HiOutlineClipboard,
  HiOutlineClock,
  HiOutlineCube,
  HiOutlineCubeTransparent,
  HiOutlineDocumentText,
  HiOutlineFingerPrint,
  HiOutlineHome,
  HiOutlineIdentification,
  HiOutlineListBullet,
  HiOutlineShieldCheck,
  HiOutlineShoppingCart,
  HiOutlineSquares2X2,
  HiOutlineUserGroup,
  HiOutlineUsers,
  HiOutlineXMark,
} from "react-icons/hi2";
import { useCurrentOrganization, usePermissions } from "@/modules/workspace/hooks";
import type { Permission } from "@rona/types/tenancy";
import { NAV_GROUPS } from "./nav-config";

const ITEM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Dashboard: HiOutlineHome,
  Items: HiOutlineCube,
  Warehouses: HiOutlineBuildingStorefront,
  Lots: HiOutlineCubeTransparent,
  Stock: HiOutlineArchiveBox,
  Movements: HiOutlineArrowsRightLeft,
  Reservations: HiOutlineBookmarkSquare,
  BOMs: HiOutlineSquares2X2,
  "Production Orders": HiOutlineDocumentText,
  Batches: HiOutlineCube,
  Inspections: HiOutlineClipboard,
  "Lot Tracing": HiOutlineFingerPrint,
  Employees: HiOutlineUsers,
  Attendance: HiOutlineClock,
  Shifts: HiOutlineCalendarDays,
  Departments: HiOutlineBuildingOffice2,
  Positions: HiOutlineBriefcase,
  Profile: HiOutlineIdentification,
  Members: HiOutlineUserGroup,
  Roles: HiOutlineShieldCheck,
  "Audit Log": HiOutlineListBullet,
  Customers: HiOutlineUserGroup,
  "Sales Orders": HiOutlineShoppingCart,
  Commissions: HiOutlineBanknotes,
  Invoices: HiOutlineDocumentText,
  Payments: HiOutlineBanknotes,
  Costs: HiOutlineChartPie,
};

const FALLBACK_ICON = HiOutlineChartPie;

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const { organization } = useCurrentOrganization();
  const { hasPermission } = usePermissions();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(() =>
    NAV_GROUPS.filter((group) =>
      group.items.some((item) => pathname === item.href),
    ).map((group) => group.label),
  );

  const toggleGroup = (label: string) => {
    setExpandedGroups((previous) =>
      previous.includes(label)
        ? previous.filter((item) => item !== label)
        : [...previous, label],
    );
  };

  const isActive = (href: string) => pathname === href;

  const navItemClass = (active: boolean) =>
    cn(
      "relative mx-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      active
        ? "bg-zinc-100 text-zinc-900 font-semibold"
        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
    );

  const renderItem = (label: string, href: string) => {
    const active = isActive(href);
    const Icon = ITEM_ICONS[label] ?? FALLBACK_ICON;

    return (
      <Link
        key={href}
        href={href}
        onClick={onCloseMobile}
        title={label}
        className={navItemClass(active)}
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            active ? "text-zinc-900" : "text-zinc-400",
          )}
        />
        <span className="min-w-0 flex-1 truncate">{label}</span>
      </Link>
    );
  };

  const itemVisible = (item: { permission: Permission; anyOf?: Permission[] }) =>
    item.anyOf
      ? item.anyOf.some((permission) => hasPermission(permission))
      : hasPermission(item.permission);

  const renderSection = (label: string, items: { label: string; href: string }[]) => {
    const expanded = expandedGroups.includes(label);

    return (
      <div key={label}>
        <button
          type="button"
          onClick={() => toggleGroup(label)}
          title={label}
          className="group w-full flex items-center justify-between px-4 pt-5 pb-1.5"
        >
          <span
            className={cn(
              "text-xs font-semibold uppercase tracking-widest transition-colors",
              "text-zinc-400 group-hover:text-zinc-600",
            )}
          >
            {label}
          </span>
          <HiOutlineChevronDown
            className={cn(
              "w-3.5 h-3.5 shrink-0 transition-all",
              expanded ? "rotate-180" : "",
              "text-zinc-400 group-hover:text-zinc-600",
            )}
          />
        </button>
        {expanded ? <div className="space-y-1">{items.map((item) => renderItem(item.label, item.href))}</div> : null}
      </div>
    );
  };

  const topLevelGroups = NAV_GROUPS.filter((group) => group.label === "Overview");
  const sectionGroups = NAV_GROUPS.filter((group) => group.label !== "Overview");

  const renderNav = () => (
    <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 pb-4">
      {topLevelGroups.map((group) =>
        group.items.map((item) => renderItem(item.label, item.href)),
      )}

      <div className="mx-3 mt-3 h-px bg-zinc-200" />

      {sectionGroups.map((group) => {
        const visibleItems = group.items.filter((item) => itemVisible(item));
        if (visibleItems.length === 0) return null;
        return renderSection(group.label, visibleItems);
      })}
    </nav>
  );

  const renderTenantHeader = (extra?: React.ReactNode) => (
    <div className="px-4 pt-5 pb-4 border-b border-zinc-200 shrink-0">
      <div className="flex items-center gap-1">
        <button
          type="button"
          title={organization?.name ?? "No organization"}
          className="group flex min-w-0 flex-1 items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-zinc-50"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-600">
            <HiOutlineBuildingOffice2 className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-sm font-semibold text-zinc-900">
              {organization?.name ?? "No organization"}
            </span>
            <span className="block truncate text-xs text-zinc-500 font-mono">
              {organization?.slug ?? "—"}
            </span>
          </span>
          <HiOutlineChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400 transition-colors group-hover:text-zinc-600" />
        </button>
        {extra}
      </div>
    </div>
  );

  const renderDesktop = () => (
    <aside
      className={cn(
        "hidden lg:relative lg:flex h-full shrink-0 bg-white border-r border-zinc-200 flex-col transition-all duration-300",
        collapsed ? "w-14" : "w-64",
      )}
    >
      {collapsed ? (
        <div className="flex flex-col justify-end p-2.5">
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            className="flex h-9 w-full items-center justify-center rounded-md border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
          >
            <HiOutlineChevronDoubleRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          {renderTenantHeader()}
          {renderNav()}
          <div className="p-3 border-t border-zinc-200 shrink-0">
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
              className="flex h-9 w-full items-center justify-center rounded-md border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
            >
              <HiOutlineChevronDoubleLeft className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </aside>
  );

  const renderMobile = () => (
    <>
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-zinc-900/40 lg:hidden"
          onClick={onCloseMobile}
        />
      ) : null}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-72 max-w-[85vw] bg-white border-r border-zinc-200 flex flex-col transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {renderTenantHeader(
          <button
            type="button"
            onClick={onCloseMobile}
            title="Close navigation"
            aria-label="Close navigation"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            <HiOutlineXMark className="h-5 w-5" />
          </button>,
        )}
        {renderNav()}
      </aside>
    </>
  );

  return (
    <>
      {renderMobile()}
      {renderDesktop()}
    </>
  );
}
