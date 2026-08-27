"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { IconType } from "react-icons/lib";

type Props = {
  title: string;
  value?: string | number;
  className?: string;
  icon?: IconType;
  loading?: boolean;
  color?: "red" | "purple" | "green" | "yellow" | "blue" | "orange";
};

const StatCard = ({
  title,
  value,
  className,
  loading,
  color = "purple",
  icon: Icon,
}: Props) => {
  if (loading) {
    return <div className="rounded-md p-4 bg-black/2 animate-pulse h-20"></div>;
  }

  return (
    <div
      className={cn(
        "flex flex-col h-fit bg-white rounded-2xl drop-shadow border relative",
        className,
      )}
    >
      <span
        className={cn("-z-10 rounded-2xl absolute inset-0", {
          "bg-purple-800/5": color == "purple",
          "bg-amber-800/5": color == "orange",
          "bg-red-800/5": color == "red",
          "bg-blue-800/5": color == "blue",
          "bg-green-800/5": color == "green",
          "bg-yellow-800/5": color == "yellow",
        })}
      />
      <div className="flex items-center justify-center px-6 py-3">
        {Icon && (
          <Icon
            className={cn("mr-auto size-5", {
              "text-purple-800": color == "purple",
              "text-amber-800": color == "orange",
              "text-red-800": color == "red",
              "text-blue-800": color == "blue",
              "text-green-800": color == "green",
              "text-yellow-800": color == "yellow",
            })}
          />
        )}
        <p className="opacity-75">{title}</p>
      </div>
      <span className="border-t w-full" />
      <div className="flex items-center px-6 py-3">
        <p className="text-2xl font-heading font-semibold">{value || "0"}</p>
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
    return <div className="rounded-md p-4 bg-black/2 animate-pulse h-20" />;
  }

  return (
    <div className="flex flex-col h-fit bg-white drop-shadow rounded-2xl border">
      <div className="flex items-center justify-between px-6 py-3">
        <p className="opacity-75">{title}</p>
        {action}
      </div>

      <div className="border-t" />

      <div className="flex flex-col px-6 py-3 divide-y">
        {items?.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between py-3 text-sm"
          >
            <p>{item.key}</p>

            {item.value}
          </div>
        ))}
      </div>
    </div>
  );
};

export { InfoCard, StatCard };
