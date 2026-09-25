import {
  Boxes,
  Building2,
  ClipboardCheck,
  Cog,
  Fingerprint,
  ScanSearch,
} from "lucide-react";
import {
  Card,
  CheckList,
  DocHeader,
  FieldTable,
  H3,
  NextSteps,
  P,
  Pager,
  Section,
  Tags,
} from "../../ui";

export const metadata = {
  title: "Introduction",
  description:
    "What Rona ERP is, the core concepts behind it, and a tour of every module.",
};

const capabilities = [
  "Track inventory across multiple warehouses with lot-level precision",
  "Manage production orders with BOMs, batches, and yield tracking",
  "Run quality inspections with quarantine control and pass/fail gates",
  "Trace any lot from inbound receipt through production to outbound shipment",
  "Handle sales orders, invoices, and payments with automatic allocation",
  "Manage workforce attendance, shifts, departments, and positions",
  "Use Rona AI to trace lots, generate reports, and flag anomalies",
];

const modules = [
  {
    abbr: "INV",
    name: "Inventory",
    desc: "Items, warehouses, lots, stock balances, movements, and reservations",
  },
  {
    abbr: "MFG",
    name: "Manufacturing",
    desc: "BOMs, production orders, batches, material consumption, and yield",
  },
  {
    abbr: "QAS",
    name: "Quality",
    desc: "Inspections, quarantine control, pass/fail gates, and lot release",
  },
  {
    abbr: "TRC",
    name: "Traceability",
    desc: "Forward and reverse lot tracing across production hops",
  },
  {
    abbr: "SLS",
    name: "Sales",
    desc: "Customers, sales orders, availability checks, and commissions",
  },
  {
    abbr: "FIN",
    name: "Finance",
    desc: "Invoices, payments, cost centers, and COGS tracking",
  },
  {
    abbr: "WFP",
    name: "Workforce",
    desc: "Employees, attendance, shifts, departments, and positions",
  },
  {
    abbr: "ORG",
    name: "Organization",
    desc: "Users, roles, permissions, and audit logs",
  },
];

const concepts = [
  {
    icon: Fingerprint,
    title: "Lots and lot tracing",
    body: "Every item in your inventory is tracked by lot number. A lot represents a group of items produced together, received from the same supplier, or sharing an expiry date. Lot tracing lets you trace any product backward through production to its raw material suppliers, or forward to every customer who received products from that lot.",
    tags: ["GENEALOGY", "RECALLS", "COMPLIANCE"],
  },
  {
    icon: Boxes,
    title: "Stock reservations",
    body: "When you create a sales order or production order, the system reserves stock to guarantee availability. Reservations use FIFO (First In, First Out) allocation — the oldest lots are consumed first — preventing expiry issues and ensuring fair stock distribution.",
    tags: ["FIFO", "ZERO CONFLICTS"],
  },
  {
    icon: Cog,
    title: "Production batches",
    body: "Production orders execute in multiple batches. Each batch tracks material consumption, output quantity, scrap, and yield — giving you detailed visibility into production efficiency and letting you trace finished goods back to specific production runs.",
    tags: ["YIELD", "SCRAP", "VARIANCE"],
  },
  {
    icon: ClipboardCheck,
    title: "Quality gates",
    body: "Quality inspections act as gates that control lot movement. Failed lots stay locked in quarantine and cannot be used for production or shipment. Approved lots are released for use. Quality standards are enforced system-wide, not by convention.",
    tags: ["QA GATES", "QUARANTINE"],
  },
  {
    icon: ScanSearch,
    title: "Audit logging",
    body: "Every state change is recorded with timestamp, actor, and before/after diff. You can always see who changed what, when, and what the previous value was — complete traceability for compliance and debugging.",
    tags: ["IMMUTABLE", "ACTOR + DIFF"],
  },
];

export default function IntroductionPage() {
  return (
    <article>
      <DocHeader
        eyebrow="Getting Started / 01"
        title="Introduction to Rona ERP"
        lede="Rona ERP is a comprehensive enterprise resource planning system for operations that cannot afford blind spots. It unifies inventory, manufacturing, quality, traceability, sales, finance, and workforce in a single, precise platform — with real-time lot tracing and AI-powered analytics built in."
        tags={["8 MODULES", "LOT-LEVEL", "RLS", "RONA AI"]}
      />

      <Section title="What you can do with Rona ERP">
        <Card shadow>
          <CheckList items={capabilities} columns={2} />
        </Card>
      </Section>

      <Section title="Core concepts">
        <div className="grid grid-cols-1 gap-4">
          {concepts.map((concept) => (
            <Card key={concept.title}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-8 w-8 items-center justify-center border ${"border-[#1d3536]"} bg-[#e8f3f2]`}
                  >
                    <concept.icon
                      className="h-4 w-4 text-[#1d3536]"
                      strokeWidth={1.5}
                    />
                  </span>
                  <H3>{concept.title}</H3>
                </div>
                <Tags items={concept.tags} />
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-[#386163]">
                {concept.body}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Module overview">
        <P>
          Eight operational modules share a single data core. Every record is
          cross-linked and every change is audited — no third-party glue holding
          your operation together.
        </P>
        <div className="grid grid-cols-1 gap-px border border-[#1d3536] bg-[#1d3536] sm:grid-cols-2">
          {modules.map((m) => (
            <div key={m.abbr} className="group bg-white p-5 hover:bg-[#f2f3fa]">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-lg font-bold text-[#1d3536]">
                  {m.abbr}
                </span>
                <Building2
                  className="h-4 w-4 text-[#518985] group-hover:text-[#1d3536]"
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="mt-2 text-[13.5px] font-semibold text-[#1d3536]">
                {m.name}
              </h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#386163]">
                {m.desc}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="The operating flow at a glance">
        <FieldTable
          label="Dock to finished goods"
          rows={[
            {
              field: "Receive",
              description:
                "Register inbound lots with supplier, quantity, and expiry — quarantined until inspected.",
            },
            {
              field: "Inspect",
              description:
                "Run quality inspections with pass/fail gates. Failed lots stay locked in quarantine.",
            },
            {
              field: "Reserve",
              description:
                "Reserve stock for production orders with zero-latency conflict resolution.",
            },
            {
              field: "Produce",
              description:
                "Consume reserved materials against BOMs and output finished lots with full genealogy.",
            },
            {
              field: "Ship & invoice",
              description:
                "Fulfill sales orders, generate invoices, and record payments with automatic allocation.",
            },
          ]}
        />
      </Section>

      <NextSteps
        title="Set up your workspace"
        body="Create your organization, configure warehouses, define units of measure, and invite your team — the fastest path to your first production run."
        links={[
          {
            label: "Setup guide",
            href: "/docs/getting-started/setup",
            primary: true,
          },
          { label: "First steps", href: "/docs/getting-started/first-steps" },
        ]}
      />
      <Pager
        prev={undefined}
        next={{ label: "Setup", href: "/docs/getting-started/setup" }}
      />
    </article>
  );
}
