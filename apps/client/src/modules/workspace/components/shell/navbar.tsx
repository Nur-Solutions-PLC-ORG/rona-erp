"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  HiOutlineArrowRightOnRectangle,
  HiOutlineBell,
  HiOutlineBuildingOffice2,
  HiOutlineCheck,
  HiOutlineChevronDown,
  HiOutlineMagnifyingGlass,
  HiOutlineSquares2X2,
  HiOutlineUserCircle,
} from "react-icons/hi2";
import { ApiPostSignOut } from "@/modules/auth/api";
import { CLIENT_AUTH_SIGNIN_PAGE } from "@rona/routes/auth";
import { CLIENT_APP_LAUNCHER_PAGE } from "@rona/routes/app";
import {
  CLIENT_DASHBOARD_PAGE,
  CLIENT_INSPECTIONS_PAGE,
  CLIENT_PRODUCTION_ORDERS_PAGE,
} from "@rona/routes/workspace";
import { useSession } from "@/modules/auth/hooks";
import { useCurrentOrganization, usePermissions } from "@/modules/workspace/hooks";
import { useOrganizationStore } from "@/store/organization";
import { NAV_GROUPS } from "./nav-config";
import {
  useDashboardInspections,
  useDashboardProductionOrders,
} from "@/modules/features/workspace/dashboard/hooks";
import { humanize } from "../ui";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

const BUILD_COMMIT = process.env.NEXT_PUBLIC_BUILD_COMMIT ?? "";
const IS_GIT_COMMIT = /^[0-9a-f]{7,40}$/i.test(BUILD_COMMIT);

