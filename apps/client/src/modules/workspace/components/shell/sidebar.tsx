"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  HiOutlineArrowsRightLeft,
  HiOutlineBanknotes,
  HiOutlineBookmarkSquare,
  HiOutlineBriefcase,
  HiOutlineBuildingOffice2,
  HiOutlineCalculator,
  HiOutlineCalendarDays,
  HiOutlineChartBar,
  HiOutlineChevronDown,
  HiOutlineChevronDoubleLeft,
  HiOutlineChevronDoubleRight,
  HiOutlineClipboardDocumentCheck,
  HiOutlineClipboardDocumentList,
  HiOutlineClock,
  HiOutlineCube,
  HiOutlineDocumentMagnifyingGlass,
  HiOutlineDocumentMinus,
  HiOutlineFingerPrint,
  HiOutlineIdentification,
  HiOutlineInboxStack,
  HiOutlineReceiptPercent,
  HiOutlineShieldCheck,
  HiOutlineShoppingBag,
  HiOutlineShoppingCart,
  HiOutlineSparkles,
  HiOutlineSquare3Stack3D,
  HiOutlineTag,
  HiOutlineUserGroup,
  HiOutlineUsers,
  HiOutlineXMark,
} from "react-icons/hi2";
import { TbBuildingWarehouse } from "react-icons/tb";
import { MdOutlinePrecisionManufacturing } from "react-icons/md";
import { useCurrentOrganization, usePermissions } from "@/modules/workspace/hooks";
import type { Permission } from "@rona/types/tenancy";
import { NAV_GROUPS } from "./nav-config";

const ITEM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Dashboard: HiOutlineChartBar,
  "Rona AI": HiOutlineSparkles,
  Items: HiOutlineTag,
  Warehouses: TbBuildingWarehouse,
  Lots: HiOutlineSquare3Stack3D,
  Stock: HiOutlineInboxStack,
  Movements: HiOutlineArrowsRightLeft,
  Reservations: HiOutlineBookmarkSquare,
  BOMs: HiOutlineClipboardDocumentList,
  "Production Orders": MdOutlinePrecisionManufacturing,
  Batches: HiOutlineCube,
  Inspections: HiOutlineClipboardDocumentCheck,
  "Lot Tracing": HiOutlineFingerPrint,
  Employees: HiOutlineUsers,
  Attendance: HiOutlineClock,
  Shifts: HiOutlineCalendarDays,
  Departments: HiOutlineBuildingOffice2,
  Positions: HiOutlineBriefcase,
  Profile: HiOutlineIdentification,
  Members: HiOutlineUserGroup,
  Roles: HiOutlineShieldCheck,
  "Audit Log": HiOutlineDocumentMagnifyingGlass,
  Customers: HiOutlineShoppingBag,
  "Sales Orders": HiOutlineShoppingCart,
  Commissions: HiOutlineCalculator,
  Invoices: HiOutlineReceiptPercent,
  Payments: HiOutlineBanknotes,
  Costs: HiOutlineDocumentMinus,
};

const FALLBACK_ICON = HiOutlineInboxStack;

