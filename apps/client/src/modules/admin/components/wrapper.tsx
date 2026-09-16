"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  HiOutlineArrowRightOnRectangle,
  HiOutlineChevronDown,
  HiOutlineChevronDoubleLeft,
  HiOutlineChevronDoubleRight,
  HiOutlineShieldCheck,
  HiOutlineUserCircle,
  HiOutlineWrenchScrewdriver,
} from "react-icons/hi2";
import { ApiPostSignOut } from "@/modules/auth/api";
import { CLIENT_AUTH_SIGNIN_PAGE } from "@rona/routes/auth";
import { CLIENT_DASHBOARD_PAGE } from "@rona/routes/workspace";
import { useSession } from "@/modules/auth/hooks";
import AdminModals from "./modals";
import { useQueryClient } from "@tanstack/react-query";

type NavItem = { label: string; href: string };

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Home", href: "/admin" }],
  },
  {
    label: "Management",
    items: [{ label: "Users", href: "/admin/users" }],
  },
  {
    label: "Organizations",
    items: [
      { label: "Organizations", href: "/admin/organizations" },
      { label: "Departments", href: "/admin/departments" },
      { label: "Branches", href: "/admin/branches" },
      { label: "Employees", href: "/admin/employees" },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Organization Settings", href: "/admin/organization-settings" },
      { label: "Platform Configs", href: "/admin/configs" },
    ],
  },
];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

function AdminSidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(
    NAV_GROUPS.map((group) => group.label),
  );

  const toggleGroup = (label: string) => {
    setExpandedGroups((previous) =>
      previous.includes(label)
        ? previous.filter((item) => item !== label)
        : [...previous, label],
    );
  };

  const isActive = (href: string) => pathname === href;

  const navItemClass = (active: boolean) =>
    cn(
      "relative flex items-center gap-3 mx-2 px-3 py-2 rounded-md text-xs font-medium transition-colors",
      active
        ? "bg-zinc-900 text-white font-semibold"
        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
    );

  const renderItem = (label: string, href: string) => {
    const active = isActive(href);

    return (
      <Link key={href} href={href} onClick={onCloseMobile} className={navItemClass(active)}>
        <span className="flex-1 truncate">{label}</span>
      </Link>
    );
  };

  const renderSection = (label: string, items: NavItem[]) => {
    const expanded = expandedGroups.includes(label);

    return (
      <div key={label}>
        <button
          type="button"
          onClick={() => toggleGroup(label)}
          title={label}
          className="group w-full flex items-center justify-between px-3 pt-5 pb-1.5"
        >
          <span
            className={cn(
              "text-[10px] font-semibold uppercase tracking-widest transition-colors",
              "text-zinc-400 group-hover:text-zinc-600",
            )}
          >
            {label}
          </span>
          <HiOutlineChevronDown
            className={cn(
              "w-3.5 h-3.5 shrink-0 transition-all",
              expanded ? "rotate-180" : "",
              "text-zinc-400 group-hover:text-zinc-600",
            )}
          />
        </button>
        {expanded ? <div className="space-y-0.5">{items.map((item) => renderItem(item.label, item.href))}</div> : null}
      </div>
    );
  };

  if (collapsed) {
    return (
      <>
        {mobileOpen ? (
          <div
            className="fixed inset-0 z-40 bg-zinc-900/40 lg:hidden"
            onClick={onCloseMobile}
          />
        ) : null}

        <aside
          className={cn(
            "fixed lg:relative top-0 z-40 h-screen lg:h-full w-14 shrink-0 bg-white border-r border-zinc-200 flex flex-col justify-end p-2.5 transition-all duration-300",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          )}
        >
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            className="flex h-9 w-full items-center justify-center rounded-md border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
          >
            <HiOutlineChevronDoubleRight className="h-4 w-4" />
          </button>
        </aside>
      </>
    );
  }

  const topLevelGroups = NAV_GROUPS.filter((group) => group.label === "Overview");
  const sectionGroups = NAV_GROUPS.filter((group) => group.label !== "Overview");

  return (
    <>
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-zinc-900/40 lg:hidden"
          onClick={onCloseMobile}
        />
      ) : null}

      <aside className={cn("fixed lg:relative top-0 z-40 h-screen lg:h-full w-64 shrink-0 bg-white border-r border-zinc-200 flex flex-col transition-all duration-300", mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
        <div className="px-4 pt-5 pb-4 border-b border-zinc-200 shrink-0">
          <button
            type="button"
            title="Platform management"
            className="group flex w-full items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-zinc-50"
          >
            <HiOutlineShieldCheck className="h-4 w-4 shrink-0 text-zinc-500" />
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-xs font-semibold text-zinc-900">Platform management
              </span>
              <span className="block truncate text-[11px] text-zinc-500 font-mono">
                Super admin only
              </span>
            </span>
            <HiOutlineChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400 transition-colors group-hover:text-zinc-600" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 pb-4">
          {topLevelGroups.map((group) => group.items.map((item) => renderItem(item.label, item.href)))}

          <div className="mx-3 mt-3 h-px bg-zinc-200" />

          {sectionGroups.map((group) => renderSection(group.label, group.items))}
        </nav>

        <div className="p-3 border-t border-zinc-200 shrink-0">
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
            className="flex h-9 w-full items-center justify-center rounded-md border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
          >
            <HiOutlineChevronDoubleLeft className="h-4 w-4" />
          </button>
        </div>
      </aside>
    </>
  );
}

function AdminNavbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const [profileOpen, setProfileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await ApiPostSignOut();
      await queryClient.invalidateQueries({ queryKey: ["auth-session"] });
      router.push(CLIENT_AUTH_SIGNIN_PAGE);
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-zinc-200">
      <div className="h-14 px-4 sm:px-6 flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 -ml-2 rounded-lg text-zinc-600 hover:bg-zinc-100 transition"
          aria-label="Open navigation"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </button>

        <Image
          src="/rona-logo.png"
          alt="Rona ERP"
          width={120}
          height={40}
          className="h-5 w-auto shrink-0"
          priority
        />

        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-600">
          <HiOutlineWrenchScrewdriver className="h-3.5 w-3.5" />
          Admin
        </span>

        <span className="hidden xl:inline-flex items-center text-xs leading-none text-zinc-500">
          {formatDate(new Date())}
        </span>

        <div className="flex-1" />

        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((previous) => !previous)}
            className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-zinc-100 transition-all"
          >
            <span className="w-7 h-7 rounded-full ring-1 ring-zinc-200 bg-zinc-100 text-zinc-600 text-xs font-semibold flex items-center justify-center">
              {(user?.name ?? "A")
                .split(/\s+/)
                .slice(0, 2)
                .map((word) => word.charAt(0).toUpperCase())
                .join("")}
            </span>
            <HiOutlineChevronDown
              className={cn(
                "hidden sm:block w-3.5 h-3.5 text-zinc-500 transition-transform",
                profileOpen && "rotate-180",
              )}
            />
          </button>

          {profileOpen ? (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setProfileOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1.5 z-20 w-64 rounded-lg bg-white shadow-lg border border-zinc-200 py-1.5">
                <div className="px-3 py-2 border-b border-zinc-100">
                  <p className="text-xs font-semibold text-zinc-800 truncate">
                    {user?.name ?? "Signed in"}
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {user?.email ?? ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    router.push(CLIENT_DASHBOARD_PAGE);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50 transition"
                >
                  <HiOutlineUserCircle className="w-4 h-4 text-zinc-400" />
                  Back to workspace
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
                >
                  <HiOutlineArrowRightOnRectangle className="w-4 h-4" />
                  {signingOut ? "Signing out..." : "Sign out"}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}

type Props = {
  children: ReactNode;
};

const AdminWrapper = ({ children }: Props) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-[#f8fafc]">
      <AdminNavbar onOpenMobileNav={() => setMobileOpen(true)} />

      <div className="flex flex-1 min-h-0">
        <AdminSidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((previous) => !previous)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />

        <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8 gap-5 flex flex-col">
          {children}
        </main>
      </div>

      <AdminModals />
    </div>
  );
};

export default AdminWrapper;
