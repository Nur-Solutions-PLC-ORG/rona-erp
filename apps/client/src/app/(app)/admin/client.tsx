"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAdminDashboard } from "@/modules/admin/hooks";
import { InfoCard, StatCard } from "@/modules/app/components/home";
import Link from "next/link";
import { FaUsers } from "react-icons/fa6";
import { LuBuilding2 } from "react-icons/lu";

const Client = () => {
  const { stats, isLoading } = useAdminDashboard();

  return (
    <>
      <div className="px-6 mt-6 grid grid-cols-2 h-fit gap-6">
        <div className="grid grid-cols-1 h-fit gap-6">
          <StatCard
            icon={LuBuilding2}
            title={"Total organizations"}
            value={stats?.organizations.total}
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
            icon={FaUsers}
            value={stats?.employees.total}
            loading={isLoading}
            color="red"
          />
        </div>

        <div className="grid grid-cols-1 h-fit gap-6">
          <StatCard
            icon={FaUsers}
            title={"Total users"}
            value={stats?.users.total}
            loading={isLoading}
          />

          <InfoCard
            title="Platform Configs"
            items={stats?.platformConfigs.configs.map((item) => ({
              key: item.key,
              value:
                item.type === "boolean" ? (
                  <Switch checked={item.value === "true"} disabled />
                ) : item.type === "number" ? (
                  <span className="font-mono">
                    {Number(item.value).toLocaleString()}
                  </span>
                ) : (
                  <span className="font-mono">{item.value}</span>
                ),
            }))}
            loading={isLoading}
            action={
              <Button variant="link" asChild>
                <Link href="/admin/configs">Details</Link>
              </Button>
            }
          />
        </div>
      </div>
    </>
  );
};

export default Client;
