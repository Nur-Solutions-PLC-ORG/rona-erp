"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChevronRight,
  Database,
  Home,
  Menu,
  Package,
  Shield,
  Sparkles,
  X,
} from "lucide-react";
import { hairline } from "./ui";

const sidebarSections = [
  {
    title: "Getting Started",
    icon: BookOpen,
    items: [
      { title: "Introduction", href: "/docs/getting-started/introduction" },
      { title: "Setup", href: "/docs/getting-started/setup" },
      { title: "First Steps", href: "/docs/getting-started/first-steps" },
      { title: "Dashboard", href: "/docs/getting-started/dashboard" },
    ],
  },
  {
    title: "Core Modules",
    icon: Package,
    items: [
      { title: "Inventory", href: "/docs/modules/inventory" },
      { title: "Sales", href: "/docs/modules/sales" },
      { title: "Manufacturing", href: "/docs/modules/manufacturing" },
      { title: "Quality", href: "/docs/modules/quality" },
      { title: "Traceability", href: "/docs/modules/traceability" },
      { title: "Finance", href: "/docs/modules/finance" },
      { title: "Workforce", href: "/docs/modules/workforce" },
    ],
  },
  {
    title: "Admin & Permissions",
    icon: Shield,
    items: [
      { title: "Users", href: "/docs/admin/users" },
      { title: "Roles", href: "/docs/admin/roles" },
      { title: "Organization", href: "/docs/admin/organization" },
      { title: "Audit Logs", href: "/docs/admin/audit" },
    ],
  },
  {
    title: "Rona AI",
    icon: Sparkles,
    items: [
      { title: "Overview", href: "/docs/ai/overview" },
      { title: "Queries", href: "/docs/ai/queries" },
      { title: "Reports", href: "/docs/ai/reports" },
      { title: "Tracing", href: "/docs/ai/tracing" },
    ],
  },
  {
    title: "API Reference",
    icon: Database,
    items: [
      { title: "Authentication", href: "/docs/api/authentication" },
      { title: "Inventory API", href: "/docs/api/inventory" },
      { title: "Sales API", href: "/docs/api/sales" },
      { title: "Manufacturing API", href: "/docs/api/manufacturing" },
      { title: "Finance API", href: "/docs/api/finance" },
    ],
  },
];

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#f9f7fd] lg:h-screen">
      <header
        className={`relative z-50 shrink-0 border-b ${hairline} bg-white`}
      >
        <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`border ${hairline} p-2 text-[#581c87] hover:bg-[#f3eefb] lg:hidden`}
              aria-label="Toggle navigation"
            >
              {isSidebarOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/rona-logo.png"
                alt="Rona ERP"
                width={500}
                height={179}
                className="h-6 w-auto"
                priority
              />
            </Link>
          </div>
          <div className="flex items-center gap-0">
            <Link
              href="/"
              className="hidden px-4 py-2 text-[13px] font-medium text-[#5c4d77] hover:text-[#581c87] sm:block"
            >
              <span className="inline-flex items-center gap-1.5">
                <Home className="h-3.5 w-3.5" />
                Back to home
              </span>
            </Link>
            <Link
              href="/docs"
              className={`flex items-center gap-1.5 border-l ${hairline} px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-[#581c87] hover:bg-[#f3eefb]`}
            >
              Docs Hub
            </Link>
          </div>
        </nav>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {isSidebarOpen ? (
          <div
            className="fixed inset-0 z-40 bg-[#581c87]/30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        ) : null}

        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r-2 ${hairline} bg-white transition-transform duration-300 ease-in-out lg:static lg:h-full lg:shrink-0 lg:translate-x-0 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav
            className={`h-full overflow-y-auto overscroll-contain border-b-2 ${hairline} bg-white p-4 pt-14 lg:border-b-0 lg:pt-4`}
          >
            <nav className="space-y-7">
              {sidebarSections.map((section) => (
                <div key={section.title}>
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className={`flex h-6 w-6 items-center justify-center border ${hairline} bg-[#f3eefb]`}
                    >
                      <section.icon
                        className="h-3.5 w-3.5 text-[#581c87]"
                        strokeWidth={1.5}
                      />
                    </span>
                    <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#7c6f96]">
                      {section.title}
                    </h3>
                  </div>
                  <ul className="space-y-0.5">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`flex items-center gap-2 border-l-2 px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                              isActive
                                ? `border-[#581c87] bg-[#581c87] text-white`
                                : `border-transparent text-[#5c4d77] hover:border-[#581c87] hover:bg-[#f3eefb] hover:text-[#581c87]`
                            }`}
                          >
                            <ChevronRight
                              className={`h-3 w-3 shrink-0 ${isActive ? "text-white" : "text-[#a893c9]"}`}
                            />
                            {item.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            <div className={`mt-8 border-t ${hairline} pt-5 pb-2`}>
              <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#7c6f96]">
                Version
              </p>
              <p className="mt-1.5 font-mono text-[11px] font-semibold text-[#581c87]">
                v2.6 · Real-time lot tracing
              </p>
            </div>
          </nav>
        </aside>

        <main
          ref={mainRef}
          className="min-w-0 flex-1 overflow-y-auto overscroll-contain"
        >
          <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
