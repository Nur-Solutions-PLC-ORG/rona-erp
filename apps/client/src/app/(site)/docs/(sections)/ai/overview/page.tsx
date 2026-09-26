import {
  Brain,
  FileText,
  MessageSquare,
  ScanSearch,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CheckList,
  DocHeader,
  Exchange,
  FieldTable,
  NextSteps,
  P,
  Pager,
  QuoteList,
  Section,
  Tags,
} from "../../ui";

export const metadata = {
  title: "Rona AI Overview",
  description:
    "The built-in operations analyst — what it does and how it works.",
};

export default function AiOverviewPage() {
  return (
    <article>
      <DocHeader
        eyebrow="Rona AI / 01"
        title="Rona AI Overview"
        lede="An intelligent operations assistant built into every module of Rona ERP. Natural-language access to your data — trace lots, generate reports, flag anomalies, and get insights without writing complex queries or navigating multiple screens."
        tags={["NATURAL LANGUAGE", "LIVE DATA", "NO SETUP"]}
      />

      <Section title="What makes Rona AI different">
        <Card shadow>
          <CheckList
            items={[
              "Reads your live data, not generic training data",
              "Understands your specific schema from day one",
              "No setup required — works immediately",
              "Context-aware across all modules",
              "Natural language interface — no SQL needed",
              "Real-time insights and anomaly detection",
            ]}
            columns={2}
          />
        </Card>
      </Section>

      <Section title="Core capabilities">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            {
              icon: ScanSearch,
              title: "Lot tracing",
              body: "Trace any lot across production hops with natural language. Ask \u201cTrace lot LOT-2026-001\u201d and get complete genealogy from receipt to shipment.",
              tags: ["5-HOP", "GENEALOGY"],
            },
            {
              icon: FileText,
              title: "Report generation",
              body: "Generate comprehensive reports across any module. Ask \u201cSummarize last month\u2019s production cost\u201d and get a detailed breakdown.",
              tags: ["PDF", "EXCEL", "JSON"],
            },
            {
              icon: Brain,
              title: "Anomaly detection",
              body: "Flag anomalies before they become write-offs — unusual patterns in yield, scrap, inventory levels, and quality issues.",
              tags: ["YIELD", "SCRAP", "STOCK"],
            },
            {
              icon: MessageSquare,
              title: "Natural language queries",
              body: "Ask questions in plain English and get instant answers. No query languages to learn, no complex screens to navigate.",
              tags: ["PLAIN ENGLISH", "INSTANT"],
            },
          ].map((cap) => (
            <Card key={cap.title}>
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center border border-ink bg-tint">
                  <cap.icon
                    className="h-4 w-4 text-ink"
                    strokeWidth={1.5}
                  />
                </span>
                <h3 className="text-[14px] font-semibold text-ink">
                  {cap.title}
                </h3>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-ink-2">
                {cap.body}
              </p>
              <div className="mt-4">
                <Tags items={cap.tags} />
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="How Rona AI works">
        <P>
          Rona AI is integrated directly into your ERP database. It understands
          your schema, relationships, and business logic from day one.
        </P>
        <FieldTable
          label="AI architecture"
          rows={[
            {
              field: "Schema understanding",
              description: "AI learns your database structure automatically",
            },
            {
              field: "Context awareness",
              description: "Understands relationships between modules",
            },
            {
              field: "Query generation",
              description: "Converts natural language to optimized queries",
            },
            {
              field: "Response formatting",
              description: "Presents results in human-readable form",
            },
            {
              field: "Module integration",
              description:
                "Works across inventory, manufacturing, quality, sales, finance",
            },
          ]}
        />
      </Section>

      <Section title="Access points">
        <FieldTable
          label="Where to find it"
          rows={[
            {
              field: "Dashboard",
              description: "Main AI assistant panel with quick insights",
            },
            {
              field: "Inventory",
              description: "Stock queries, lot tracing, low stock alerts",
            },
            {
              field: "Manufacturing",
              description: "Production analysis, yield tracking",
            },
            {
              field: "Quality",
              description: "Inspection analysis, quality trends",
            },
            {
              field: "Sales",
              description: "Order analysis, customer insights",
            },
            {
              field: "Finance",
              description: "Financial summaries, cost analysis",
            },
          ]}
        />
      </Section>

      <Section title="Example queries">
        <Card shadow>
          <div className="flex items-center gap-2.5 border-b border-ink pb-3">
            <Sparkles className="h-4 w-4 text-ink" strokeWidth={1.5} />
            <h3 className="text-[14px] font-semibold text-ink">
              Ask anything about your operation
            </h3>
          </div>
          <div className="mt-4 space-y-3">
            <Exchange
              prompt="Trace lot LOT-2026-001 across production"
              response="5 hops. Received 500 KG Ethio Grain → QA approved → 50 KG consumed PO-BREAD-044 → FG-LOT-2026-001 · 95% yield."
            />
            <Exchange
              prompt="Which items are below reorder point?"
              response="2 items. VC-012 Vanilla Cake (12 < 20), DR-045 Dinner Rolls (0 < 40). Draft POs ready for approval."
            />
            <Exchange
              prompt="Summarize last month's production cost"
              response="ETB 412,800 total · +4.2% vs prior. Flour drove 61% of variance. Report generated."
            />
          </div>
        </Card>
      </Section>

      <Section title="Report generation">
        <FieldTable
          label="Report types"
          rows={[
            {
              field: "Management summary",
              description: "Cross-module overview with key metrics",
            },
            {
              field: "Attendance",
              description: "Presence, lateness, and overtime",
            },
            {
              field: "Production",
              description: "Output, efficiency, and downtime",
            },
            {
              field: "Inventory valuation",
              description: "Stock on hand and total value",
            },
            { field: "Quality", description: "Inspections and pass rate" },
            {
              field: "Sales",
              description: "Orders, revenue, and top products",
            },
            {
              field: "Finance",
              description: "Profit, receivables, and invoices",
            },
          ]}
        />
        <P>
          Reports can be scheduled for automatic delivery or generated on demand
          — as PDF, Excel, or JSON.
        </P>
      </Section>

      <Section title="Anomaly detection">
        <FieldTable
          label="Anomaly types"
          rows={[
            {
              field: "Yield drops",
              description: "Production yield below expected",
            },
            { field: "High scrap", description: "Unusual scrap levels" },
            {
              field: "Stock discrepancies",
              description: "Physical count vs system",
            },
            {
              field: "Quality failures",
              description: "Increased inspection failures",
            },
            {
              field: "Payment delays",
              description: "Unusual payment patterns",
            },
            {
              field: "Attendance issues",
              description: "Unusual absence patterns",
            },
          ]}
        />
      </Section>

      <Section title="Privacy and security">
        <Card tone="ok">
          <FieldTable
            label="Security guarantees"
            rows={[
              {
                field: "Tenant isolation",
                description: "AI only accesses your organization's data",
              },
              {
                field: "Permission respect",
                description: "AI respects user permissions",
              },
              {
                field: "No data export",
                description: "Your data stays in your environment",
              },
              {
                field: "Audit logging",
                description: "All AI queries are logged",
              },
              {
                field: "Row-level security",
                description: "Database-level enforcement",
              },
            ]}
          />
        </Card>
      </Section>

      <Section title="Query cheat sheet">
        <QuoteList
          items={[
            '"Which lots are expiring this month?"',
            '"What\'s the total stock value?"',
            '"Summarize last week\'s production"',
            '"Which invoices are overdue?"',
            '"Who was late this week?"',
          ]}
        />
      </Section>

      <NextSteps
        title="Natural language queries"
        body="Query patterns, follow-ups, and cross-module examples that get answers faster."
        links={[
          { label: "AI queries", href: "/docs/ai/queries", primary: true },
        ]}
      />
      <Pager
        prev={{ label: "Audit Logs", href: "/docs/admin/audit" }}
        next={{ label: "Queries", href: "/docs/ai/queries" }}
      />
    </article>
  );
}