const EXPANDED_STORAGE_KEY = "rona-workspace-sidebar-expanded";

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
  const [expandedGroups, setExpandedGroups] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(EXPANDED_STORAGE_KEY);
      if (stored) return JSON.parse(stored) as string[];
    } catch {
      // fall through to path-based defaults
    }
    return NAV_GROUPS.filter((group) =>
      group.items.some((item) => pathname === item.href),
    ).map((group) => group.label);
  });
  // Groups whose expansion the user overrode while being the active group —
  // otherwise the derived expansion below would re-open them on every render.
  const [collapsedActiveGroups, setCollapsedActiveGroups] = useState<string[]>([]);
  const activeItemRef = useRef<HTMLAnchorElement | null>(null);

  const activeGroup = NAV_GROUPS.find((group) =>
    group.items.some((item) => item.href === pathname),
  )?.label;

  const effectiveExpanded = useMemo(() => {
    if (!activeGroup) return expandedGroups;
    if (
      expandedGroups.includes(activeGroup) ||
      collapsedActiveGroups.includes(activeGroup)
    ) {
      return expandedGroups;
    }
    return [...expandedGroups, activeGroup];
  }, [expandedGroups, activeGroup, collapsedActiveGroups]);

  const toggleGroup = (label: string) => {
    const isOpen = effectiveExpanded.includes(label);
    const next = isOpen
      ? expandedGroups.filter((item) => item !== label)
      : expandedGroups.includes(label)
        ? expandedGroups
        : [...expandedGroups, label];
    setExpandedGroups(next);
    try {
      localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // persistence is best-effort
    }
    if (label === activeGroup) {
      // Let the user close (or re-open) the active group itself.
      setCollapsedActiveGroups((previous) =>
        isOpen
          ? previous.includes(label)
            ? previous
            : [...previous, label]
          : previous.filter((item) => item !== label),
      );
    }
  };

  // Scroll the active item into view after navigation.
  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: "nearest" });
  }, [pathname]);

  // Mobile drawer: close on Escape and lock background scrolling while open.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseMobile();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen, onCloseMobile]);

  const isActive = (href: string) => pathname === href;

  const navItemClass = (active: boolean) =>
    cn(
      "relative mx-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      active
        ? "bg-zinc-100 text-zinc-900 font-semibold"
        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
    );

  const renderItem = (label: string, href: string, rail: boolean) => {
    const active = isActive(href);
    const Icon = ITEM_ICONS[label] ?? FALLBACK_ICON;

    if (rail) {
      return (
        <Link
          key={href}
          href={href}
          onClick={onCloseMobile}
          title={label}
          aria-label={label}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex items-center justify-center rounded-lg py-2 transition-colors",
            active
              ? "bg-zinc-100 text-zinc-900"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
          )}
        >
          <Icon
            className={cn(
              "h-4 w-4 shrink-0",
              active ? "text-zinc-900" : "text-zinc-400",
            )}
          />
        </Link>
      );
    }

    return (
      <Link
        key={href}
        href={href}
        onClick={onCloseMobile}
        title={label}
        ref={active ? activeItemRef : undefined}
        aria-current={active ? "page" : undefined}
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

  const renderSection = (
    label: string,
    items: { label: string; href: string }[],
    rail: boolean,
  ) => {
    if (rail) {
      return (
        <div key={label} className="mx-3 mt-3 pt-3 border-t border-zinc-200">
          <div className="space-y-1">
            {items.map((item) => renderItem(item.label, item.href, true))}
          </div>
        </div>
      );
    }

    const expanded = effectiveExpanded.includes(label);

    return (
      <div key={label}>
        <button
          type="button"
          onClick={() => toggleGroup(label)}
          title={label}
          aria-expanded={expanded}
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
        {expanded ? (
          <div className="space-y-1">
            {items.map((item) => renderItem(item.label, item.href, false))}
          </div>
        ) : null}
      </div>
    );
  };

  const topLevelGroups = NAV_GROUPS.filter((group) => group.label === "Overview");
  const sectionGroups = NAV_GROUPS.filter((group) => group.label !== "Overview");

  const renderNav = (rail: boolean) => (
    <nav
      aria-label="Workspace"
      className="flex-1 overflow-y-auto overflow-x-hidden py-2 pb-4"
    >
      {topLevelGroups.map((group) =>
        group.items.map((item) => renderItem(item.label, item.href, rail)),
      )}

      {!rail ? <div className="mx-3 mt-3 h-px bg-zinc-200" /> : null}

      {sectionGroups.map((group) => {
        const visibleItems = group.items.filter((item) => itemVisible(item));
        if (visibleItems.length === 0) return null;
        return renderSection(group.label, visibleItems, rail);
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
          {!collapsed ? (
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-semibold text-zinc-900">
                {organization?.name ?? "No organization"}
              </span>
              <span className="block truncate text-xs text-zinc-500 font-mono">
                {organization?.slug ?? "—"}
              </span>
            </span>
          ) : null}
          {!collapsed ? (
            <HiOutlineChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400 transition-colors group-hover:text-zinc-600" />
          ) : null}
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
        <>
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
          {renderTenantHeader()}
          {renderNav(true)}
        </>
      ) : (
        <>
          {renderTenantHeader()}
          {renderNav(false)}
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
        {renderNav(false)}
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
