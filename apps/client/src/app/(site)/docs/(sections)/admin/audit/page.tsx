import { AlertTriangle } from "lucide-react";
import {
  Callout,
  Card,
  CheckList,
  CodeBlock,
  DocHeader,
  FieldTable,
  NextSteps,
  P,
  Pager,
  Section,
} from "../../ui";

export const metadata = {
  title: "Audit Logs",
  description:
    "A complete, immutable record of every state change in Rona ERP.",
};

export default function AuditPage() {
  return (
    <article>
      <DocHeader
        eyebrow="Admin & Permissions / 04"
        title="Audit Logs"
        lede="A complete, immutable record of every state change in Rona ERP — who did what, when, and what changed. Essential for compliance, debugging, and security monitoring."
        tags={["IMMUTABLE", "ACTOR + DIFF", "COMPLIANCE"]}
      />

      <Section title="Why audit logs matter">
        <Card shadow>
          <CheckList
            items={[
              "Compliance requirements (FDA, ISO, food safety)",
              "Security monitoring and incident investigation",
              "Debugging and troubleshooting",
              "Accountability and transparency",
              "Change history for data recovery",
              "Performance analysis and optimization",
            ]}
            columns={2}
          />
        </Card>
      </Section>

      <Section title="What gets logged">
        <FieldTable
          label="Logged events by module"
          rows={[
            {
              field: "Inventory",
              description: "Stock movements, lot creation, item changes",
            },
            {
              field: "Manufacturing",
              description:
                "Order lifecycle, batch execution, material consumption",
            },
            {
              field: "Quality",
              description:
                "Inspections, lot status changes, quarantine actions",
            },
            {
              field: "Sales",
              description: "Order creation, fulfillment, invoice generation",
            },
            {
              field: "Finance",
              description: "Payments, cost recording, invoice status changes",
            },
            {
              field: "Workforce",
              description: "Attendance, employee changes, shift assignments",
            },
            {
              field: "Admin",
              description: "User creation, role changes, setting modifications",
            },
          ]}
        />
      </Section>

      <Section title="Log entry structure">
        <FieldTable
          label="Entry components"
          rows={[
            { field: "Timestamp", description: "When the event occurred" },
            {
              field: "Actor",
              description: "Who performed the action (user or system)",
            },
            {
              field: "Action",
              description: "What was done (create, update, delete, etc.)",
            },
            {
              field: "Entity",
              description: "What was affected (item, order, lot, etc.)",
            },
            {
              field: "Entity ID",
              description: "Unique identifier of the affected record",
            },
            { field: "Changes", description: "Before and after values (diff)" },
            {
              field: "Reference",
              description: "Related entity (e.g., the order for a movement)",
            },
            { field: "IP address", description: "Where the action originated" },
          ]}
        />
        <CodeBlock
          label="Example entry"
          code={`Timestamp:   2026-01-15 14:32:15 UTC
Actor:       john.doe@company.com
Action:      UPDATE
Entity:      inventory.item
Entity ID:   item-123
Changes:
  reorderPoint:     50  → 100
  reorderQuantity:  200 → 500
IP Address: 192.168.1.100`}
        />
      </Section>

      <Section title="Searching audit logs">
        <FieldTable
          label="Search filters"
          rows={[
            { field: "Date range", description: "Filter by time period" },
            { field: "Actor", description: "Filter by a specific user" },
            {
              field: "Action",
              description: "Filter by action type (create, update, delete)",
            },
            {
              field: "Entity",
              description: "Filter by entity type (item, order, lot, etc.)",
            },
            {
              field: "Entity ID",
              description: "Filter by a specific record ID",
            },
            {
              field: "Module",
              description: "Filter by module (inventory, manufacturing, etc.)",
            },
          ]}
        />
      </Section>

      <Section title="Change diffs">
        <P>
          For update actions, the audit log captures before and after values —
          exactly what changed, helping with debugging and rollback decisions.
        </P>
        <CodeBlock
          label="Diff format"
          code={`status:           DRAFT     → CONFIRMED
plannedQuantity:  100      → 150
expectedYield:    0.95     → 0.90`}
        />
      </Section>

      <Section title="Immutability">
        <Card tone="warn">
          <CheckList
            items={[
              "Prevents tampering with evidence",
              "Ensures compliance with regulatory requirements",
              "Maintains trust in the audit trail",
              "Provides a reliable historical record",
            ]}
          />
        </Card>
        <P>Once written, audit log entries cannot be modified or deleted.</P>
      </Section>

      <Section title="Retention policy">
        <FieldTable
          label="Retention options"
          rows={[
            {
              field: "30 days",
              description: "Minimum retention for basic operations",
            },
            {
              field: "90 days",
              description: "Standard retention for most organizations",
            },
            {
              field: "1 year",
              description: "Extended retention for compliance",
            },
            {
              field: "7 years",
              description: "Long-term retention for regulated industries",
            },
          ]}
        />
      </Section>

      <Section title="Export and reporting">
        <FieldTable
          label="Export formats"
          rows={[
            { field: "CSV", description: "Spreadsheet-compatible format" },
            {
              field: "JSON",
              description: "Machine-readable format for integration",
            },
            { field: "PDF", description: "Human-readable report format" },
          ]}
        />
      </Section>

      <Section title="Security monitoring">
        <FieldTable
          label="Security use cases"
          rows={[
            {
              field: "Unauthorized access",
              description: "Detect logins from unusual locations",
            },
            {
              field: "Privilege escalation",
              description: "Monitor role changes",
            },
            {
              field: "Data exfiltration",
              description: "Track large data exports",
            },
            {
              field: "Configuration changes",
              description: "Monitor setting modifications",
            },
            {
              field: "Failed actions",
              description: "Track repeated failed attempts",
            },
          ]}
        />
        <Callout
          tone="warn"
          title="Security alert example"
          icon={AlertTriangle}
        >
          Multiple failed login attempts from an unknown IP address can indicate
          a brute force attack. The security team should investigate and
          potentially block the IP.
        </Callout>
      </Section>

      <Section title="Compliance">
        <FieldTable
          label="Compliance requirements"
          rows={[
            {
              field: "Food safety (FDA)",
              description: "Complete traceability and change history",
            },
            {
              field: "ISO 9001",
              description: "Quality management system documentation",
            },
            {
              field: "SOX",
              description: "Financial controls and audit trails",
            },
            {
              field: "GDPR",
              description: "Data processing records and consent tracking",
            },
            {
              field: "HIPAA",
              description: "Protected health information access logs",
            },
          ]}
        />
      </Section>

      <NextSteps
        title="Explore Rona AI"
        body="Ask the assistant to summarize audit activity, surface anomalies, and generate compliance reports."
        links={[
          {
            label: "Rona AI overview",
            href: "/docs/ai/overview",
            primary: true,
          },
        ]}
      />
      <Pager
        prev={{ label: "Organization", href: "/docs/admin/organization" }}
        next={{ label: "AI Overview", href: "/docs/ai/overview" }}
      />
    </article>
  );
}
