"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatCount } from "@/lib/format";
import { useCurrentOrganization } from "@/modules/workspace/hooks";
import { Card } from "@/modules/workspace/components/ui";
import { Sparkline } from "@/modules/workspace/components/charts";
import Spinner from "@/components/custom/spinner";
import {
  HiOutlineArrowRight,
  HiOutlineBuildingStorefront,
  HiOutlineCheckCircle,
  HiOutlineTableCells,
} from "react-icons/hi2";
import { Skeleton } from "@/components/custom/skeleton";

export { formatQuantity } from "@/lib/format";

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("") || "U"
  );
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export interface SearchResult {
  type: string;
  label: string;
  hint: string;
  href: string;
}

export function DashboardHeader({
  roleLabel,
  icon = <HiOutlineBuildingStorefront className="h-4.5 w-4.5" />,
}: {
  roleLabel: string;
  icon?: ReactNode;
}) {
  const { organization } = useCurrentOrganization();
  const now = useNow(30_000);

  return (
    <div className="flex items-center gap-3">
      <span className="shrink-0 text-slate-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">
          {organization?.name ?? "Workspace"} ·{" "}
          {capitalize(format(now, "EEEE, MMMM d, yyyy"))} ·{" "}
          {format(now, "hh:mm a")}
        </p>
        <h1 className="text-lg font-semibold leading-tight text-slate-900">
          {roleLabel}
        </h1>
      </div>
    </div>
  );
}

export type KpiAccent = "neutral" | "warn" | "danger";

const KPI_ACCENTS: Record<KpiAccent, { icon: string; value: string }> = {
  neutral: {
    icon: "text-slate-400",
    value: "text-slate-900",
  },
  warn: {
    icon: "text-amber-600",
    value: "text-amber-700",
  },
  danger: {
    icon: "text-rose-600",
    value: "text-rose-700",
  },
};

export function KpiCard({
  icon,
  label,
  value,
  hint,
  unit,
  accent = "neutral",
  isLoading,
  spark,
  sparkColor,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  hint?: string;
  unit?: string;
  accent?: KpiAccent;
  isLoading?: boolean;
  spark?: number[];
  sparkColor?: string;
}) {
  const tone = KPI_ACCENTS[accent];
  return (
    <div className="flex h-full flex-col justify-between rounded-lg border border-slate-200 bg-card p-3.5 shadow-[0_1px_2px_0_rgb(15_23_42_/_0.05)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-slate-600">{label}</span>
        <span className={cn("shrink-0", tone.icon)}>{icon}</span>
      </div>
      <div className="mt-2">
        {isLoading ? (
          <Skeleton className="h-8 w-24 rounded" />
        ) : (
          <div className="flex items-end justify-between gap-2">
            <p className={cn("text-3xl font-bold tabular-nums leading-none", tone.value)}>
              {formatCount(value)}
              {unit ? (
                <span className="ml-1.5 text-sm font-semibold text-slate-400">
                  {unit}
                </span>
              ) : null}
            </p>
            {spark ? (
              <Sparkline
                values={spark}
                color={sparkColor}
                className="mb-0.5 shrink-0"
              />
            ) : null}
          </div>
        )}
        {hint && !isLoading ? (
          <p className="mt-1.5 text-[11px] text-slate-500">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}

export function SectionCard({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden rounded-lg", className)}>
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-2.5">
        <h2 className="text-xs font-semibold text-slate-600">{title}</h2>
        {action}
      </header>
      <div className="px-4 py-3">{children}</div>
    </Card>
  );
}

export function DataCard({
  title,
  action,
  isLoading,
  isEmpty,
  emptyMessage,
  emptyDescription,
  emptyAction,
  children,
}: {
  title: string;
  action?: ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden rounded-lg">
      <header className="flex flex-col gap-2 border-b border-slate-200 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xs font-semibold text-slate-600">{title}</h2>
        {action}
      </header>
      {isLoading ? (
        <div className="px-4 py-3 space-y-2.5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4">
              <Skeleton className="h-3.5 w-16 shrink-0 rounded" />
              <Skeleton className="h-3.5 flex-1 rounded" />
              <Skeleton className="h-3.5 w-12 shrink-0 rounded" />
            </div>
          ))}
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-1.5 px-4 py-10 text-center">
          <HiOutlineTableCells className="h-8 w-8 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">
            {emptyMessage ?? "No records yet."}
          </p>
          <p className="text-xs text-slate-500">
            {emptyDescription ?? "Check back once activity lands here."}
          </p>
          {emptyAction ? <div className="mt-2">{emptyAction}</div> : null}
        </div>
      ) : (
        <div className="overflow-x-auto">{children}</div>
      )}
    </Card>
  );
}

export type AttentionTone = "warn" | "danger" | "info" | "muted";

export interface AttentionItem {
  key: string;
  icon: ReactNode;
  label: string;
  value: string;
  detail?: string;
  href: string;
  tone: AttentionTone;
}

const ATTENTION_VALUE: Record<AttentionTone, string> = {
  warn: "text-amber-700",
  danger: "text-rose-700",
  info: "text-sky-700",
  muted: "text-slate-700",
};

export function requireAttention(items: AttentionItem[]): AttentionItem[] {
  return items.filter((item) => Number(item.value) > 0);
}

export function RequiresAttention({ items }: { items: AttentionItem[] }) {
  return (
    <SectionCard title="Requires attention">
      {items.length ? (
        <ul className="divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className="group flex items-center gap-3 py-2"
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-slate-700">
                    {item.label}
                  </span>
                  {item.detail ? (
                    <span className="block truncate text-[11px] text-slate-500">
                      {item.detail}
                    </span>
                  ) : null}
                </span>
                <span
                  className={cn(
                    "font-mono text-xs font-semibold tabular-nums",
                    ATTENTION_VALUE[item.tone],
                  )}
                >
                  {item.value}
                </span>
                <HiOutlineArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-slate-500" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex items-center gap-2 py-3 text-xs text-slate-400">
          <HiOutlineCheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
          All clear — nothing needs your attention.
        </p>
      )}
    </SectionCard>
  );
}

export function LoadingCard({ label = "Loading your dashboard…" }: { label?: string }) {
  return (
    <Card className="flex items-center justify-center px-4 py-20">
      <div className="flex items-center gap-2.5 text-sm text-slate-500">
        <Spinner className="h-5 w-5 text-slate-500" />
        {label}
      </div>
    </Card>
  );
}

export function ViewAllLink({ href, label = "View all" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-primary"
    >
      {label}
      <HiOutlineArrowRight className="h-3 w-3" />
    </Link>
  );
}
