"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { humanize } from "@/modules/workspace/components/ui";
import { Skeleton } from "@/components/custom/skeleton";

// Series colors from the Rona brand palette. Negative series stay red so
// losses and outflows read as such regardless of brand.
export const CHART_COLORS = {
  primary: "#386163",
  secondary: "#6ec3c7",
  accent: "#03af68",
  muted: "#518985",
  negative: "#e11d48",
} as const;

export interface ChartPoint {
  label: string;
  value: number;
}

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  points: ChartPoint[];
}

function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return mounted;
}

function formatCompact(value: number): string {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });
}

function formatFull(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Tiny trend line for KPI cards. No axes, no interaction — just shape.
export function Sparkline({
  values,
  color = CHART_COLORS.primary,
  className,
}: {
  values: number[];
  color?: string;
  className?: string;
}) {
  const gradientId = useId();
  const width = 100;
  const height = 32;
  const points = values.length > 0 ? values : [0];
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const stepX = points.length > 1 ? width / (points.length - 1) : 0;

  const line = points
    .map((value, index) => {
      const x = points.length > 1 ? index * stepX : width / 2;
      const y = height - ((value - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("h-8 w-24", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${line} ${width},${height}`}
        fill={`url(#${gradientId})`}
      />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

const FUNNEL_BAR_CLASSES = [
  "bg-brand-deep",
  "bg-brand-teal",
  "bg-brand-sea",
  "bg-brand-aqua",
  "bg-brand-mint",
];

// Pipeline funnel: horizontal stage bars with per-stage counts and
// step conversion percentages between consecutive stages.
export function FunnelChart({
  stages,
  valueFormat = formatCompact,
}: {
  stages: { label: string; value: number; color?: string }[];
  valueFormat?: (value: number) => string;
}) {
  const mounted = useMounted();
  const max = Math.max(...stages.map((stage) => stage.value), 1);

  if (stages.length === 0) return null;

  return (
    <div className="space-y-3">
      {stages.map((stage, index) => {
        const previous = index > 0 ? stages[index - 1].value : null;
        const conversion =
          previous !== null && previous > 0
            ? Math.round((stage.value / previous) * 100)
            : null;
        const share = (stage.value / max) * 100;
        return (
          <div key={stage.label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-xs">
              <span className="truncate font-medium text-zinc-700">
                {stage.label}
              </span>
              <span className="shrink-0 font-mono tabular-nums text-zinc-500">
                {valueFormat(stage.value)}
                {conversion !== null ? (
                  <span className="ml-1.5 font-sans text-[10px] text-zinc-400">
                    {conversion}% step
                  </span>
                ) : null}
              </span>
            </div>
            <div className="h-5 overflow-hidden rounded-lg bg-zinc-100">
              <div
                className={cn(
                  "h-full rounded-lg transition-[width] duration-700 ease-out",
                  stage.color ??
                    FUNNEL_BAR_CLASSES[index % FUNNEL_BAR_CLASSES.length],
                )}
                style={{
                  width: mounted ? `${Math.max(share, 1.5)}%` : "0%",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ChartCard({
  title,
  description,
  action,
  isLoading,
  isEmpty,
  emptyMessage,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-200 px-5 py-3.5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
          {description ? (
            <p className="mt-0.5 truncate text-xs text-zinc-500">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </header>
      {isLoading ? (
        <div className="px-5 py-5">
          <Skeleton className="h-52 w-full rounded" />
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-1.5 px-5 py-12 text-center">
          <p className="text-sm font-semibold text-zinc-600">
            {emptyMessage ?? "No data yet."}
          </p>
          <p className="text-xs text-zinc-500">
            Charts appear as activity is recorded.
          </p>
        </div>
      ) : (
        <div className="px-5 py-5">{children}</div>
      )}
    </div>
  );
}

const AREA_HEIGHT = 160;
const AREA_MAX_POINTS = 14;

export function AreaChart({
  series,
  valueFormat = formatFull,
}: {
  series: ChartSeries;
  valueFormat?: (value: number) => string;
}) {
  const gradientId = useId();
  const [hovered, setHovered] = useState<number | null>(null);

  const points = series.points.slice(-AREA_MAX_POINTS);

  const geometry = useMemo(() => {
    if (points.length === 0) return null;

    const width = 100;
    const height = AREA_HEIGHT;
    const max = Math.max(...points.map((point) => point.value), 1);
    const stepX = points.length > 1 ? width / (points.length - 1) : 0;

    const coords = points.map((point, index) => ({
      x: points.length > 1 ? index * stepX : width / 2,
      y: height - (point.value / max) * (height - 16) - 8,
    }));

    const line = coords
      .map((coord) => `${coord.x.toFixed(2)},${coord.y.toFixed(2)}`)
      .join(" ");

    return { coords, line, stepX, max };
  }, [points]);

  if (!geometry) return null;

  const activeIndex = hovered ?? points.length - 1;
  const activePoint = points[activeIndex];
  const activeCoord = geometry.coords[activeIndex];

  return (
    <div>
      <div className="relative">
        <svg
          viewBox={`0 0 100 ${AREA_HEIGHT}`}
          preserveAspectRatio="none"
          className="h-40 w-full"
          role="img"
          aria-label={`${series.label} trend`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={series.color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={series.color} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75].map((ratio) => (
            <line
              key={ratio}
              x1="0"
              x2="100"
              y1={AREA_HEIGHT * ratio}
              y2={AREA_HEIGHT * ratio}
              stroke="#eef1f3"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          <polygon
            points={`0,${AREA_HEIGHT} ${geometry.line} 100,${AREA_HEIGHT}`}
            fill={`url(#${gradientId})`}
          />

          <polyline
            points={geometry.line}
            fill="none"
            stroke={series.color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />

          {activeCoord ? (
            <g>
              <line
                x1={activeCoord.x}
                x2={activeCoord.x}
                y1="0"
                y2={AREA_HEIGHT}
                stroke="#dde4e6"
                strokeWidth="1"
                strokeDasharray="3 3"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx={activeCoord.x}
                cy={activeCoord.y}
                r="3.5"
                fill="#fff"
                stroke={series.color}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                style={{ transformBox: "fill-box" }}
              />
            </g>
          ) : null}
        </svg>

        <div className="absolute inset-0 flex">
          {points.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`${series.label} ${points[index].label}`}
              className="h-full flex-1 cursor-default"
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(index)}
              onBlur={() => setHovered(null)}
            />
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px]">
        <span className="text-zinc-500">{activePoint?.label}</span>
        <span className="font-mono font-semibold tabular-nums text-zinc-900">
          {activePoint ? valueFormat(activePoint.value) : "—"}
        </span>
      </div>

      <div className="mt-1 flex justify-between text-[10px] text-zinc-400">
        <span>{points[0]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </div>
  );
}

const BAR_CHART_HEIGHT = 160;
const BAR_CHART_MAX_CATEGORIES = 31;
const BAR_CHART_MAX_LABELS = 7;

// Vertical bar histogram ("histograph"). Accepts one series for a plain
// histogram, or two for side-by-side grouped bars (e.g. stock in vs out).
export function BarChart({
  series,
  valueFormat = formatCompact,
}: {
  series: ChartSeries[];
  valueFormat?: (value: number) => string;
}) {
  const mounted = useMounted();
  const [hovered, setHovered] = useState<number | null>(null);

  const trimmed = useMemo(
    () =>
      series.map((s) => ({
        ...s,
        points: s.points.slice(-BAR_CHART_MAX_CATEGORIES),
      })),
    [series],
  );

  const count = trimmed[0]?.points.length ?? 0;
  const max = Math.max(
    1,
    ...trimmed.flatMap((s) => s.points.map((point) => point.value)),
  );

  if (count === 0 || trimmed.length === 0) return null;

  const activeIndex = Math.min(hovered ?? count - 1, count - 1);
  const groupWidth = 100 / count;
  const barWidth = (groupWidth * 0.68) / trimmed.length;
  const yFor = (value: number) =>
    BAR_CHART_HEIGHT - (value / max) * (BAR_CHART_HEIGHT - 10) - 4;
  const labelStep = Math.max(1, Math.ceil(count / BAR_CHART_MAX_LABELS));
  const grouped = trimmed.length > 1;

  return (
    <div>
      {grouped ? (
        <div className="mb-2 flex items-center gap-4 text-[11px] text-zinc-600">
          {trimmed.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: s.color }}
              />
              {s.label}
            </span>
          ))}
        </div>
      ) : null}

      <div className="relative">
        <svg
          viewBox={`0 0 100 ${BAR_CHART_HEIGHT}`}
          preserveAspectRatio="none"
          className="h-40 w-full"
          role="img"
          aria-label={trimmed.map((s) => s.label).join(" vs ")}
        >
          {[0.25, 0.5, 0.75].map((ratio) => (
            <line
              key={ratio}
              x1="0"
              x2="100"
              y1={BAR_CHART_HEIGHT * ratio}
              y2={BAR_CHART_HEIGHT * ratio}
              stroke="#eef1f3"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {trimmed.map((s, seriesIndex) =>
            s.points.map((point, index) => {
              const value = point.value;
              const top = yFor(value);
              const height = Math.max(BAR_CHART_HEIGHT - top - 2, 0);
              return (
                <rect
                  key={`${s.key}:${index}`}
                  x={index * groupWidth + groupWidth * 0.16 + seriesIndex * barWidth}
                  y={top}
                  width={barWidth * 0.86}
                  height={height}
                  fill={s.color}
                  opacity={hovered === null || hovered === index ? 1 : 0.45}
                  rx="0.8"
                  style={{
                    transformBox: "fill-box",
                    transformOrigin: "bottom",
                    transform: mounted
                      ? "scaleY(1)"
                      : "scaleY(0)",
                    transition: `transform .7s cubic-bezier(.16,1,.3,1) ${
                      index * 18
                    }ms, opacity .2s ease`,
                  }}
                />
              );
            }),
          )}

          {hovered !== null ? (
            <line
              x1={hovered * groupWidth + groupWidth / 2}
              x2={hovered * groupWidth + groupWidth / 2}
              y1="0"
              y2={BAR_CHART_HEIGHT}
              stroke="#dde4e6"
              strokeWidth="1"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>

        <div className="absolute inset-0 flex">
          {trimmed[0].points.map((point, index) => (
            <button
              key={index}
              type="button"
              aria-label={`${point.label}: ${trimmed
                .map((s) => `${s.label} ${valueFormat(s.points[index]?.value ?? 0)}`)
                .join(", ")}`}
              className="h-full flex-1 cursor-default"
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(index)}
              onBlur={() => setHovered(null)}
            />
          ))}
        </div>
      </div>

      <div className="mt-2 min-h-[2rem] space-y-0.5 text-[11px]">
        <div className="flex items-center justify-between gap-3">
          <span className="text-zinc-500">
            {trimmed[0].points[activeIndex]?.label}
          </span>
          <span className="flex items-center gap-3 font-mono font-semibold tabular-nums text-zinc-900">
            {trimmed.map((s) => (
              <span key={s.key}>
                {grouped ? (
                  <span className="mr-1 font-sans font-normal text-zinc-500">
                    {s.label}
                  </span>
                ) : null}
                {valueFormat(s.points[activeIndex]?.value ?? 0)}
              </span>
            ))}
          </span>
        </div>
      </div>

      <div className="mt-1 flex text-[10px] text-zinc-400">
        {trimmed[0].points.map((point, index) => (
          <span
            key={index}
            className="flex-1 truncate text-center"
          >
            {index % labelStep === 0 || index === count - 1
              ? point.label
              : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

const BAR_LIST_COLORS = [
  "bg-brand-teal",
  "bg-brand-aqua",
  "bg-brand-green",
  "bg-brand-sea",
  "bg-slate-400",
  "bg-brand-mint",
];

export function BarList({
  points,
  valueFormat = formatCompact,
  emptyMessage,
}: {
  points: ChartPoint[];
  valueFormat?: (value: number) => string;
  emptyMessage?: string;
}) {
  const mounted = useMounted();
  const max = Math.max(...points.map((point) => point.value), 1);
  const top = points.slice(0, 8);

  if (top.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-zinc-500">
        {emptyMessage ?? "Nothing recorded yet."}
      </p>
    );
  }

  return (
    <ul className="space-y-3.5">
      {top.map((point, index) => (
        <li key={point.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium text-zinc-700">
              {point.label}
            </span>
            <span className="shrink-0 font-mono text-xs tabular-nums text-zinc-500">
              {valueFormat(point.value)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-700 ease-out",
                BAR_LIST_COLORS[index % BAR_LIST_COLORS.length],
              )}
              style={{
                width: mounted
                  ? `${Math.max((point.value / max) * 100, 2)}%`
                  : "0%",
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

const DONUT_PALETTE = [
  "#386163",
  "#6ec3c7",
  "#03af68",
  "#518985",
  "#64748b",
  "#85d0c4",
  "#1d3536",
  "#9fd8da",
  "#5fcf96",
  "#94a3b8",
];

export function DonutChart({
  points,
  centerLabel,
  centerValue,
  valueFormat = formatCompact,
}: {
  points: ChartPoint[];
  centerLabel: string;
  centerValue: string;
  valueFormat?: (value: number) => string;
}) {
  const mounted = useMounted();
  const total = points.reduce((sum, point) => sum + point.value, 0);
  const top = points.slice(0, DONUT_PALETTE.length);

  const segments = top.reduce<
    {
      point: ChartPoint;
      color: string;
      startAngle: number;
      endAngle: number;
    }[]
  >((list, point, index) => {
    const previous = list[list.length - 1];
    const startAngle = previous ? previous.endAngle : -Math.PI / 2;
    const share = total > 0 ? point.value / total : 0;
    list.push({
      point,
      color: DONUT_PALETTE[index % DONUT_PALETTE.length],
      startAngle,
      endAngle: startAngle + share * 2 * Math.PI,
    });
    return list;
  }, []);

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const sweep = mounted
    ? (top.reduce((sum, point) => sum + point.value, 0) > 0 ? 1 : 0)
    : 0;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="relative h-32 w-32 shrink-0">
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full -rotate-0"
          role="img"
          aria-label={centerLabel}
        >
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#eef1f3"
            strokeWidth="12"
          />
          {segments.map((segment) => {
            const length = (segment.endAngle - segment.startAngle) * radius;
            const visibleLength = length * sweep;
            return (
              <circle
                key={segment.point.label}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth="12"
                strokeDasharray={`${visibleLength} ${circumference - visibleLength}`}
                strokeDashoffset={
                  circumference * 0.25 -
                  (segment.startAngle + Math.PI / 2) * radius
                }
                className="transition-all duration-700 ease-out"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-sm font-bold tabular-nums text-zinc-900">
            {centerValue}
          </span>
          <span className="text-[10px] font-medium text-zinc-500">
            {centerLabel}
          </span>
        </div>
      </div>

      <ul className="w-full min-w-0 space-y-1.5">
        {segments.map((segment) => (
          <li
            key={segment.point.label}
            className="flex items-center justify-between gap-3 text-xs"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: segment.color }}
              />
              <span className="truncate text-zinc-700">
                {segment.point.label}
              </span>
            </span>
            <span className="shrink-0 font-mono tabular-nums text-zinc-500">
              {valueFormat(segment.point.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChartStatStrip({
  stats,
}: {
  stats: { label: string; value: string; tone?: "emerald" | "amber" | "rose" | "zinc" }[];
}) {
  const toneClass: Record<string, string> = {
    emerald: "text-emerald-700",
    amber: "text-amber-700",
    rose: "text-rose-700",
    zinc: "text-zinc-900",
  };

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm"
        >
          <p className="text-xs font-medium text-zinc-500">{stat.label}</p>
          <p
            className={cn(
              "mt-1.5 font-mono text-lg font-bold tabular-nums",
              toneClass[stat.tone ?? "zinc"],
            )}
          >
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function toMonthlySeries<T>(
  rows: T[],
  months: number,
  dateOf: (row: T) => string | Date,
  valueOf: (row: T) => number,
  seriesMeta: { key: string; label: string; color: string },
): ChartSeries {
  const buckets = new Map<string, number>();
  const keys: string[] = [];

  const now = new Date();
  for (let offset = months - 1; offset >= 0; offset--) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = date.toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
    });
    keys.push(key);
    buckets.set(key, 0);
  }

  for (const row of rows) {
    const date = new Date(dateOf(row));
    const key = date.toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
    });
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + valueOf(row));
    }
  }

  return {
    ...seriesMeta,
    points: keys.map((key) => ({ label: key, value: buckets.get(key) ?? 0 })),
  };
}

export function toDailySeries<T>(
  rows: T[],
  days: number,
  dateOf: (row: T) => string | Date,
  valueOf: (row: T) => number,
  seriesMeta: { key: string; label: string; color: string },
): ChartSeries {
  const buckets = new Map<string, number>();
  const keys: string[] = [];

  const now = new Date();
  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    const key = date.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
    });
    keys.push(key);
    buckets.set(key, 0);
  }

  for (const row of rows) {
    const date = new Date(dateOf(row));
    const key = date.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
    });
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + valueOf(row));
    }
  }

  return {
    ...seriesMeta,
    points: keys.map((key) => ({ label: key, value: buckets.get(key) ?? 0 })),
  };
}

export function toCategoryPoints<T>(
  rows: T[],
  categoryOf: (row: T) => string,
  valueOf: (row: T) => number,
): ChartPoint[] {
  const totals = new Map<string, number>();

  for (const row of rows) {
    const category = categoryOf(row);
    totals.set(category, (totals.get(category) ?? 0) + valueOf(row));
  }

  return [...totals.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export { humanize };
