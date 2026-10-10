"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Database,
  Package,
  Search,
  Shield,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { hairline, serif } from "./ui";
import { openDocsSearch, useModKey } from "./docs-search";
import { POPULAR } from "./search-config";

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

export default function DocsPage() {
  const modKey = useModKey();

  return (
    <article>
      <header className={`border-b-2 ${hairline} pb-8`}>
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-3">
          Documentation
        </span>
        <h1
          className={`mt-3 text-3xl font-semibold leading-tight text-ink sm:text-4xl ${serif}`}
        >
          Docs Hub
        </h1>
        <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-ink-2">
          Everything you need to master Rona ERP — from your first warehouse to
          five-hop lot tracing, Rona AI queries, and the full REST API. 25
          guides · 5 sections · updated with every release.
        </p>
      </header>

      <section className="mt-8">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-ink-3" />
          <input
            type="text"
            value=""
            aria-label="Search the docs"
            placeholder="Search the docs — try “lots”, “invoices”, “JWT”…"
            onClick={() => openDocsSearch()}
            onChange={(e) => openDocsSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") openDocsSearch();
            }}
            className={`w-full cursor-pointer border-2 ${hairline} bg-card py-3 pr-24 pl-11 text-[13.5px] text-ink shadow-[4px_4px_0_0_var(--ink)] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-ink/30`}
          />
          <span className="pointer-events-none absolute top-1/2 right-4 flex -translate-y-1/2 items-center gap-1">
            <kbd className="inline-flex h-5 min-w-5 items-center justify-center border border-ink/20 bg-tint px-1 font-mono text-[10px] font-semibold text-ink-2">
              {modKey}
            </kbd>
            <kbd className="inline-flex h-5 min-w-5 items-center justify-center border border-ink/20 bg-tint px-1 font-mono text-[10px] font-semibold text-ink-2">
              K
            </kbd>
          </span>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink-3">
            Popular
          </span>
          {POPULAR.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className={`group inline-flex items-center gap-2 border ${hairline} bg-card px-3 py-1.5 text-[12px] font-medium text-ink hover:bg-ink hover:text-card`}
            >
              {p.label}
              <ArrowRight className="h-3 w-3" />
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="space-y-12">
          {docCategories.map((category, categoryIndex) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: categoryIndex * 0.05 }}
            >
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-3">
                    {category.eyebrow}
                  </span>
                  <h2
                    className={`mt-2 flex items-center gap-3 text-2xl font-semibold text-ink ${serif}`}
                  >
                    <category.icon className="h-5 w-5" strokeWidth={1.5} />
                    {category.title}
                  </h2>
                </div>
                <p className="max-w-md text-[12px] leading-relaxed text-ink-2">
                  {category.description}
                </p>
              </div>

              <div
                className={`mt-5 grid grid-cols-1 gap-px border ${hairline} bg-ink sm:grid-cols-2`}
              >
                {category.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group relative bg-card p-4 hover:bg-tint"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-[13px] font-semibold text-ink group-hover:underline group-hover:underline-offset-4">
                        {item.title}
                      </h3>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ink-3 group-hover:translate-x-0.5 group-hover:text-ink" />
                    </div>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-ink-2">
                      {item.meta}
                    </p>
                  </Link>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <div className={`border-2 ${hairline} bg-ink p-6 text-center sm:p-8`}>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-card/70">
            Still stuck?
          </span>
          <h2 className={`mt-2 text-2xl font-semibold text-card ${serif}`}>
            Launch your workspace and learn by doing
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[12.5px] leading-relaxed text-tint-2">
            Every guide maps directly to a screen in the app. Open your
            workspace side-by-side with the docs and follow along.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/sign-in"
              className="group inline-flex items-center gap-2 border border-card bg-card px-5 py-2.5 text-[13px] font-semibold text-ink hover:bg-ink hover:text-card"
            >
              Launch Workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/docs/getting-started/introduction"
              className="inline-flex items-center gap-2 border border-card px-5 py-2.5 text-[13px] font-semibold text-card hover:bg-card hover:text-ink"
            >
              Start with the basics
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}
