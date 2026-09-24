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
  Pill,
  Section,
  StatusFlow,
  Steps,
} from "../../ui";

export const metadata = {
  title: "Manufacturing",
  description:
    "BOMs, production orders, batch execution, and yield tracking with full lot genealogy.",
};

export default function ManufacturingPage() {
  return (
    <article>
      <DocHeader
        eyebrow="Core Modules / 03"
        title="Manufacturing"
        lede="The Manufacturing module manages production from planning to execution — bills of materials, production orders, batch execution, material consumption, and yield tracking with complete lot genealogy."
        tags={["BOM", "BATCHES", "YIELD", "GENEALOGY"]}
      />

      <Section title="Key features">
        <Card shadow>
          <CheckList
            items={[
              "Bills of materials with version control",
              "Production order planning and scheduling",
              "Batch execution with material consumption tracking",
              "Yield calculation and variance analysis",
              "Material returns for unused components",
              "Complete lot genealogy from inputs to outputs",
              "Integration with inventory for reservations",
            ]}
            columns={2}
          />
        </Card>
      </Section>

      <Section title="Bills of materials">
        <P>
          A BOM defines what raw materials are needed to produce a finished good
          — components and quantities per unit of output.
        </P>
        <FieldTable
          label="BOM structure"
          rows={[
            {
              field: "Code",
              description: "Unique BOM identifier (e.g., BOM-BREAD-001)",
            },
            { field: "Finished good", description: "What you are producing" },
            {
              field: "Components",
              description: "Raw materials and quantities per unit",
            },
            {
              field: "Version",
              description: "Track BOM versions for change management",
            },
            { field: "Status", description: "DRAFT, ACTIVE, or RETIRED" },
          ]}
        />
        <CodeBlock
          label="Example — bread BOM"
          code={`Finished good:  Bread Loaf (1 EA)

Component 1:    Wheat Flour  0.5 KG    per loaf
Component 2:    Yeast        0.01 KG   per loaf
Component 3:    Water        0.3 L     per loaf
Component 4:    Salt         0.005 KG  per loaf`}
        />
        <StatusFlow steps={["DRAFT", "ACTIVE", "RETIRED"]} />
        <P>
          BOMs support versioning — each version can be approved, retired, or
          made active, so you always know exactly which BOM was used for any
          production run.
        </P>
      </Section>

      <Section title="Production orders">
        <FieldTable
          label="Order fields"
          rows={[
            { field: "Order number", description: "Auto-generated unique ID" },
            { field: "BOM", description: "Which BOM to use" },
            { field: "Finished good", description: "What you are producing" },
            { field: "Warehouse", description: "Where production happens" },
            {
              field: "Planned quantity",
              description: "How much you want to produce",
            },
            {
              field: "Expected yield",
              description: "Expected output percentage (accounts for waste)",
            },
            {
              field: "Expected quantity",
              description: "Planned × expected yield",
            },
            { field: "Planned dates", description: "Start and end dates" },
          ]}
        />
        <StatusFlow steps={["DRAFT", "APPROVED", "IN_PROGRESS", "COMPLETED"]} />
        <P>
          Cancelled orders release their reserved materials back to available
          stock.
        </P>
      </Section>

      <Section title="Production batches">
        <P>
          A production order can execute in multiple batches. Each batch tracks
          material consumption, output, scrap, and yield — detailed visibility
          into production efficiency.
        </P>
        <FieldTable
          label="Batch data"
          rows={[
            {
              field: "Batch number",
              description: "Auto-generated (e.g., BATCH-001)",
            },
            { field: "Status", description: "IN_PROGRESS or COMPLETED" },
            { field: "Output quantity", description: "How much was produced" },
            { field: "Scrap quantity", description: "How much was wasted" },
            { field: "Started / completed at", description: "Timestamps" },
          ]}
        />
        <Callout tone="info" title="Why batches?">
          <CheckList
            items={[
              "One order can span multiple production runs",
              "Track efficiency per batch — identify problem runs",
              "Assign unique lot numbers to each output",
              "Calculate yield and variance per batch",
            ]}
          />
        </Callout>
      </Section>

      <Section title="Material consumption">
        <P>
          When executing a batch, you record which materials were consumed from
          which lots. This creates the input side of the lot genealogy trace.
        </P>
        <FieldTable
          label="Consumption record"
          rows={[
            { field: "Item", description: "Which material was consumed" },
            { field: "Lot", description: "Which lot it came from" },
            { field: "Location", description: "Where it was stored" },
            { field: "Quantity", description: "How much was consumed" },
            { field: "Is scrap", description: "Whether this was waste" },
            {
              field: "Substitution",
              description: "If a different material was used",
            },
          ]}
        />
      </Section>

      <Section title="Material returns">
        <FieldTable
          label="Return reasons"
          rows={[
            { field: "Excess", description: "More material than needed" },
            {
              field: "Quality issue",
              description: "Material did not meet specs",
            },
            {
              field: "Order change",
              description: "Production quantity reduced",
            },
            {
              field: "Wrong material",
              description: "Incorrect material issued",
            },
          ]}
        />
      </Section>

      <Section title="Production output">
        <FieldTable
          label="Output record"
          rows={[
            { field: "Item", description: "Finished good produced" },
            { field: "Lot", description: "New lot number for the output" },
            { field: "Location", description: "Where to store it" },
            { field: "Quantity", description: "How much was produced" },
            {
              field: "Unit cost",
              description: "Calculated from material costs",
            },
          ]}
        />
      </Section>

      <Section title="Yield and variance">
        <FieldTable
          label="Yield calculation"
          rows={[
            {
              field: "Expected yield",
              description: "Planned quantity × expected yield %",
            },
            { field: "Actual yield", description: "Actual output quantity" },
            { field: "Yield %", description: "(Actual ÷ Planned) × 100" },
            {
              field: "Variance",
              description: "Required vs consumed per component",
            },
          ]}
        />
        <CodeBlock
          label="Example — yield analysis"
          code={`Planned:          1000 units
Expected yield:    95%  → 950 units
Actual output:    920 units
Actual yield:     92%  (below expectation)

Action: investigate why yield is lower than expected`}
        />
      </Section>

      <Section title="Stock reservations">
        <Steps
          items={[
            { title: "Create a production order with a BOM" },
            {
              title:
                "The system calculates required materials (planned qty × BOM)",
            },
            { title: "Stock is reserved using FIFO allocation" },
            { title: "Reserved quantity is locked for this order" },
            { title: "When the batch executes, reserved stock is consumed" },
          ]}
        />
      </Section>

      <Section title="Integration with other modules">
        <FieldTable
          label="Connections"
          rows={[
            {
              field: "Inventory",
              description:
                "Material reservations, consumption, and output lot creation",
            },
            {
              field: "Quality",
              description: "Input lot quality checks before consumption",
            },
            {
              field: "Traceability",
              description: "Full lot genealogy from inputs to outputs",
            },
          ]}
        />
        <P>
          Reserved materials move to <Pill label="IN_PROGRESS" /> when the batch
          starts — every consumption event extends the genealogy chain.
        </P>
      </Section>

      <NextSteps
        title="Explore traceability"
        body="Forward and reverse lot tracing across every production hop — from receipt to shipment."
        links={[
          {
            label: "Traceability module",
            href: "/docs/modules/traceability",
            primary: true,
          },
        ]}
      />
      <Pager
        prev={{ label: "Sales", href: "/docs/modules/sales" }}
        next={{ label: "Quality", href: "/docs/modules/quality" }}
      />
    </article>
  );
}
