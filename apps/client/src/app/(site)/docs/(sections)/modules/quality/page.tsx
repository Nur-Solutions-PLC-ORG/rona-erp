import { AlertTriangle, CheckCircle2, Lock } from "lucide-react";
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
  StatusFlow,
  Steps,
} from "../../ui";

export const metadata = {
  title: "Quality",
  description:
    "Inspections, quarantine control, pass/fail gates, and lot release workflows.",
};

const statuses = [
  {
    icon: Lock,
    name: "QUARANTINED",
    tone: "warn" as const,
    body: "New lots start in quarantine. They cannot be used for production or shipment until inspected and approved — the default state for all received stock.",
  },
  {
    icon: CheckCircle2,
    name: "APPROVED",
    tone: "ok" as const,
    body: "Lots that pass inspection are approved and released from quarantine. They can be used for production and shipment — the active state for quality-controlled inventory.",
  },
  {
    icon: AlertTriangle,
    name: "REJECTED",
    tone: "warn" as const,
    body: "Lots that fail inspection are rejected. They cannot be used for production or shipment and should be returned to the supplier or destroyed. Rejected lots are locked to prevent accidental use.",
  },
];

export default function QualityPage() {
  return (
    <article>
      <DocHeader
        eyebrow="Core Modules / 04"
        title="Quality Assurance"
        lede="The Quality module enforces product standards through inspections, quarantine control, and lot release workflows. It acts as a gate that controls lot movement — preventing non-conforming materials from entering production or reaching customers."
        tags={["QA GATES", "QUARANTINE", "PASS RATE"]}
      />

      <Section title="Key features">
        <Card shadow>
          <CheckList
            items={[
              "Quality inspections with pass/fail gates",
              "Quarantine control for new lots",
              "Lot release and rejection workflows",
              "Inspection templates and checklists",
              "Pass rate tracking and analytics",
              "Integration with lot tracing for quality issues",
            ]}
            columns={2}
          />
        </Card>
      </Section>

      <Section title="Quality status">
        <P>
          Every lot has a quality status that determines whether it can be used
          in production or shipped to customers.
        </P>
        <div className="grid grid-cols-1 gap-4">
          {statuses.map((status) => (
            <Card key={status.name} tone={status.tone}>
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center border border-[#1d3536] bg-white">
                  <status.icon
                    className="h-4 w-4 text-[#1d3536]"
                    strokeWidth={1.5}
                  />
                </span>
                <Pill label={status.name} />
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-[#386163]">
                {status.body}
              </p>
            </Card>
          ))}
        </div>
        <StatusFlow steps={["QUARANTINED", "APPROVED", "REJECTED"]} />
      </Section>

      <Section title="Quality inspections">
        <P>
          Inspections are the formal process of evaluating lot quality — checks
          that must pass for the lot to be approved.
        </P>
        <FieldTable
          label="Inspection components"
          rows={[
            { field: "Lot", description: "Which lot is being inspected" },
            {
              field: "Inspection type",
              description: "Receiving, in-process, or final",
            },
            {
              field: "Checks",
              description: "Specific quality criteria to evaluate",
            },
            { field: "Results", description: "Pass/fail for each check" },
            { field: "Inspector", description: "Who performed the inspection" },
            {
              field: "Timestamp",
              description: "When the inspection was performed",
            },
          ]}
        />
        <FieldTable
          label="Common checks"
          rows={[
            {
              field: "Appearance",
              description: "Visual inspection for defects, color, texture",
            },
            {
              field: "Weight",
              description: "Verify weight meets specifications",
            },
            { field: "Dimensions", description: "Measure size and tolerances" },
            {
              field: "Purity",
              description: "Test for contaminants or adulteration",
            },
            {
              field: "Packaging",
              description: "Check packaging integrity and labeling",
            },
            {
              field: "Temperature",
              description: "Verify storage temperature requirements",
            },
            {
              field: "Moisture content",
              description: "Test for moisture levels",
            },
          ]}
        />
      </Section>

      <Section title="Inspection workflow">
        <Steps
          items={[
            {
              title: "Create inspection",
              body: "Select the quarantined lot and the inspection type.",
            },
            {
              title: "Define checks",
              body: "Specify the quality criteria to evaluate.",
            },
            {
              title: "Perform inspection",
              body: "Execute the checks and record the results.",
            },
            {
              title: "Make the decision",
              body: "Approve or reject based on results.",
            },
            {
              title: "Update lot status",
              body: "Lot status changes to APPROVED or REJECTED.",
            },
            {
              title: "Record the outcome",
              body: "The inspection is logged in the audit trail.",
            },
          ]}
        />
      </Section>

      <Section title="Quarantine control">
        <P>
          Quarantine is a critical control that prevents non-conforming
          materials from entering your operation — enforced at the database
          level through lot status checks.
        </P>
        <FieldTable
          label="Enforcement"
          rows={[
            {
              field: "Stock receipt",
              description: "New lots automatically go to QUARANTINED",
            },
            {
              field: "Production",
              description: "Cannot consume quarantined lots",
            },
            { field: "Shipment", description: "Cannot ship quarantined lots" },
            {
              field: "Reservation",
              description: "Cannot reserve quarantined lots",
            },
            {
              field: "Transfer",
              description: "Cannot transfer quarantined lots",
            },
          ]}
        />
      </Section>

      <Section title="Pass rate tracking">
        <FieldTable
          label="Pass rate metrics"
          rows={[
            {
              field: "Overall pass rate",
              description: "Total passed ÷ total inspections",
            },
            {
              field: "Supplier pass rate",
              description: "Pass rate per supplier",
            },
            { field: "Item pass rate", description: "Pass rate per item type" },
            {
              field: "Inspector pass rate",
              description: "Pass rate by inspector",
            },
            { field: "Trend analysis", description: "Pass rate over time" },
          ]}
        />
      </Section>

      <Section title="Rejection handling">
        <FieldTable
          label="Rejection workflow"
          rows={[
            {
              field: "Document reason",
              description: "Record why the lot failed",
            },
            {
              field: "Notify supplier",
              description: "Alert the supplier to the quality issue",
            },
            {
              field: "Return or destroy",
              description: "Process the rejected lot appropriately",
            },
            {
              field: "Track recurrence",
              description: "Monitor for repeat issues",
            },
            {
              field: "Adjust specifications",
              description: "If standards are unrealistic",
            },
          ]}
        />
      </Section>

      <Section title="Integration with traceability">
        <P>
          Quality inspections are recorded in the audit trail and linked to lots
          — trace a quality problem back to specific lots, suppliers, and
          production runs.
        </P>
        <FieldTable
          label="Quality traceability"
          rows={[
            {
              field: "Forward trace",
              description: "Find all products made from a rejected lot",
            },
            {
              field: "Reverse trace",
              description: "Find which supplier provided a problematic lot",
            },
            {
              field: "Impact analysis",
              description: "Assess the scope of a quality issue",
            },
            {
              field: "Recall management",
              description: "Execute targeted recalls if needed",
            },
          ]}
        />
      </Section>

      <Section title="Best practices">
        <Card tone="info">
          <CheckList
            items={[
              "Inspect all incoming lots before use",
              "Use standardized inspection checklists",
              "Train inspectors on quality standards",
              "Monitor pass rates for supplier performance",
              "Document all quality decisions thoroughly",
              "Review rejected lots for root cause analysis",
              "Keep quarantine areas physically separated",
            ]}
          />
        </Card>
      </Section>

      <NextSteps
        title="Explore traceability"
        body="Complete lot genealogy — forward and reverse tracing across every production hop, with recall planning built in."
        links={[
          {
            label: "Traceability module",
            href: "/docs/modules/traceability",
            primary: true,
          },
        ]}
      />
      <Pager
        prev={{ label: "Manufacturing", href: "/docs/modules/manufacturing" }}
        next={{ label: "Traceability", href: "/docs/modules/traceability" }}
      />
    </article>
  );
}