function CommandPalette() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const pages = useMemo(
    () =>
      NAV_GROUPS.flatMap((group) => {
        if (group.label === "Overview") return group.items;
        return group.items.filter((item) =>
          item.anyOf
            ? item.anyOf.some((permission) => hasPermission(permission))
            : hasPermission(item.permission),
        );
      }),
    [hasPermission],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.href.toLowerCase().includes(q),
    );
  }, [pages, query]);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      setActiveIndex(0);
      router.push(href);
    },
    [router],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((previous) => {
          const next = !previous;
          if (next) requestAnimationFrame(() => inputRef.current?.focus());
          return next;
        });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        setQuery("");
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) =>
          results.length ? Math.min(index + 1, results.length - 1) : 0,
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
      } else if (event.key === "Enter") {
        const item = results[activeIndex];
        if (item) {
          event.preventDefault();
          navigate(item.href);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, results, activeIndex, navigate]);

  const safeIndex = Math.min(activeIndex, Math.max(results.length - 1, 0));

  return (
    <div className="relative hidden md:block">
      <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={open ? "command-palette-results" : undefined}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          setQuery("");
        }}
        placeholder="Search or press ⌘K…"
        className="w-56 lg:w-80 pl-8 pr-14 py-1.5 text-xs rounded-md bg-white border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
      />
      <span className="pointer-events-none absolute right-2.5 top-1/2 inline-flex h-5 -translate-y-1/2 items-center rounded border border-zinc-200 bg-zinc-50 px-1.5 text-[10px] font-medium text-zinc-400">
        ⌘K
      </span>

      {open ? (
        <div className="absolute right-0 top-full z-30 mt-1.5 w-80 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg">
          <ul id="command-palette-results" className="max-h-80 overflow-y-auto py-1">
            {results.length ? (
              results.map((item, index) => (
                <li key={item.href}>
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      navigate(item.href);
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors",
                      index === safeIndex
                        ? "bg-zinc-100 text-zinc-900"
                        : "text-zinc-700",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {item.label}
                    </span>
                    <span className="truncate text-[11px] text-zinc-400 font-mono">
                      {item.href}
                    </span>
                  </button>
                </li>
              ))
            ) : (
              <li>
                <p className="px-4 py-6 text-center text-xs text-zinc-500">
                  No pages match &ldquo;{query}&rdquo;.
                </p>
              </li>
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function Navbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const { organization, memberships, organizationId, membership } =
    useCurrentOrganization();
  const setOrganizationId = useOrganizationStore((s) => s.setOrganizationId);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [orgOpen, setOrgOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const { openOrders } = useDashboardProductionOrders();
  const { openInspections } = useDashboardInspections();
  const notificationCount = openOrders.length + openInspections.length;

  const handleSwitchOrg = (id: string) => {
    setOrgOpen(false);
    if (id === organizationId) return;
    setOrganizationId(id);
    queryClient.invalidateQueries();
    toast.success("Switched organization");
  };

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

  const primaryRole = membership?.roles?.[0];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-zinc-200">
      <div className="h-14 px-3 sm:px-6 flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 -ml-2 rounded-md text-zinc-600 hover:bg-zinc-100 transition shrink-0"
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
          className="h-5 w-auto shrink-0 hidden min-[360px]:block"
          priority
        />

        <button
          type="button"
          onClick={() => router.push(CLIENT_APP_LAUNCHER_PAGE)}
          className="p-2 -ml-1 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors shrink-0"
          aria-label="Switch workspace"
          title="Switch workspace"
        >
          <HiOutlineSquares2X2 className="w-4.5 h-4.5" />
        </button>

        <div className="relative min-w-0">
          <button
            type="button"
            onClick={() => setOrgOpen((previous) => !previous)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-zinc-200 hover:bg-zinc-50 transition overflow-hidden">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-zinc-100 text-zinc-600 sm:hidden">
              <HiOutlineBuildingOffice2 className="h-3 w-3" />
            </span>
            <span className="hidden sm:block max-w-40 truncate text-xs font-semibold text-zinc-800">
              {primaryRole ? humanize(primaryRole) : (organization?.name ?? "Select org")}
            </span>
            <HiOutlineChevronDown
              className={cn(
                "w-3.5 h-3.5 shrink-0 text-zinc-500 transition-transform",
                orgOpen && "rotate-180",
              )}
            />
          </button>

          {orgOpen ? (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setOrgOpen(false)}
              />
              <div className="absolute left-0 top-full mt-1.5 z-20 w-64 rounded-md bg-white shadow-lg border border-zinc-200 py-1.5">
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Organizations
                </p>
                {memberships.map((item) => (
                  <button
                    key={item.organizationId}
                    type="button"
                    onClick={() => handleSwitchOrg(item.organizationId)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-zinc-50 transition"
                  >
                    <HiOutlineCheck
                      className={cn(
                        "w-3.5 h-3.5 shrink-0",
                        item.organizationId === organizationId
                          ? "text-zinc-900"
                          : "text-transparent",
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-medium text-zinc-800 truncate">
                        {item.organization?.name ?? item.organizationId}
                      </span>
                      <span className="block text-[10px] text-zinc-400 truncate">
                        {(item.roles ?? []).map(humanize).join(", ") || "Member"}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>

        <span className="hidden xl:inline-flex items-center text-xs leading-none text-zinc-500">
          {formatDate(new Date())}
        </span>

        <div className="flex-1" />

        <CommandPalette />

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setNotifOpen((previous) => !previous)}
            className="relative p-2 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
            aria-label="Notifications"
          >
            <HiOutlineBell className="w-4.5 h-4.5" />
            {notificationCount > 0 ? (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            ) : null}
          </button>

          {notifOpen ? (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setNotifOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1.5 z-20 w-80 rounded-md bg-white shadow-lg border border-zinc-200 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-zinc-100">
                  <p className="text-xs font-bold text-zinc-800">
                    Notifications
                  </p>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-zinc-50">
                  {notificationCount === 0 ? (
                    <p className="px-4 py-6 text-center text-xs text-zinc-400">
                      Nothing needs your attention
                    </p>
                  ) : null}
                  {openOrders.slice(0, 4).map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        router.push(CLIENT_PRODUCTION_ORDERS_PAGE);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-zinc-50 transition"
                    >
                      <p className="text-xs font-semibold text-zinc-800">
                        Production order open
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate">
                        {order.orderNumber} — {humanize(order.status)}
                      </p>
                    </button>
                  ))}
                  {openInspections.slice(0, 4).map((inspection) => (
                    <button
                      key={inspection.id}
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        router.push(CLIENT_INSPECTIONS_PAGE);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-zinc-50 transition"
                    >
                      <p className="text-xs font-semibold text-zinc-800">
                        Inspection in progress
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate">
                        {inspection.inspectionNumber} —{" "}
                        {humanize(inspection.type)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setProfileOpen((previous) => !previous)}
            className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-zinc-100 transition-colors"
          >
            <span className="w-7 h-7 rounded-full ring-1 ring-zinc-200 bg-zinc-100 text-zinc-600 text-xs font-semibold flex items-center justify-center">
              {(user?.name ?? "U")
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
              <div className="absolute right-0 top-full mt-1.5 z-20 w-64 rounded-md bg-white shadow-lg border border-zinc-200 py-1.5">
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
                  Dashboard
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
                {BUILD_COMMIT ? (
                  <div className="border-t border-zinc-100 px-3 py-1.5">
                    {IS_GIT_COMMIT ? (
                      <a
                        href={`https://github.com/Nur-Solutions-PLC-ORG/rona-erp/commit/${BUILD_COMMIT}`}
                        target="_blank"
                        rel="noreferrer"
                        title="View the exact deployed build on GitHub"
                        className="block font-mono text-[10px] text-zinc-400 hover:text-zinc-600 transition-colors"
                      >
                        Build {BUILD_COMMIT.slice(0, 7)}
                      </a>
                    ) : (
                      <p
                        className="font-mono text-[10px] text-zinc-400"
                        title="Deployed build"
                      >
                        Build {BUILD_COMMIT.slice(0, 12)}
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
