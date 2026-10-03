"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { IconType } from "react-icons/lib";
import Spinner from "@/components/custom/spinner";

const TONE_CLASSES = {
  icon: {
    sky: "text-sky-700",
    orange: "text-amber-700",
    red: "text-rose-700",
    blue: "text-sky-700",
    green: "text-emerald-700",
    yellow: "text-yellow-700",
  },
  accent: {
    sky: "text-sky-700",
    orange: "text-amber-700",
    red: "text-rose-700",
    blue: "text-sky-700",
    green: "text-emerald-700",
    yellow: "text-yellow-700",
  },
} as const;

type Props = {
  title: string;
  value?: string | number;
  className?: string;
  icon?: IconType;
  loading?: boolean;
  color?: "red" | "sky" | "green" | "yellow" | "blue" | "orange";
};

const StatCard = ({
  title,
  value,
  className,
  loading,
  color = "sky",
  icon: Icon,
}: Props) => {
  if (loading) {
    return (
      <div className="flex h-24 items-center justify-center rounded-xl bg-card border border-zinc-100 p-4 shadow-xs">
        <Spinner className="h-5 w-5 text-zinc-500" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col h-fit bg-card rounded-xl border border-zinc-100 shadow-xs",
        className,
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {Icon ? (
          <span
            className={cn(
              "size-4 flex items-center justify-center shrink-0",
              TONE_CLASSES.icon[color],
            )}
          >
            <Icon className="size-4" />
          </span>
        ) : (
          <span
            className={cn(
              "w-1.5 h-8 rounded-full shrink-0",
              color == "sky" && "bg-sky-700",
              color == "orange" && "bg-amber-500",
              color == "red" && "bg-rose-500",
              color == "blue" && "bg-sky-500",
              color == "green" && "bg-emerald-500",
              color == "yellow" && "bg-yellow-500",
            )}
          />
        )}
        <p className="text-xs font-medium text-zinc-500 truncate">{title}</p>
      </div>

      <div className="flex items-center px-4 pb-3">
        <p className="text-xl font-bold text-zinc-900 font-mono">
          {value ?? 0}
        </p>
      </div>
    </div>
  );
};

type InfoCardProps = {
  title: string;
  items?: { key: string; value: ReactNode }[];
  loading?: boolean;
  action?: ReactNode;
};

const InfoCard = ({ title, items, loading, action }: InfoCardProps) => {
  if (loading) {
    return (
      <div className="flex h-24 items-center justify-center rounded-xl bg-card border border-zinc-100 p-4 shadow-xs">
        <Spinner className="h-5 w-5 text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-fit bg-card rounded-xl border border-zinc-100 shadow-xs">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
        <p className="text-sm font-bold text-zinc-900">{title}</p>
        {action}
      </div>

      <div className="flex flex-col px-4 divide-y divide-zinc-100">
        {items?.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between py-2.5 text-xs gap-3"
          >
            <p className="text-zinc-500">{item.key}</p>

            <p className="text-zinc-800 font-medium text-right truncate">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export { InfoCard, StatCard };
