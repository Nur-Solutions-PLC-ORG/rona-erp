"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  HiOutlineBanknotes,
  HiOutlineBuildingOffice2,
  HiOutlineChartBar,
  HiOutlineClipboardDocumentCheck,
  HiOutlineFingerPrint,
  HiOutlineInboxStack,
  HiOutlineSparkles,
  HiOutlineShoppingCart,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import { TbBuildingFactory2 } from "react-icons/tb";
import { useCurrentOrganization, usePermissions } from "@/modules/workspace/hooks";
import type { Permission } from "@rona/types/tenancy";
import { LAUNCHER_MODULES, NAV_GROUPS } from "./shell/nav-config";

const MODULE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Dashboard: HiOutlineChartBar,
  "Rona AI": HiOutlineSparkles,
  Inventory: HiOutlineInboxStack,
  Manufacturing: TbBuildingFactory2,
  Quality: HiOutlineClipboardDocumentCheck,
  Traceability: HiOutlineFingerPrint,
  Workforce: HiOutlineUserGroup,
  Sales: HiOutlineShoppingCart,
  Finance: HiOutlineBanknotes,
  Organization: HiOutlineBuildingOffice2,
};

const FALLBACK_ICON = HiOutlineInboxStack;

interface ModuleStyle {
  tile: string;
  icon: string;
  label: string;
}

const MODULE_STYLES: Record<string, ModuleStyle> = {
  Dashboard: {
    tile: "border-blue-200/70 bg-blue-100/70 group-hover:border-blue-300 group-hover:bg-blue-200/80",
    icon: "text-blue-600 group-hover:text-blue-800",
    label: "text-blue-700 group-hover:text-blue-900",
  },
  "Rona AI": {
    tile: "border-violet-200/70 bg-violet-100/70 group-hover:border-violet-300 group-hover:bg-violet-200/80",
    icon: "text-violet-600 group-hover:text-violet-800",
    label: "text-violet-700 group-hover:text-violet-900",
  },
  Inventory: {
    tile: "border-amber-200/70 bg-amber-100/70 group-hover:border-amber-300 group-hover:bg-amber-200/80",
    icon: "text-amber-600 group-hover:text-amber-800",
    label: "text-amber-700 group-hover:text-amber-900",
  },
  Manufacturing: {
    tile: "border-orange-200/70 bg-orange-100/70 group-hover:border-orange-300 group-hover:bg-orange-200/80",
    icon: "text-orange-600 group-hover:text-orange-800",
    label: "text-orange-700 group-hover:text-orange-900",
  },
  Quality: {
    tile: "border-emerald-200/70 bg-emerald-100/70 group-hover:border-emerald-300 group-hover:bg-emerald-200/80",
    icon: "text-emerald-600 group-hover:text-emerald-800",
    label: "text-emerald-700 group-hover:text-emerald-900",
  },
  Traceability: {
    tile: "border-cyan-200/70 bg-cyan-100/70 group-hover:border-cyan-300 group-hover:bg-cyan-200/80",
    icon: "text-cyan-600 group-hover:text-cyan-800",
    label: "text-cyan-700 group-hover:text-cyan-900",
  },
  Workforce: {
    tile: "border-sky-200/70 bg-sky-100/70 group-hover:border-sky-300 group-hover:bg-sky-200/80",
    icon: "text-sky-600 group-hover:text-sky-800",
    label: "text-sky-700 group-hover:text-sky-900",
  },
  Sales: {
    tile: "border-rose-200/70 bg-rose-100/70 group-hover:border-rose-300 group-hover:bg-rose-200/80",
    icon: "text-rose-600 group-hover:text-rose-800",
    label: "text-rose-700 group-hover:text-rose-900",
  },
  Finance: {
    tile: "border-teal-200/70 bg-teal-100/70 group-hover:border-teal-300 group-hover:bg-teal-200/80",
    icon: "text-teal-600 group-hover:text-teal-800",
    label: "text-teal-700 group-hover:text-teal-900",
  },
  Organization: {
    tile: "border-fuchsia-200/70 bg-fuchsia-100/70 group-hover:border-fuchsia-300 group-hover:bg-fuchsia-200/80",
    icon: "text-fuchsia-600 group-hover:text-fuchsia-800",
    label: "text-fuchsia-700 group-hover:text-fuchsia-900",
  },
};

const DEFAULT_STYLE: ModuleStyle = {
  tile: "border-zinc-200 bg-zinc-100/70 group-hover:border-zinc-300 group-hover:bg-zinc-200/80",
  icon: "text-zinc-600 group-hover:text-zinc-900",
  label: "text-zinc-600 group-hover:text-zinc-900",
};

interface ResolvedModule {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  style: ModuleStyle;
}

export default function LauncherGrid() {
  const router = useRouter();
  const { organization } = useCurrentOrganization();
  const { hasPermission } = usePermissions();

  const modules = useMemo(() => {
    const visible = (item: { permission?: Permission; anyOf?: Permission[] }) =>
      item.anyOf
        ? item.anyOf.some((permission) => hasPermission(permission))
        : !!item.permission && hasPermission(item.permission);

    const resolved: ResolvedModule[] = [];

    for (const candidate of LAUNCHER_MODULES) {
      if (candidate.group) {
        const group = NAV_GROUPS.find((g) => g.label === candidate.group);
        const items = (group?.items ?? []).filter(visible);
        if (!items.length) continue;
        resolved.push({
          label: candidate.label,
          href: items[0].href,
          icon: MODULE_ICONS[candidate.label] ?? FALLBACK_ICON,
          style: MODULE_STYLES[candidate.label] ?? DEFAULT_STYLE,
        });
        continue;
      }

      if (candidate.href && (!candidate.group || visible(candidate))) {
        resolved.push({
          label: candidate.label,
          href: candidate.href,
          icon: MODULE_ICONS[candidate.label] ?? FALLBACK_ICON,
          style: MODULE_STYLES[candidate.label] ?? DEFAULT_STYLE,
        });
      }
    }

    return resolved;
  }, [hasPermission]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-8 space-y-1">
        <h1 className="bg-gradient-to-r from-zinc-900 to-zinc-600 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
          Welcome{organization?.name ? ` to ${organization.name}` : ""}
        </h1>
        <p className="text-sm text-zinc-500">
          Pick a workspace to get started.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4">
        {modules.map((module) => {
          const Icon = module.icon;
          const { style } = module;
          return (
            <button
              key={module.label}
              type="button"
              onClick={() => router.push(module.href)}
              className="group flex flex-col items-center gap-2.5"
            >
              <span
                className={cn(
                  "flex h-24 w-full max-w-[10rem] items-center justify-center rounded-xl",
                  "border shadow-sm transition-all",
                  "group-hover:-translate-y-0.5 group-hover:shadow-md",
                  style.tile,
                )}
              >
                <Icon className={cn("h-9 w-9 transition-colors", style.icon)} />
              </span>
              <span className={cn("text-xs font-medium transition-colors", style.label)}>
                {module.label}
              </span>
            </button>
          );
        })}
      </div>

      {modules.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-500">
          You don&rsquo;t have access to any workspace yet. Ask an admin to grant you a role.
        </p>
      ) : null}
    </div>
  );
}
