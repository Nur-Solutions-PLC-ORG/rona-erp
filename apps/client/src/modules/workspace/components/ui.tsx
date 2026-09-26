"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import {
  HiOutlineCheck,
  HiOutlineChevronDown,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineEllipsisVertical,
  HiOutlineTableCells,
} from "react-icons/hi2";
import type { ReactNode, SelectHTMLAttributes } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/custom/skeleton";
import Spinner from "@/components/custom/spinner";
import { Breadcrumbs } from "./shell/breadcrumb";

export const BTN_PRIMARY =
  "flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 active:bg-primary/80 text-primary-foreground text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";

export const BTN_SECONDARY =
  "flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-card hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors border border-slate-200 disabled:opacity-50 disabled:pointer-events-none";

export const BTN_GHOST =
  "flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-600 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";

export const BTN_DANGER =
  "flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";

export const INPUT_CLASS =
  "w-full bg-card border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring transition-colors disabled:opacity-50 disabled:pointer-events-none";

export const LABEL_CLASS =
  "block text-sm font-medium text-slate-700 mb-1.5";

export const SELECT_CLASS =
  "w-full bg-card border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring transition-colors appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat pr-8 disabled:opacity-50 disabled:pointer-events-none";

export const SELECT_TOOLBAR_CLASS =
  "appearance-none w-auto whitespace-nowrap max-w-full bg-card border border-slate-300 rounded-md px-3 pr-8 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring transition-colors bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat disabled:opacity-50 disabled:pointer-events-none";

export const FIELD_TOOLBAR_CLASS =
  "w-auto bg-card border border-slate-300 rounded-md px-3 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring transition-colors disabled:opacity-50 disabled:pointer-events-none";

const FILTER_TRIGGER_CLASS =
  "inline-flex w-auto items-center justify-between gap-3 whitespace-nowrap rounded-md border border-slate-300 bg-card px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/40";

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn("w-full", SELECT_CLASS, className)} {...props}>
      {children}
    </select>
  );
}

export type FilterOption = { label: string; value: string };

