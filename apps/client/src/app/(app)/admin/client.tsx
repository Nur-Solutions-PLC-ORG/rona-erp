"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAdminDashboard } from "@/modules/admin/hooks";
import { StatCard, HomeHeader } from "@/modules/app/components/home";
import Link from "next/link";

const Client = () => {
  const { stats, isLoading } = useAdminDashboard();

  return (
    <>
      <HomeHeader />

      <div className="px-6 mt-6 grid grid-cols-2 h-fit gap-6">
        <div className="grid grid-cols-1 h-fit gap-6">
          <StatCard
            title={"Total companies"}
            value={stats?.companies.total}
            loading={isLoading}
            color="blue"
          />

          <div className="grid grid-cols-2 gap-6">
            <StatCard
              title={"Total branches"}
              value={stats?.branches.total}
              loading={isLoading}
              color="orange"
            />
            <StatCard
              title={"Total departments"}
              value={stats?.departments.total}
              loading={isLoading}
              color="green"
            />
          </div>

          <StatCard
            title={"Total employees"}
            value={stats?.employees.total}
            loading={isLoading}
            color="red"
          />
        </div>

        <div className="grid grid-cols-1 h-fit gap-6">
          <StatCard
            title={"Total users"}
            value={stats?.users.total}
            loading={isLoading}
          />

          <div className={cn("flex flex-col h-full gap-6")}>
            <div className="flex items-center justify-between">
              <p>Platform Configs</p>

              <Button variant={"link"} asChild>
                <Link href={"/admin/configs"}>Details</Link>
              </Button>
            </div>

            <div className="flex flex-col">
              {stats?.platformConfigs.configs.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between"
                >
                  <p>{item.key}</p>
                  <span className="font-mono">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Client;
