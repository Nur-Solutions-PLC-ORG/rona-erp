"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Database,
  Package,
  Shield,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { hairline, serif } from "./ui";

const docCategories = [
  {
    title: "Getting Started",
    eyebrow: "01 / Onboarding",
    description:
      "Quick-start guides that take you from an empty workspace to your first production run.",
    icon: BookOpen,
    items: [
      {
        title: "Introduction",
        href: "/docs/getting-started/introduction",
        meta: "What Rona ERP is and what it does",
      },
      {
        title: "Setup",
        href: "/docs/getting-started/setup",
        meta: "Organization, warehouses, roles",
      },
      {
        title: "First Steps",
        href: "/docs/getting-started/first-steps",
        meta: "Your first item to production order",
      },
      {
        title: "Dashboard",
        href: "/docs/getting-started/dashboard",
        meta: "Metrics, alerts, audit stream",
      },
    ],
  },
  {
    title: "Core Modules",
    eyebrow: "02 / Operations",
    description:
      "Deep dives into every operational module — inventory, manufacturing, quality, and more.",
    icon: Package,
    items: [
      {
        title: "Inventory",
        href: "/docs/modules/inventory",
        meta: "Items, lots, stock, movements",
      },
      {
        title: "Sales",
        href: "/docs/modules/sales",
        meta: "Customers, orders, commissions",
      },
      {
        title: "Manufacturing",
        href: "/docs/modules/manufacturing",
        meta: "BOMs, orders, batches, yield",
      },
      {
        title: "Quality",
        href: "/docs/modules/quality",
        meta: "Inspections and quarantine",
      },
      {
        title: "Traceability",
        href: "/docs/modules/traceability",
        meta: "Forward and reverse lot tracing",
      },
      {
        title: "Finance",
        href: "/docs/modules/finance",
        meta: "Invoices, payments, costs",
      },
      {
        title: "Workforce",
        href: "/docs/modules/workforce",
        meta: "Employees, shifts, attendance",
      },
      {
        title: "Kiosk",
        href: "/docs/modules/kiosk",
        meta: "Shared-device attendance terminal",
      },
    ],
  },
  {
    title: "Admin & Permissions",
    eyebrow: "03 / Administration",
    description:
      "Users, roles, organization settings, and the immutable audit log.",
    icon: Shield,
    items: [
      {
        title: "Users & Authentication",
        href: "/docs/admin/users",
        meta: "Accounts, sessions, security",
      },
      {
        title: "Roles & Permissions",
        href: "/docs/admin/roles",
        meta: "RBAC and least privilege",
      },
      {
        title: "Organization Settings",
        href: "/docs/admin/organization",
        meta: "Branding, currency, branches",
      },
      {
        title: "Audit Logs",
        href: "/docs/admin/audit",
        meta: "Every change, actor, and diff",
      },
    ],
  },
  {
    title: "Rona AI",
    eyebrow: "04 / Assistant",
    description:
      "The built-in operations analyst — queries, reports, and lot tracing in natural language.",
    icon: Sparkles,
    items: [
      {
        title: "Overview",
        href: "/docs/ai/overview",
        meta: "What Rona AI can do",
      },
      {
        title: "Queries",
        href: "/docs/ai/queries",
        meta: "Asking questions in plain English",
      },
      {
        title: "Reports",
        href: "/docs/ai/reports",
        meta: "Scheduled, on-demand exports",
      },
      {
        title: "Lot Tracing",
        href: "/docs/ai/tracing",
        meta: "Five-hop genealogy, instantly",
      },
    ],
  },
  {
    title: "API Reference",
    eyebrow: "05 / Integration",
    description:
      "JWT authentication and the REST endpoints behind every module.",
    icon: Database,
    items: [
      {
        title: "Authentication",
        href: "/docs/api/authentication",
        meta: "JWT sign-in and tokens",
      },
      {
        title: "Inventory API",
        href: "/docs/api/inventory",
        meta: "Stock operations endpoints",
      },
      {
        title: "Sales API",
        href: "/docs/api/sales",
        meta: "Customers and orders endpoints",
      },
      {
        title: "Manufacturing API",
        href: "/docs/api/manufacturing",
        meta: "BOMs and batches endpoints",
      },
      {
        title: "Finance API",
        href: "/docs/api/finance",
        meta: "Invoices and payments endpoints",
      },
    ],
  },
];

