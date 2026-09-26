"use client";

import ThemeToggle from "@/components/custom/theme-toggle";
import Logo from "@/components/custom/logo";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Boxes,
  ClipboardCheck,
  Cog,
  Database,
  FileCheck2,
  Fingerprint,
  Gauge,
  Lock,
  PackageCheck,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Workflow as WorkflowIcon,
  Zap,
} from "lucide-react";
import { useSession } from "@/modules/auth/hooks";
import { CLIENT_APP_LAUNCHER_PAGE } from "@rona/routes/app";
import { MobileMenu } from "./mobile-menu";

const container = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";
const hairline = "border-ink";

const serif = "font-heading tracking-[-0.01em]";

const springSnap = {
  type: "spring",
  stiffness: 550,
  damping: 32,
  mass: 0.9,
} as const;

const hoverFill =
  "transition-none group-hover:bg-ink group-hover:text-card group-hover:border-ink";

const navLinks = [
  { label: "Platform", href: "#platform" },
  { label: "Workflow", href: "#workflow" },
  { label: "Architecture", href: "#architecture" },
  { label: "Modules", href: "#modules" },
  { label: "Docs", href: "/docs" },
];

function Navbar() {
  const { user } = useSession();

  return (
    <header className={`sticky top-0 z-50 border-b ${hairline} bg-card`}>
      <nav className={`${container} flex h-14 items-center justify-between`}>
        <Link href="/" className="flex items-center shrink-0">
          <Logo variant="dark" className="h-6 w-auto" />
        </Link>

        <div className="hidden md:flex items-center h-full">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="flex h-full items-center border-l border-tint-2 px-5 text-[13px] font-medium text-ink-2 hover:bg-tint hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-0">
          {user ? (
            <Link
              href={CLIENT_APP_LAUNCHER_PAGE}
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-ink-2 hover:text-ink"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[10px] font-bold uppercase text-card">
                {user.name?.slice(0, 1) ?? "U"}
              </span>
              My account
            </Link>
          ) : (
            <Link
              href="/sign-in"
              className="hidden sm:flex items-center px-4 py-2 text-[13px] font-medium text-ink-2 hover:text-ink"
            >
              Sign in
            </Link>
          )}
          <Link
            href={user ? CLIENT_APP_LAUNCHER_PAGE : "/sign-in"}
            className="group hidden items-center gap-2 border border-ink bg-ink px-4 py-2 text-[13px] font-semibold text-card hover:bg-card hover:text-ink sm:flex"
          >
            {user ? "Go to workspace" : "Launch Workspace"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          <ThemeToggle className="ml-2 rounded-none border-ink/30 text-ink-2" />

          <MobileMenu
            links={navLinks}
            ctaHref={user ? CLIENT_APP_LAUNCHER_PAGE : "/sign-in"}
            ctaLabel={user ? "Go to workspace" : "Launch Workspace"}
          />
        </div>
      </nav>
    </header>
  );
}

function SnapBadge({
  icon,
  title,
  meta,
  tone = "neutral",
  className,
  delay = 0,
}: {
  icon: React.ReactNode;
  title: string;
  meta: string;
  tone?: "ok" | "warn" | "neutral";
  className?: string;
  delay?: number;
}) {
  const tones = {
    ok: "text-ink",
    warn: "text-ink",
    neutral: "text-ink",
  };
  return (
    <motion.div
      initial={{ opacity: 0, x: -14, scale: 0.94 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ ...springSnap, delay }}
      className={`absolute z-20 hidden lg:flex items-center gap-2.5 border ${hairline} bg-card px-3 py-2.5 shadow-[4px_4px_0_0_var(--ink)] ${className ?? ""}`}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center border ${hairline} ${
          tone === "ok"
            ? "bg-emerald-50"
            : tone === "warn"
              ? "bg-warn-soft"
              : "bg-tint"
        }`}
      >
        {icon}
      </span>
      <div className={tones[tone]}>
        <div className="text-[11px] font-semibold leading-tight">{title}</div>
        <div className="text-[10px] font-mono text-ink-3 leading-tight">
          {meta}
        </div>
      </div>
    </motion.div>
  );
}

function DashboardPreview() {
  const stockRows = [
    {
      sku: "WF-500",
      item: "Wheat Flour",
      lot: "LOT-26-001",
      qty: "450.00 KG",
      pct: 82,
      status: "OK",
      st: "bg-ink text-card",
    },
    {
      sku: "VC-012",
      item: "Vanilla Cake",
      lot: "LOT-26-044",
      qty: "12.00 EA",
      pct: 12,
      status: "LOW",
      st: "bg-warn-soft text-ink border border-ink",
    },
    {
      sku: "BR-100",
      item: "Bread Loaf",
      lot: "FG-26-001",
      qty: "230.00 EA",
      pct: 64,
      status: "OK",
      st: "bg-ink text-card",
    },
    {
      sku: "DR-045",
      item: "Dinner Rolls",
      lot: "FG-26-012",
      qty: "0.00 EA",
      pct: 0,
      status: "OUT",
      st: "bg-ink text-card",
    },
  ];

  const prodOrders = [
    { id: "PO-BREAD-044", progress: 65, stage: "Mixing · St. 2" },
    { id: "PO-ROLLS-012", progress: 15, stage: "Scheduled" },
    { id: "PO-CAKE-008", progress: 100, stage: "Completed" },
  ];

  const events = [
    { t: "14:02", ref: "mv-8f42", msg: "Stock moved MAIN → TRANSIT" },
    { t: "13:51", ref: "in-1c09", msg: "Inspection approved · QA gate" },
    { t: "12:44", ref: "rs-77e2", msg: "50 KG reserved PO-BREAD-044" },
  ];

  return (
    <div className="relative">
      <SnapBadge
        icon={<FileCheck2 className="h-4 w-4" />}
        title="Inspection passed"
        meta="LOT-26-001 · QA gate"
        tone="ok"
        delay={0.9}
        className="-left-8 xl:-left-14 top-10"
      />
      <SnapBadge
        icon={<Boxes className="h-4 w-4" />}
        title="Low stock alert"
        meta="VC-012 · 12 < 20"
        tone="warn"
        delay={1.1}
        className="-right-8 xl:-right-14 top-36"
      />
      <SnapBadge
        icon={<Cog className="h-4 w-4" />}
        title="Production running"
        meta="PO-BREAD-044 · 65%"
        delay={1.3}
        className="left-10 xl:left-0 -bottom-5"
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className={`relative border-2 ${hairline} bg-card shadow-[8px_8px_0_0_var(--ink)]`}
      >
        <div
          className={`flex h-9 items-center border-b ${hairline} bg-tint px-3`}
        >
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 border border-ink bg-card" />
            <span className="h-2.5 w-2.5 border border-ink bg-card" />
            <span className="h-2.5 w-2.5 border border-ink bg-ink" />
          </div>
          <div className="mx-auto flex items-center gap-1.5 border border-ink bg-card px-3 py-0.5 font-mono text-[10px] text-ink-3">
            <Lock className="h-2.5 w-2.5" />
            app.rona-erp.com/dashboard
          </div>
          <span className="font-mono text-[10px] text-ink-3">v2.6.1</span>
        </div>

        <div className="grid grid-cols-12">
          <div
            className={`col-span-2 hidden border-r ${hairline} bg-card md:block`}
          >
            <div
              className={`border-b ${hairline} px-3 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider`}
            >
              Modules
            </div>
            {[
              "Dashboard",
              "Inventory",
              "Quality",
              "Mfg",
              "Trace",
              "Sales",
              "Finance",
              "Workforce",
            ].map((m, i) => (
              <div
                key={m}
                className={`flex items-center gap-2 border-b ${hairline} px-3 py-2 text-[11px] font-medium ${
                  i === 1
                    ? "bg-ink text-card"
                    : "text-ink-2 hover:bg-tint"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 border ${i === 1 ? "border-card" : "border-ink"}`}
                />
                {m}
              </div>
            ))}
          </div>

          <div className="col-span-12 md:col-span-10">
            <div
              className={`grid grid-cols-2 divide-x ${hairline} border-b ${hairline} lg:grid-cols-4`}
            >
              {[
                { k: "Stock value", v: "1.28M", d: "ETB", delta: "+4.2%" },
                { k: "Open orders", v: "18", d: "production", delta: "−2" },
                {
                  k: "Pass rate",
                  v: "98.4%",
                  d: "inspections",
                  delta: "+0.6%",
                },
                { k: "Avg latency", v: "8ms", d: "API p95", delta: "−1ms" },
              ].map((s) => (
                <div
                  key={s.k}
                  className="group bg-card px-4 py-3 hover:bg-tint"
                >
                  <div className="font-mono text-[9px] uppercase tracking-widest text-ink-3">
                    {s.k}
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-mono text-xl font-semibold tabular-nums">
                      {s.v}
                    </span>
                    <span className="text-[10px] text-ink-3">{s.d}</span>
                    <span className="ml-auto font-mono text-[10px] text-ink">
                      {s.delta}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div
              className={`grid grid-cols-1 divide-y ${hairline} lg:grid-cols-5 lg:divide-y-0 lg:divide-x`}
            >
              <div className="lg:col-span-3">
                <div
                  className={`flex items-center justify-between border-b ${hairline} px-4 py-2`}
                >
                  <span className="text-[12px] font-semibold">
                    Stock balances
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-ink-3">
                    Live
                  </span>
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr
                      className={`border-b ${hairline} font-mono text-[9px] uppercase tracking-wider text-ink-3`}
                    >
                      <th className="px-4 py-1.5 font-medium">SKU</th>
                      <th className="px-2 py-1.5 font-medium">Item</th>
                      <th className="px-2 py-1.5 font-medium">Lot</th>
                      <th className="px-2 py-1.5 font-medium text-right">
                        Qty
                      </th>
                      <th className="px-4 py-1.5 font-medium">State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockRows.map((r) => (
                      <tr
                        key={r.sku}
                        className={`border-b ${hairline} text-[11px] hover:bg-tint`}
                      >
                        <td className="px-4 py-2 font-mono font-semibold">
                          {r.sku}
                        </td>
                        <td className="px-2 py-2 text-ink-2">{r.item}</td>
                        <td className="px-2 py-2 font-mono text-ink-3">
                          {r.lot}
                        </td>
                        <td className="px-2 py-2 text-right font-mono tabular-nums">
                          {r.qty}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-1.5 py-0.5 text-[9px] font-bold tracking-wide ${r.st}`}
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="lg:col-span-2">
                <div
                  className={`border-b ${hairline} px-4 py-2 text-[12px] font-semibold`}
                >
                  Production orders
                </div>
                {prodOrders.map((o) => (
                  <div
                    key={o.id}
                    className={`border-b ${hairline} px-4 py-2.5 hover:bg-tint`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-semibold">
                        {o.id}
                      </span>
                      <span className="font-mono text-[9px] text-ink-3">
                        {o.stage}
                      </span>
                    </div>
                    <div className="mt-1.5 flex h-2 border border-ink bg-card">
                      <div
                        className="h-full bg-ink"
                        style={{ width: `${o.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className="px-4 py-2 text-[12px] font-semibold">
                  Audit stream
                </div>
                {events.map((e) => (
                  <div
                    key={e.ref}
                    className={`border-b ${hairline} px-4 py-2 text-[10px] hover:bg-tint`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-ink-3">{e.t}</span>
                      <span className="border border-ink bg-tint px-1 font-mono font-semibold">
                        {e.ref}
                      </span>
                    </div>
                    <div className="mt-1 text-ink-2">{e.msg}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          className={`flex items-center justify-between border-t ${hairline} bg-tint px-3 py-1.5`}
        >
          <span className="font-mono text-[9px] text-ink-3">
            TENANT: 7c9e · REGION: eu-west · SYNCED 3s ago
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[9px] text-ink">
            <span className="h-1.5 w-1.5 bg-ink" />
            OPERATIONAL
          </span>
        </div>
      </motion.div>
    </div>
  );
}

const brandPillars = [
  "Smart QR Integration",
  "Multi-Currency Finance",
  "Complete HR Suite",
];

function Hero() {
  const { user } = useSession();
  return (
    <section className="brand-gradient relative isolate overflow-hidden border-b border-ink">
      <div aria-hidden className="brand-waves absolute inset-0 -z-10" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(55%_45%_at_50%_42%,var(--hero-vignette),transparent)]"
      />
      <div className={`${container} relative z-10 pt-16 pb-20 sm:pt-24`}>
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="inline-flex items-center border border-ink/20 bg-card/60 px-3 py-1.5 text-ink-2"
          >
            <span className="border-r border-ink/20 pr-2 font-mono text-[10px] font-bold uppercase tracking-widest text-tagline">
              New
            </span>
            <span className="pl-2 text-[12px]">
              Rona AI assistant is now built into every module
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.04 }}
            className="mt-10 flex justify-center"
          >
            <Logo className="h-16 sm:h-20" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="mt-8 font-sans text-[2.4rem] font-normal leading-[1.1] tracking-tight sm:text-6xl lg:text-[4.2rem]"
          >
            <span className="text-tagline">Streamline Your Success</span>
            <br />
            <span className="text-tagline">with</span>{" "}
            <span className="text-tagline-strong">RONA.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.16 }}
            className="mx-auto mt-6 max-w-2xl text-[15px] leading-relaxed text-ink-2"
          >
            The enterprise-grade platform dedicated to transforming complex
            operations into streamlined success. A complete solution for
            retail, manufacturing, services, and distribution companies —
            inventory management, financial tracking, and employee management
            in one place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.24 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              href={user ? CLIENT_APP_LAUNCHER_PAGE : "/sign-in"}
              className="group flex items-center gap-2 border border-brand-green bg-brand-green px-6 py-3 text-[13px] font-semibold text-brand-ink transition-colors hover:border-brand-mint hover:bg-brand-mint"
            >
              {user ? "Go to workspace" : "Launch Workspace"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#platform"
              className="group flex items-center gap-2 border border-ink/30 px-6 py-3 text-[13px] font-semibold text-ink transition-colors hover:bg-ink/5"
            >
              Explore platform
              <ArrowRight className="h-4 w-4" />
            </a>
          </motion.div>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-ink-3">
            Free 14-day trial · No card required
          </p>

          <ul className="mt-12 grid grid-cols-1 gap-3 border-t border-ink/10 pt-8 sm:grid-cols-3">
            {brandPillars.map((pillar) => (
              <li
                key={pillar}
                className="text-sm font-bold tracking-wide text-tagline"
              >
                {pillar}
              </li>
            ))}
          </ul>
        </div>

        <div className="mx-auto mt-14 max-w-6xl">
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}

const stats = [
  { v: "8ms", k: "API response, p95" },
  { v: "100%", k: "Audit coverage" },
  { v: "RLS", k: "Tenant isolation" },
  { v: "99.9%", k: "Uptime SLA" },
];

function StatsStrip() {
  return (
    <section className={`border-b ${hairline} bg-card`}>
      <div
        className={`${container} grid grid-cols-2 divide-x divide-tint-2 lg:grid-cols-4`}
      >
        {stats.map((s, i) => (
          <motion.div
            key={s.k}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className={`group ${i < 2 ? "border-b lg:border-b-0" : ""} ${
              i % 2 === 1 ? "border-l lg:border-l" : ""
            } border-tint-2 px-6 py-8 hover:bg-background`}
          >
            <div
              className={`font-mono text-3xl font-semibold tabular-nums ${hoverFill} px-1 -mx-1`}
            >
              {s.v}
            </div>
            <div className="mt-1.5 text-[12px] font-medium uppercase tracking-wider text-ink-3">
              {s.k}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

const archFeatures = [
  {
    icon: Zap,
    title: "Sub-10ms Response Times",
    body: "Optimized queries, connection pooling, and intelligent caching across every module.",
    spec: "P95 8MS · 1.2K RPS",
  },
  {
    icon: Database,
    title: "Real-Time Stock Reservations",
    body: "Reserve, allocate, and reconcile stock across warehouses with zero-latency conflict resolution.",
    spec: "0 DUPLICATES · SERIALIZED",
  },
  {
    icon: Fingerprint,
    title: "Batch & Lot Tracking",
    body: "Trace every lot from inbound receipt through production to outbound shipment with full genealogy.",
    spec: "5-HOP TRACE · 100% COVERAGE",
  },
  {
    icon: ShieldCheck,
    title: "Multi-Tenant Isolation",
    body: "Complete data isolation per organization. Row-level security enforced at the database layer.",
    spec: "RLS · SOC2-READY",
  },
  {
    icon: Gauge,
    title: "Operational Dashboards",
    body: "Real-time KPIs, low-stock alerts, open production orders, and inspection status at a glance.",
    spec: "12 WIDGETS · 1s REFRESH",
  },
  {
    icon: ScanSearch,
    title: "Audit-Ready Logging",
    body: "Every state change recorded with timestamp, actor, and diff. Compliance-ready out of the box.",
    spec: "IMMUTABLE · ACTOR + DIFF",
  },
];

function ArchitectureSection() {
  return (
    <section
      id="architecture"
      className={`border-b ${hairline} bg-card py-20 sm:py-28`}
    >
      <div className={container}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_2fr] lg:items-end">
          <div>
            <h2
              className={`text-3xl font-semibold text-ink sm:text-5xl ${serif}`}
            >
              Enterprise-grade
              <br />
              performance
            </h2>
          </div>
          <p className="text-[14px] leading-relaxed text-ink-2 lg:pb-2">
            Designed for organizations that need reliable, fast, and auditable
            operations at scale. No redundant data entry, no manual
            reconciliation, no blind spots across your supply chain.
          </p>
        </div>

        <div
          className={`mt-14 grid grid-cols-1 gap-px border ${hairline} bg-ink sm:grid-cols-2 lg:grid-cols-3`}
        >
          {archFeatures.map((f, i) => (
            <motion.article
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: (i % 3) * 0.08 }}
              className="group relative bg-card p-6 hover:bg-background"
            >
              <div className="flex items-start justify-between">
                <f.icon className="h-5 w-5 text-ink" strokeWidth={1.5} />
                <span className="font-mono text-[10px] tabular-nums text-ink-3 group-hover:text-ink">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-5 text-[14px] font-semibold text-ink">
                {f.title}
              </h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-ink-2">
                {f.body}
              </p>
              <div className="mt-5 border-t border-tint-2 pt-3 font-mono text-[9px] font-semibold uppercase tracking-widest text-ink-3 group-hover:border-ink group-hover:text-ink">
                {f.spec}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

const workflowSteps = [
  {
    icon: PackageCheck,
    title: "Receive",
    body: "Register inbound lots with supplier, quantity, and expiry — quarantined until inspected.",
    detail: "PO-2026-001 · +500 KG",
  },
  {
    icon: ClipboardCheck,
    title: "Inspect",
    body: "Run quality inspections with pass/fail gates. Failed lots stay locked in quarantine.",
    detail: "QA GATE · APPROVED",
  },
  {
    icon: WorkflowIcon,
    title: "Reserve",
    body: "Reserve stock for production orders with zero-latency conflict resolution.",
    detail: "50 KG → PO-BREAD-044",
  },
  {
    icon: Cog,
    title: "Produce",
    body: "Consume reserved materials against BOMs, output finished lots with full genealogy.",
    detail: "FG-LOT-001 · 95% YIELD",
  },
];

function WorkflowSection() {
  return (
    <section
      id="workflow"
      className={`border-b ${hairline} bg-background py-20 sm:py-28`}
    >
      <div className={container}>
        <div className="max-w-2xl">
          <h2
            className={`text-3xl font-semibold text-ink sm:text-5xl ${serif}`}
          >
            Dock to finished goods,
            <br />
            in four steps
          </h2>
          <p className="mt-4 text-[14px] leading-relaxed text-ink-2">
            A single, repeatable flow your whole team can trust. Every step
            writes an immutable audit record.
          </p>
        </div>

        <div className="relative mt-16">
          <svg
            aria-hidden
            className="absolute left-0 right-0 top-7 hidden h-px w-full lg:block"
            viewBox="0 0 1200 2"
            preserveAspectRatio="none"
          >
            <motion.line
              x1="0"
              y1="1"
              x2="1200"
              y2="1"
              className="stroke-ink"
              strokeWidth="2"
              strokeDasharray="8 6"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1.6, ease: [0.65, 0, 0.35, 1] }}
            />
          </svg>

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {workflowSteps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ ...springSnap, delay: 0.25 + i * 0.35 }}
                className="group relative"
              >
                <div className="relative z-10 flex h-14 w-14 items-center justify-center border-2 border-ink bg-card text-ink shadow-[4px_4px_0_0_var(--ink)] group-hover:bg-ink group-hover:text-card group-hover:shadow-none group-hover:translate-x-1 group-hover:translate-y-1">
                  <step.icon className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <div className="mt-6 flex items-baseline gap-3">
                  <span className="font-mono text-[11px] font-bold tabular-nums text-ink-3">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3
                    className={`text-xl font-semibold text-ink ${serif}`}
                  >
                    {step.title}
                  </h3>
                </div>
                <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-2">
                  {step.body}
                </p>
                <div className="mt-4 inline-block border border-ink bg-card px-2 py-1 font-mono text-[10px] font-semibold text-ink group-hover:bg-ink group-hover:text-card">
                  {step.detail}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const modules = [
  {
    abbr: "INV",
    name: "Inventory Control",
    body: "Items, warehouses, lots, and stock balances with reservations and a complete movement ledger.",
    tags: ["MULTI-WAREHOUSE", "LOTS", "LEDGER"],
  },
  {
    abbr: "MFG",
    name: "Manufacturing",
    body: "Bills of materials, production orders, batch execution, and component consumption with genealogy.",
    tags: ["BOM", "BATCHES", "YIELD"],
  },
  {
    abbr: "QAS",
    name: "Quality Assurance",
    body: "Inspections with pass/fail gates, quarantine control, and lot release or rejection workflows.",
    tags: ["QA GATES", "QUARANTINE", "PASS RATE"],
  },
  {
    abbr: "TRC",
    name: "Traceability",
    body: "Forward and reverse lot tracing across every production hop — from inbound receipt to shipment.",
    tags: ["5-HOP TRACE", "GENEALOGY", "FDA-READY"],
  },
  {
    abbr: "SLS",
    name: "Sales & CRM",
    body: "Customers, sales orders with stock availability checks, confirmations, and commission tracking.",
    tags: ["ORDERS", "AVAILABILITY", "COMMISSIONS"],
  },
  {
    abbr: "FIN",
    name: "Finance",
    body: "Invoices generated from fulfilled orders, payment allocation, and cost centers for true COGS.",
    tags: ["INVOICES", "PAYMENTS", "COSTS"],
  },
  {
    abbr: "WFP",
    name: "Workforce",
    body: "Employee directory, attendance, shift scheduling, departments, and positions with role-based access.",
    tags: ["ATTENDANCE", "SHIFTS", "DEPARTMENTS"],
  },
  {
    abbr: "ORG",
    name: "Organization",
    body: "Members, roles, and a complete audit log across every branch of your organization.",
    tags: ["MEMBERS", "ROLES", "AUDIT LOG"],
  },
];

const aiPrompts = [
  {
    q: "Trace lot LOT-2026-001 across production",
    a: "5 hops. Received 500 KG Ethio Grain → QA approved → 50 KG consumed PO-BREAD-044 → FG-LOT-2026-001 · 95% yield.",
  },
  {
    q: "Which items are below reorder point?",
    a: "2 items. VC-012 Vanilla Cake (12 < 20), DR-045 Dinner Rolls (0 < 40). Draft POs ready for approval.",
  },
  {
    q: "Summarize last month's production cost",
    a: "ETB 412,800 total · +4.2% vs prior. Flour drove 61% of variance. Report generated.",
  },
];

function RonaAiIntro() {
  return (
    <div
      className={`mt-14 border-2 ${hairline} bg-card shadow-[8px_8px_0_0_var(--ink)]`}
    >
      <div
        className={`flex items-center justify-between border-b-2 ${hairline} bg-ink px-5 py-3`}
      >
        <div className="flex items-center gap-3">
          <Sparkles className="h-4 w-4 text-card" strokeWidth={1.5} />
          <span className={`text-lg font-semibold text-card ${serif}`}>
            Rona AI
          </span>
          <span className="border border-card px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-card">
            Built-in
          </span>
        </div>
        <span className="hidden font-mono text-[9px] uppercase tracking-widest text-tint-2 sm:block">
          ASSISTANT · EVERY MODULE
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5">
        <div
          className={`border-b ${hairline} p-6 lg:col-span-2 lg:border-b-0 lg:border-r`}
        >
          <h3
            className={`text-2xl font-semibold leading-tight text-ink ${serif}`}
          >
            An operations analyst
            <br />
            that never sleeps
          </h3>
          <p className="mt-4 text-[12.5px] leading-relaxed text-ink-2">
            Rona AI lives inside every module with full context of your
            inventory, production, quality, and finance data. Ask it to trace
            lots, draft reports, flag anomalies, or summarize performance — it
            reads your live records, not generic training data.
          </p>
          <ul className="mt-5 space-y-2.5">
            {[
              "Lot tracing on demand, 5 hops deep",
              "Natural-language reports across any module",
              "Anomaly alerts before they become write-offs",
              "Zero setup — knows your schema from day one",
            ].map((t) => (
              <li
                key={t}
                className="flex items-start gap-2.5 text-[12.5px] text-ink-2"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-ink" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-3">
          {aiPrompts.map((m, i) => (
            <motion.div
              key={m.q}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ ...springSnap, delay: i * 0.15 }}
              className={`group border-b ${hairline} p-5 last:border-b-0 hover:bg-background`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`shrink-0 border ${hairline} bg-ink px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-card`}
                >
                  You
                </span>
                <p className="text-[13px] font-medium text-ink">{m.q}</p>
              </div>
              <div className="mt-3 flex items-start gap-3">
                <span
                  className={`shrink-0 border ${hairline} bg-card px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-ink`}
                >
                  AI
                </span>
                <p className="text-[12.5px] leading-relaxed text-ink-2">
                  {m.a}
                </p>
              </div>
            </motion.div>
          ))}
          <div
            className={`flex items-center gap-2 border-t-2 ${hairline} bg-background px-5 py-3`}
          >
            <span className="h-1.5 w-1.5 animate-pulse bg-ink" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
              Ask anything about your operation
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModulesSection() {
  return (
    <section
      id="modules"
      className={`border-b ${hairline} bg-card py-20 sm:py-28`}
    >
      <div className={container}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_2fr] lg:items-end">
          <div>
            <h2
              className={`text-3xl font-semibold text-ink sm:text-5xl ${serif}`}
            >
              One platform,
              <br />
              every module
            </h2>
          </div>
          <p className="text-[14px] leading-relaxed text-ink-2 lg:pb-2">
            Eight operational modules plus Rona AI on a single data core — every
            record cross-linked, every change audited, no third-party glue
            holding your operation together.
          </p>
        </div>

        <div
          className={`mt-14 grid grid-cols-1 gap-px border ${hairline} bg-ink sm:grid-cols-2 lg:grid-cols-4`}
        >
          {modules.map((m, i) => (
            <motion.article
              key={m.abbr}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: (i % 3) * 0.08 }}
              className="group relative bg-card p-6 hover:bg-background"
            >
              <div className="flex items-start justify-between">
                <span
                  className={`font-mono text-xl font-bold ${serif} text-ink`}
                >
                  {m.abbr}
                </span>
                <span className="font-mono text-[10px] tabular-nums text-ink-3 group-hover:text-ink">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-4 text-[14px] font-semibold text-ink">
                {m.name}
              </h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-ink-2">
                {m.body}
              </p>
              <div className="mt-5 flex flex-wrap gap-1.5 border-t border-tint-2 pt-3">
                {m.tags.map((t) => (
                  <span
                    key={t}
                    className="border border-ink px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-widest text-ink group-hover:bg-ink group-hover:text-card"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </motion.article>
          ))}
        </div>

        <RonaAiIntro />
      </div>
    </section>
  );
}

function CtaSlab() {
  const { user } = useSession();

  return (
    <section className="brand-gradient-teal relative isolate overflow-hidden py-20 sm:py-24">
      <div aria-hidden className="brand-waves absolute inset-0 -z-10" />
      <div className={`${container} text-center`}>
        <h2
          className={`text-3xl font-semibold text-ink sm:text-5xl ${serif}`}
        >
          {user ? "Welcome back." : "Ready to streamline your operations?"}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[14px] leading-relaxed text-ink-2">
          {user
            ? "Your workspace is ready — pick up right where you left off."
            : "Launch your workspace and manage inventory, manufacturing, and traceability in one place."}
        </p>
        <Link
          href={user ? CLIENT_APP_LAUNCHER_PAGE : "/sign-in"}
          className="group mt-9 inline-flex items-center gap-2 border border-brand-green bg-brand-green px-7 py-3.5 text-[13px] font-semibold text-brand-ink transition-colors hover:border-brand-mint hover:bg-brand-mint"
        >
          {user ? "Go to workspace" : "Launch Workspace"}
          <ArrowRight className="h-4 w-4" />
        </Link>
        {user ? null : (
          <p className="mt-5 font-mono text-[10px] uppercase tracking-widest text-ink-3">
            Free 14-day trial · No card required
          </p>
        )}
      </div>
    </section>
  );
}

function Footer() {
  const { user } = useSession();

  const cols = [
    {
      h: "Platform",
      links: [
        { l: "Platform", href: "#platform" },
        { l: "Workflow", href: "#workflow" },
        { l: "Architecture", href: "#architecture" },
        { l: "Pricing", href: "#pricing" },
      ],
    },
    {
      h: "Modules",
      links: [
        { l: "Inventory Control", href: "#platform" },
        { l: "Manufacturing", href: "#platform" },
        { l: "Quality Control", href: "#platform" },
        { l: "Traceability", href: "#platform" },
      ],
    },
    {
      h: "Access",
      links: user
        ? [
            { l: "Go to workspace", href: CLIENT_APP_LAUNCHER_PAGE },
            { l: "My account", href: CLIENT_APP_LAUNCHER_PAGE },
          ]
        : [
            { l: "Launch workspace", href: "/sign-in" },
            { l: "Sign in", href: "/sign-in" },
          ],
    },
  ];

  return (
    <footer className={`border-t ${hairline} bg-card`}>
      <div className={`${container} py-12`}>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center">
              <Logo variant="dark" lockup className="h-7 w-auto" />
            </Link>
            <p className="mt-4 max-w-xs text-[12.5px] leading-relaxed text-ink-2">
              Streamline Your Success with RONA. Inventory management, financial
              tracking, and employee management — built for organizations that
              demand precision.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.h}>
              <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink-3">
                {c.h}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((item) => (
                  <li key={item.l}>
                    <Link
                      href={item.href}
                      className="text-[12.5px] font-medium text-ink-2 hover:text-ink hover:underline hover:underline-offset-4 hover:decoration-ink"
                    >
                      {item.l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-tint-2 pt-6 sm:flex-row">
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-2">
            <span className="h-1.5 w-1.5 bg-ink" />
            All systems operational
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
            © {new Date().getFullYear()} Rona · Enterprise Business Management Platform
          </span>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-card">
      <Navbar />
      <main>
        <Hero />
        <StatsStrip />
        <ArchitectureSection />
        <WorkflowSection />
        <ModulesSection />
        <CtaSlab />
      </main>
      <Footer />
    </div>
  );
}
