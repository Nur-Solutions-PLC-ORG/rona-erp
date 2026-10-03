"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HiOutlineChevronRight } from "react-icons/hi2";
import { NAV_GROUPS } from "./nav-config";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  assistant: "Rona AI",
  inventory: "Inventory",
  items: "Items",
  warehouses: "Warehouses",
  lots: "Lots",
  stock: "Stock",
  movements: "Movements",
  reservations: "Reservations",
  manufacturing: "Manufacturing",
  boms: "BOMs",
  "production-orders": "Production Orders",
  batches: "Batches",
  quality: "Quality",
  inspections: "Inspections",
  traceability: "Traceability",
  workforce: "Workforce",
  employees: "Employees",
  attendance: "Attendance",
  shifts: "Shifts",
  departments: "Departments",
  positions: "Positions",
  organization: "Organization",
  members: "Members",
  roles: "Roles",
  audit: "Audit Log",
};

function buildLabel(segment: string): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];

  const flat = NAV_GROUPS.flatMap((group) => group.items);
  const match = flat.find(
    (item) => item.href.split("/").pop() === segment,
  );
  if (match) return match.label;

  return segment
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  const items = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;
    return { segment, href, isLast, label: buildLabel(segment) };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-zinc-500">
      {items.map((item, index) => (
        <span key={item.href} className="flex items-center gap-1">
          {index > 0 && (
            <HiOutlineChevronRight className="h-3 w-3 shrink-0 text-zinc-400" />
          )}
          {item.isLast ? (
            <span className="font-medium text-zinc-600">{item.label}</span>
          ) : (
            <Link
              href={item.href}
              className="truncate transition-colors hover:text-zinc-600"
            >
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
