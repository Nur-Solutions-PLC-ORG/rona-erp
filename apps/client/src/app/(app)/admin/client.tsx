"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAdminDashboard } from "@/modules/admin/hooks";
import Spinner from "@/components/custom/spinner";
import { Card, PageHeader } from "@/modules/workspace/components/ui";
import {
  HiOutlineBuildingOffice2,
  HiOutlineBuildingStorefront,
  HiOutlineCog6Tooth,
  HiOutlineMap,
  HiOutlineShieldCheck,
  HiOutlineUserGroup,
  HiOutlineUsers,
} from "react-icons/hi2";
import {
  CLIENT_ADMIN_BRANCHES_PAGE,
  CLIENT_ADMIN_COMPANIES_PAGE,
  CLIENT_ADMIN_DEPARTMENTS_PAGE,
  CLIENT_ADMIN_EMPLOYEES_PAGE,
  CLIENT_ADMIN_PLATFORM_CONFIGS_PAGE,
  CLIENT_ADMIN_USERS_PAGE,
} from "@rona/routes/admin";

function QuickLink({
  href,
  icon,
  label,
  description,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-card p-4 sm:p-5"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
        {icon}
      </span>
      <div className="mt-4">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="mt-0.5 text-xs leading-snug text-slate-500">
          {description}
        </p>
      </div>
    </Link>
  );
}

const Client = () => {
  const { stats, isLoading } = useAdminDashboard();

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        icon={<HiOutlineShieldCheck className="w-5 h-5" />}
        title="Admin overview"
        description="Platform-wide statistics and configuration"
      />

      <section>
        <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Management
        </h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLink
            href={CLIENT_ADMIN_USERS_PAGE}
            icon={<HiOutlineUserGroup className="h-5 w-5" />}
            label="Users"
            description="Manage platform users and their access"
          />
          <QuickLink
            href={CLIENT_ADMIN_COMPANIES_PAGE}
            icon={<HiOutlineBuildingOffice2 className="h-5 w-5" />}
            label="Organizations"
            description="Tenant companies registered on the platform"
          />
          <QuickLink
            href={CLIENT_ADMIN_DEPARTMENTS_PAGE}
            icon={<HiOutlineBuildingStorefront className="h-5 w-5" />}
            label="Departments"
            description="Department structure across organizations"
          />
          <QuickLink
            href={CLIENT_ADMIN_BRANCHES_PAGE}
            icon={<HiOutlineMap className="h-5 w-5" />}
            label="Branches"
            description="Locations and branches of each organization"
          />
          <QuickLink
            href={CLIENT_ADMIN_EMPLOYEES_PAGE}
            icon={<HiOutlineUsers className="h-5 w-5" />}
            label="Employees"
            description="People and their employment records"
          />
          <QuickLink
            href={CLIENT_ADMIN_PLATFORM_CONFIGS_PAGE}
            icon={<HiOutlineCog6Tooth className="h-5 w-5" />}
            label="Platform Configs"
            description="Global platform settings and defaults"
          />
        </div>
      </section>

      <Card>
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Platform Configs
          </h2>
          <Link
            href={CLIENT_ADMIN_PLATFORM_CONFIGS_PAGE}
            className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-900"
          >
            View all →
          </Link>
        </header>
        <div className="flex flex-col divide-y divide-slate-100 px-4 sm:px-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-5 w-5 text-zinc-500" />
            </div>
          ) : stats?.platformConfigs.configs.length ? (
            stats.platformConfigs.configs.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-3 py-2.5 text-xs"
              >
                <p className="text-slate-500">{item.key}</p>
                <p className="truncate text-right font-mono font-medium text-slate-800">
                  {item.type === "boolean"
                    ? item.value === "true"
                      ? "Yes"
                      : "No"
                    : item.type === "number"
                      ? Number(item.value).toLocaleString()
                      : item.value}
                </p>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-xs text-slate-400">
              No platform configs yet.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Client;
