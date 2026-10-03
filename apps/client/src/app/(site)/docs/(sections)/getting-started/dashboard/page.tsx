import {
  Factory,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import {
  Card,
  CheckList,
  DocHeader,
  FieldTable,
  NextSteps,
  P,
  Pager,
  Pill,
  Section,
  Tags,
} from "../../ui";

export const metadata = {
  title: "Dashboard",
  description:
    "Key metrics, real-time alerts, the audit stream, and the Rona AI assistant.",
};

const modules = [
  {
    icon: LayoutDashboard,
    name: "Dashboard",
    desc: "Overview and key metrics",
  },
  { icon: Package, name: "Inventory", desc: "Items, stock, lots, movements" },
  {
    icon: Factory,
    name: "Manufacturing",
    desc: "BOMs, production orders, batches",
  },
  { icon: Shield, name: "Quality", desc: "Inspections and quarantine" },
  { icon: FileText, name: "Traceability", desc: "Lot tracing and genealogy" },
  { icon: Users, name: "Sales", desc: "Customers, orders, commissions" },
  { icon: Settings, name: "Finance", desc: "Invoices, payments, costs" },
  { icon: Users, name: "Workforce", desc: "Employees, attendance, shifts" },
];

const alerts = [
  { type: "Low stock", desc: "Items below their reorder point", tone: "warn" },
  {
    type: "Quality gate",
    desc: "Lots pending inspection in quarantine",
    tone: "info",
  },
  { type: "Production", desc: "Orders running or delayed", tone: "info" },
  { type: "Expiry", desc: "Lots approaching their expiry date", tone: "warn" },
] as const;

export default function DashboardPage() {
  return (
    <article>
      <DocHeader
        eyebrow="Getting Started / 04"
        title="Understanding the dashboard"
        lede="The dashboard is your command center — real-time visibility into your entire operation with key metrics, alerts, and quick access to every module."
        tags={["KPI STRIP", "ALERTS", "AUDIT STREAM"]}
      />

      <Section title="The metrics strip">
        <P>
          At the top of the dashboard, key performance indicators update in real
          time:
        </P>
        <div className="grid grid-cols-2 gap-px border border-ink bg-ink lg:grid-cols-4">
          {[
            { k: "Stock value", v: "1.28M", d: "ETB on hand" },
            { k: "Open orders", v: "18", d: "production" },
            { k: "Pass rate", v: "98.4%", d: "inspections" },
            { k: "Avg latency", v: "8ms", d: "API p95" },
          ].map((s) => (
            <div key={s.k} className="bg-card px-4 py-4 hover:bg-background">
              <div className="font-mono text-[9px] uppercase tracking-widest text-ink-3">
                {s.k}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-semibold tabular-nums text-ink">
                  {s.v}
                </span>
                <span className="text-[10px] text-ink-3">{s.d}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Module navigation">
        <P>
          The left sidebar provides quick access to all modules — each with
          specialized tools and views.
        </P>
        <div className="grid grid-cols-1 gap-px border border-ink bg-ink sm:grid-cols-2">
          {modules.map((m) => (
            <div
              key={m.name}
              className="flex items-start gap-3 bg-card p-4 hover:bg-background"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-ink bg-tint">
                <m.icon className="h-4 w-4 text-ink" strokeWidth={1.5} />
              </span>
              <div>
                <h3 className="text-[13px] font-semibold text-ink">
                  {m.name}
                </h3>
                <p className="mt-0.5 text-[12px] text-ink-2">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Real-time alerts">
        <Card shadow>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.type} className="flex items-start gap-3">
                <Pill label={alert.type.toUpperCase().replace(" ", "_")} />
                <p className="text-[13px] text-ink-2">{alert.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </Section>

      <Section title="The audit stream">
        <P>
          Every state change is logged with timestamp, actor, and reference —
          the stream shows the latest events across your organization:
        </P>
        <div className="overflow-hidden border border-ink bg-card">
          {[
            { t: "14:02", ref: "mv-8f42", msg: "Stock moved MAIN → TRANSIT" },
            {
              t: "13:51",
              ref: "in-1c09",
              msg: "Inspection approved · QA gate",
            },
            { t: "12:44", ref: "rs-77e2", msg: "50 KG reserved PO-BREAD-044" },
          ].map((e) => (
            <div
              key={e.ref}
              className="flex items-center gap-3 border-b border-ink px-4 py-2.5 last:border-b-0 hover:bg-background"
            >
              <span className="font-mono text-[10px] text-ink-3">
                {e.t}
              </span>
              <span className="border border-ink bg-tint px-1 font-mono text-[10px] font-semibold text-ink">
                {e.ref}
              </span>
              <span className="text-[12px] text-ink-2">{e.msg}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Rona AI assistant">
        <Card tone="info" shadow>
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-ink bg-card">
              <Sparkles className="h-4 w-4 text-ink" strokeWidth={1.5} />
            </span>
            <div>
              <h3 className="text-[14px] font-semibold text-ink">
                Available from every module
              </h3>
              <div className="mt-3">
                <CheckList
                  items={[
                    "Trace lots across production hops",
                    "Generate natural-language reports",
                    "Flag anomalies before they become issues",
                    "Answer questions about your data",
                    "Summarize performance metrics",
                  ]}
                  columns={2}
                />
              </div>
            </div>
          </div>
        </Card>
      </Section>

      <Section title="Customization">
        <Card>
          <CheckList
            items={[
              "Pin frequently used modules to the top",
              "Configure which metrics display in the strip",
              "Set custom date ranges for data views",
              "Filter alerts by severity and type",
            ]}
          />
        </Card>
      </Section>

      <Section title="Keyboard and filters">
        <FieldTable
          label="Shortcuts"
          rows={[
            {
              field: "⌘K",
              description:
                "Open the command palette and jump to any module or record",
            },
            {
              field: "g then d",
              description: "Go to the dashboard from anywhere in the app",
            },
          ]}
        />
        <Tags items={["12 WIDGETS", "1s REFRESH", "LIVE"]} />
      </Section>

      <NextSteps
        title="Explore the modules"
        body="Each module has its own dedicated guide — start with inventory, the foundation of everything else."
        links={[
          {
            label: "Inventory module",
            href: "/docs/modules/inventory",
            primary: true,
          },
        ]}
      />
      <Pager
        prev={{
          label: "First Steps",
          href: "/docs/getting-started/first-steps",
        }}
        next={{ label: "Inventory", href: "/docs/modules/inventory" }}
      />
    </article>
  );
}