export function FilterSelect({
  value,
  onChange,
  options,
  className,
  placeholder = "All",
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const menuOptions =
    options.some((option) => option.value === "") ||
    placeholder === undefined
      ? options
      : [{ value: "", label: placeholder }, ...options];
  const selectedLabel =
    menuOptions.find((option) => option.value === value)?.label ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          disabled={disabled}
          className={cn(FILTER_TRIGGER_CLASS, className)}
        >
          <span className="truncate">{selectedLabel ?? placeholder}</span>
          <HiOutlineChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        id={listId}
        align="start"
        sideOffset={6}
        className="w-max min-w-(--radix-popover-trigger-width) max-h-72 gap-0.5 rounded-md border border-zinc-200 bg-card p-1 shadow-lg ring-0 overflow-y-auto"
      >
        {menuOptions.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded px-3 py-2 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900",
                selected && "bg-zinc-100 font-semibold text-zinc-900",
              )}
            >
              <span className="truncate">{option.label}</span>
              {selected ? (
                <HiOutlineCheck className="h-4 w-4 shrink-0 text-zinc-900" />
              ) : null}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

export type Tone = "emerald" | "amber" | "rose" | "sky" | "zinc";

const TONE_BADGE: Record<Tone, string> = {
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  rose: "bg-rose-50 text-rose-700 border-rose-200",
  sky: "bg-sky-50 text-sky-700 border-sky-200",
  zinc: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

const PILL = "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap border";

const STATUS_TONES: Record<string, Tone> = {
  active: "emerald",
  inactive: "rose",
  invited: "amber",
  suspended: "rose",
  draft: "zinc",
  planned: "amber",
  in_progress: "amber",
  approved: "emerald",
  completed: "emerald",
  cancelled: "rose",
  retired: "zinc",
  pending: "amber",
  on_leave: "amber",
  resigned: "rose",
  terminated: "rose",
  clock_in: "emerald",
  clock_out: "rose",
  break_start: "amber",
  break_end: "sky",
  quarantined: "amber",
  rejected: "rose",
  released: "emerald",
  expired: "rose",
  pass: "emerald",
  fail: "rose",
  reviewed: "sky",
  receipt: "emerald",
  issue: "sky",
  transfer: "amber",
  return: "amber",
  adjustment: "zinc",
  consumed: "zinc",
};

export function statusTone(status: string): Tone {
  return STATUS_TONES[status?.toLowerCase?.() ?? ""] ?? "zinc";
}

export function humanize(value: string): string {
  return value
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "bg-card rounded-lg border border-slate-200 shadow-[0_1px_2px_0_rgb(15_23_42_/_0.05)] min-w-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TruncatedText({
  value,
  fallback = "N/A",
  className,
  maxWidthClass = "max-w-56",
}: {
  value: string | null | undefined;
  fallback?: string;
  className?: string;
  maxWidthClass?: string;
}) {
  const text = value === null || value === undefined || value.trim() === ""
    ? fallback
    : value;
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-block max-w-full truncate align-bottom",
              maxWidthClass,
              className,
            )}
          >
            {text}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm break-words">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function PageHeader({
  icon,
  title,
  description,
  actions,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <Breadcrumbs />
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="hidden sm:block shrink-0 text-slate-400">
            {icon}
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-slate-900">
              {title}
            </h1>
            <p className="text-xs text-slate-600 truncate mt-0.5">
              {description}
            </p>
          </div>
        </div>
        {actions ? (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}

export function DotBadge({
  tone,
  label,
}: {
  tone: Tone;
  label: string;
}) {
  return (
    <span className={cn(PILL, TONE_BADGE[tone])}>
      {label}
    </span>
  );
}

export function ProgressBadge({ status }: { status: string }) {
  const tone = statusTone(status);

  return (
    <span className={cn(PILL, TONE_BADGE[tone])}>{humanize(status)}</span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <ProgressBadge status={status} />;
}

export type RowActionItem = {
  key?: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  separator?: boolean;
};

export function RowActionsMenu({
  items,
  label = "Row actions",
  className,
}: {
  items: RowActionItem[];
  label?: string;
  className?: string;
}) {
  // No actions available for this row: render a muted dash instead of a
  // button that would open an empty menu.
  if (items.length === 0) {
    return (
      <span
        aria-hidden="true"
        className={cn("block px-2 text-sm text-zinc-300", className)}
      >
        {"\u2014"}
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            className,
          )}
        >
          <HiOutlineEllipsisVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 p-1">
        {items.map((item, index) => {
          const itemNode = (
            <DropdownMenuItem
              key={item.key ?? `${item.label}-${index}`}
              disabled={item.disabled}
              onClick={item.onClick}
              className={cn(
                "cursor-pointer gap-2 text-xs",
                item.destructive &&
                  "text-rose-600 focus:bg-rose-50 focus:text-rose-700",
              )}
            >
              {item.icon}
              {item.label}
            </DropdownMenuItem>
          );
          return item.separator ? (
            <div key={`${item.label}-${index}`}>
              {itemNode}
              <DropdownMenuSeparator />
            </div>
          ) : (
            itemNode
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export interface Column<T> {
  key: string;
  header: ReactNode;
  className?: string;
  render: (row: T) => ReactNode;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  rows,
  isLoading = false,
  emptyMessage = "No records found.",
  emptyDescription,
  emptyAction,
  footer,
}: {
  columns: Column<T>[];
  rows: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="bg-card rounded-lg border border-zinc-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "sticky top-0 py-2.5 px-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 whitespace-nowrap bg-zinc-50",
                    column.className,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 border-b border-zinc-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={`skeleton-${index}`}>
                  <td colSpan={columns.length} className="px-4 py-2">
                    <Skeleton className="h-9 w-full" />
                  </td>
                </tr>
              ))
            ) : rows.length ? (
              rows.map((row, rowIndex) => (
                <tr
                  key={row.id}
                  className={cn(
                    "transition-colors hover:bg-zinc-50/60",
                    rowIndex % 2 === 1 && "bg-zinc-50/30",
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn("py-2.5 px-4 align-middle", column.className)}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12">
                  <div className="flex flex-col items-center justify-center gap-2 text-center">
                    <HiOutlineTableCells className="h-8 w-8 text-zinc-300" />
                    <p className="text-sm font-semibold text-zinc-600">
                      {emptyMessage}
                    </p>
                    {emptyDescription ? (
                      <p className="max-w-xs text-xs text-zinc-500">
                        {emptyDescription}
                      </p>
                    ) : null}
                    {emptyAction ? (
                      <div className="mt-1">{emptyAction}</div>
                    ) : null}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {footer ? (
        <div className="px-4 py-2.5 bg-zinc-50/50 border-t border-zinc-200">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "text-center",
        compact
          ? "px-6 py-10"
          : "bg-card rounded-lg border border-slate-200 p-10",
      )}
    >
      <div className="mx-auto text-slate-300">{icon}</div>
      <h3 className="mt-3 text-sm font-semibold text-slate-700">{title}</h3>
      <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
      {action ? (
        <div className="mt-4 flex items-center justify-center gap-2">
          {action}
        </div>
      ) : null}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-zinc-500 font-mono">
        Page {page} of {totalPages}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-2.5 py-1.5 rounded-lg bg-card border border-zinc-200 text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 disabled:opacity-40 disabled:pointer-events-none transition-all"
        >
          <HiOutlineChevronLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-2.5 py-1.5 rounded-lg bg-card border border-zinc-200 text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 disabled:opacity-40 disabled:pointer-events-none transition-all"
        >
          <HiOutlineChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  trend,
  isLoading = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  trend?: { value: string; positive: boolean };
  isLoading?: boolean;
}) {
  return (
    <div className="flex h-full flex-col justify-between rounded-lg border border-zinc-200 bg-card p-4">
      <span className="text-[11px] font-medium text-zinc-500">
        {label}
      </span>
      <div className="mt-2">
        {isLoading ? (
          <div className="flex items-center">
            <Spinner className="h-5 w-5 text-zinc-400" />
          </div>
        ) : (
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-semibold text-zinc-900 font-mono leading-7">
              {value.toLocaleString()}
            </p>
            {trend ? (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-semibold",
                  trend.positive
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700",
                )}
              >
                {trend.positive ? "↑" : "↓"} {trend.value}
              </span>
            ) : null}
          </div>
        )}

        {hint && !isLoading ? (
          <p className="mt-1 text-[11px] text-zinc-400">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}
