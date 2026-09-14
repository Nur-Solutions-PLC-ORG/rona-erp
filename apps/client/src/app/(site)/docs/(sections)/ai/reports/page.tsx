import { FileJson, FileSpreadsheet, FileText } from "lucide-react";
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
  Steps,
} from "../../ui";

export const metadata = {
  title: "AI Reports",
  description:
    "Generate and schedule comprehensive reports in PDF, Excel, or JSON.",
};

const formats = [
  {
    icon: FileText,
    name: "PDF",
    body: "Print-ready document format. Ideal for sharing with stakeholders, printing, or archiving — includes charts, tables, and formatted text.",
    points: [
      "Professional formatting",
      "Charts and visualizations",
      "Table of contents",
      "Page numbers and headers",
    ],
  },
  {
    icon: FileSpreadsheet,
    name: "Excel",
    body: "Spreadsheet workbook format. Ideal for data analysis, pivot tables, and further processing — raw data in structured tables.",
    points: [
      "Raw data tables",
      "Multiple sheets",
      "Formatted numbers and dates",
      "Excel and Google Sheets compatible",
    ],
  },
  {
    icon: FileJson,
    name: "JSON",
    body: "Machine-readable format. Ideal for integrations, API consumption, and custom processing — structured data with metadata.",
    points: [
      "Structured data",
      "Metadata and timestamps",
      "API-ready format",
      "Easy to parse programmatically",
    ],
  },
];

export default function AiReportsPage() {
  return (
    <article>
      <DocHeader
        eyebrow="Rona AI / 03"
        title="Report Generation"
        lede="Rona AI generates comprehensive reports across any module — on demand or scheduled for automatic delivery, in PDF, Excel, or JSON."
        tags={["PDF", "EXCEL", "JSON", "SCHEDULED"]}
      />

      <Section title="Report types">
        <Card shadow>
          <FieldTable
            label="Available reports"
            rows={[
              {
                field: "Management summary",
                description: "Cross-module overview with key metrics",
              },
              {
                field: "Attendance",
                description: "Presence, lateness, and overtime analysis",
              },
              {
                field: "Production",
                description: "Output, efficiency, and downtime tracking",
              },
              {
                field: "Inventory valuation",
                description: "Stock on hand and total value",
              },
              {
                field: "Quality",
                description: "Inspections and pass rate analysis",
              },
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
        </Card>
      </Section>

      <Section title="Generating a report">
        <Steps
          items={[
            { title: "Open the AI assistant panel" },
            { title: "Select Report Generation from the menu" },
            { title: "Choose the report type" },
            { title: "Select the time period" },
            { title: "Choose the export format" },
            { title: "Generate — typically ready in a few seconds" },
          ]}
        />
      </Section>

      <Section title="Formats">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {formats.map((f) => (
            <Card key={f.name}>
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center border border-[#581c87] bg-[#f3eefb]">
                  <f.icon
                    className="h-4 w-4 text-[#581c87]"
                    strokeWidth={1.5}
                  />
                </span>
                <h3 className="font-mono text-[13px] font-bold text-[#581c87]">
                  {f.name}
                </h3>
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-[#5c4d77]">
                {f.body}
              </p>
              <div className="mt-4 border-t border-[#e9e2f2] pt-3">
                <CheckList items={f.points} />
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Time periods">
        <FieldTable
          label="Predefined periods"
          rows={[
            { field: "Today", description: "Current day's data" },
            { field: "This week", description: "Monday to the current day" },
            { field: "This month", description: "Current calendar month" },
            {
              field: "Last week",
              description: "Previous week, Monday to Sunday",
            },
            { field: "Last month", description: "Previous calendar month" },
            { field: "This quarter", description: "Current fiscal quarter" },
            { field: "This year", description: "Current calendar year" },
          ]}
        />
        <P>
          For specific needs, define a custom range — start and end dates for
          any period.
        </P>
      </Section>

      <Section title="Report contents">
        <FieldTable
          label="What each report includes"
          rows={[
            {
              field: "Management summary",
              description:
                "Stock value, production output, pass rates, revenue, profit, receivables",
            },
            {
              field: "Attendance",
              description:
                "Present/absent by employee, lateness, overtime, department breakdown",
            },
            {
              field: "Production",
              description:
                "Output by product, yields, scrap, downtime, order completion",
            },
            {
              field: "Inventory valuation",
              description:
                "Stock on hand by item, total value, value by warehouse, expiry risk",
            },
            {
              field: "Quality",
              description:
                "Overall pass rate, by item, by supplier, failed inspections, quarantined lots",
            },
            {
              field: "Sales",
              description:
                "Total revenue, order count, top products, sales by customer, commissions",
            },
            {
              field: "Finance",
              description:
                "Total profit, receivables, overdue invoices, costs, VAT summary",
            },
          ]}
        />
      </Section>

      <Section title="Report status">
        <P>
          Report generation is asynchronous — check status while it processes:
        </P>
        <div className="flex flex-wrap gap-3">
          <Pill label="PENDING" />
          <Pill label="PROCESSING" />
          <Pill label="READY" />
          <Pill label="FAILED" />
        </div>
      </Section>

      <Section title="Scheduled reports">
        <FieldTable
          label="Scheduling options"
          rows={[
            {
              field: "Daily",
              description: "Generate every day at a specified time",
            },
            {
              field: "Weekly",
              description: "Generate every week on a specified day",
            },
            {
              field: "Monthly",
              description: "Generate every month on a specified date",
            },
            {
              field: "Recipients",
              description: "Email the report to multiple recipients",
            },
            { field: "Format", description: "Choose the format per recipient" },
          ]}
        />
      </Section>

      <Section title="Best practices">
        <Card tone="info">
          <CheckList
            items={[
              "Use PDF for sharing with executives or stakeholders",
              "Use Excel for data analysis and pivot tables",
              "Use JSON for integrations and API consumption",
              "Schedule regular reports for consistent monitoring",
              "Review reports weekly for trend analysis",
              "Archive reports for historical comparison",
            ]}
          />
        </Card>
      </Section>

      <NextSteps
        title="AI lot tracing"
        body="Five-hop genealogy on demand — the fastest way to investigate quality issues and scope recalls."
        links={[
          { label: "AI lot tracing", href: "/docs/ai/tracing", primary: true },
        ]}
      />
      <Pager
        prev={{ label: "Queries", href: "/docs/ai/queries" }}
        next={{ label: "Tracing", href: "/docs/ai/tracing" }}
      />
    </article>
  );
}