const popular = [
  { label: "Set up your workspace", href: "/docs/getting-started/setup" },
  {
    label: "Run your first production order",
    href: "/docs/getting-started/first-steps",
  },
  { label: "Trace a lot in five hops", href: "/docs/ai/tracing" },
  { label: "Understand RBAC", href: "/docs/admin/roles" },
];

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { filteredCategories, matchCount } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = docCategories
      .map((category) => ({
        ...category,
        items: q
          ? category.items.filter(
              (item) =>
                item.title.toLowerCase().includes(q) ||
                item.meta.toLowerCase().includes(q) ||
                category.title.toLowerCase().includes(q),
            )
          : category.items,
      }))
      .filter((category) => category.items.length > 0);
    return {
      filteredCategories: filtered,
      matchCount: filtered.reduce((sum, c) => sum + c.items.length, 0),
    };
  }, [searchQuery]);

  return (
    <article>
      <header className={`border-b-2 ${hairline} pb-8`}>
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7c6f96]">
          Documentation
        </span>
        <h1
          className={`mt-3 text-3xl font-semibold leading-tight text-[#581c87] sm:text-4xl ${serif}`}
        >
          Docs Hub
        </h1>
        <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-[#5c4d77]">
          Everything you need to master Rona ERP — from your first warehouse to
          five-hop lot tracing, Rona AI queries, and the full REST API. 25
          guides · 5 sections · updated with every release.
        </p>
      </header>

      <section className="mt-8">
        <div className="relative">
          <input
            type="text"
            placeholder="Search the docs — try “lots”, “invoices”, “JWT”…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full border-2 ${hairline} bg-white py-3 pl-4 pr-4 text-[13.5px] text-[#581c87] shadow-[4px_4px_0_0_#581c87] placeholder:text-[#a893c9] focus:outline-none focus:ring-2 focus:ring-[#581c87]/30`}
          />
          {searchQuery ? (
            <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-[#7c6f96]">
              {matchCount} result{matchCount === 1 ? "" : "s"} for &ldquo;
              {searchQuery}&rdquo;
            </p>
          ) : null}
        </div>

        {!searchQuery ? (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#7c6f96]">
              Popular
            </span>
            {popular.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className={`group inline-flex items-center gap-2 border ${hairline} bg-white px-3 py-1.5 text-[12px] font-medium text-[#581c87] hover:bg-[#581c87] hover:text-white`}
              >
                {p.label}
                <ArrowRight className="h-3 w-3" />
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <section className="mt-12">
        {filteredCategories.length === 0 ? (
          <div
            className={`mx-auto max-w-md border-2 ${hairline} bg-white p-10 text-center shadow-[8px_8px_0_0_#581c87]`}
          >
            <p className={`text-xl font-semibold text-[#581c87] ${serif}`}>
              No results for &ldquo;{searchQuery}&rdquo;
            </p>
            <p className="mt-2 text-[13px] text-[#5c4d77]">
              Try a broader term like &ldquo;inventory&rdquo; or
              &ldquo;roles&rdquo;.
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-5 inline-flex items-center gap-2 border border-[#581c87] bg-[#581c87] px-4 py-2 text-[13px] font-semibold text-white hover:bg-white hover:text-[#581c87]"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {filteredCategories.map((category, categoryIndex) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: categoryIndex * 0.05 }}
              >
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7c6f96]">
                      {category.eyebrow}
                    </span>
                    <h2
                      className={`mt-2 flex items-center gap-3 text-2xl font-semibold text-[#581c87] ${serif}`}
                    >
                      <category.icon className="h-5 w-5" strokeWidth={1.5} />
                      {category.title}
                    </h2>
                  </div>
                  <p className="max-w-md text-[12px] leading-relaxed text-[#5c4d77]">
                    {category.description}
                  </p>
                </div>

                <div
                  className={`mt-5 grid grid-cols-1 gap-px border ${hairline} bg-[#581c87] sm:grid-cols-2`}
                >
                  {category.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group relative bg-white p-4 hover:bg-[#f3eefb]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-[13px] font-semibold text-[#581c87] group-hover:underline group-hover:underline-offset-4">
                          {item.title}
                        </h3>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#a893c9] group-hover:translate-x-0.5 group-hover:text-[#581c87]" />
                      </div>
                      <p className="mt-1.5 text-[12px] leading-relaxed text-[#5c4d77]">
                        {item.meta}
                      </p>
                    </Link>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-14">
        <div
          className={`border-2 ${hairline} bg-[#581c87] p-6 text-center sm:p-8`}
        >
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a893c9]">
            Still stuck?
          </span>
          <h2 className={`mt-2 text-2xl font-semibold text-white ${serif}`}>
            Launch your workspace and learn by doing
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[12.5px] leading-relaxed text-[#e4dcf5]">
            Every guide maps directly to a screen in the app. Open your
            workspace side-by-side with the docs and follow along.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/sign-in"
              className="group inline-flex items-center gap-2 border border-white bg-white px-5 py-2.5 text-[13px] font-semibold text-[#581c87] hover:bg-[#581c87] hover:text-white"
            >
              Launch Workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/docs/getting-started/introduction"
              className="inline-flex items-center gap-2 border border-white px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-white hover:text-[#581c87]"
            >
              Start with the basics
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}
