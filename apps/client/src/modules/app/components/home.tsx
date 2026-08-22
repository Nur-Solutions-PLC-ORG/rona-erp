"use client";

import { useSession } from "@/modules/auth/hooks";

const HomeHeader = () => {
  const { user } = useSession();

  return (
    <div className="px-6 pt-6">
      <div className="flex flex-col items-center justify-center py-6 gap-2">
        <h1 className="text-3xl font-heading font-">
          Welcome, {user?.name || "Rona Admin"}
        </h1>
        <p className="text-muted-foreground">
          General platform statistics and dashboard analytics
        </p>
      </div>
    </div>
  );
};

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  value?: string | number;
  className?: string;
  loading?: boolean;
  color?: "red" | "purple" | "green" | "yellow" | "blue" | "orange";
};

const StatCard = ({
  title,
  value,
  className,
  loading,
  color = "purple",
}: Props) => {
  if (loading) {
    return <div className="rounded-md p-4 bg-black/2 animate-pulse h-20"></div>;
  }

  return (
    <div
      className={cn(
        "flex flex-col h-fit bg-white  shadow rounded-2xl",
        className,
        {
          "bg-purple-950/5": color == "purple",
          "bg-amber-950/5": color == "orange",
          "bg-red-950/5": color == "red",
          "bg-blue-950/5": color == "blue",
          "bg-green-950/5": color == "green",
          "bg-yellow-950/5": color == "yellow",
        },
      )}
    >
      <div className="flex items-center justify-center px-6 py-3">
        <p>{title}</p>
      </div>
      <Separator />
      <div className="flex items-center px-6 py-3">
        <p className="text-2xl font-heading">{value || "0"}</p>
      </div>
    </div>
  );
};

export { StatCard, HomeHeader };
