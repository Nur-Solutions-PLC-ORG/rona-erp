import { CheckCircle2 } from "lucide-react";
import {
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
  title: "First Steps",
  description: "From your first item to your first completed production cycle.",
};

export default function FirstStepsPage() {
  return (
    <article>
      <DocHeader
        eyebrow="Getting Started / 03"
        title="First steps"
        lede="With your workspace set up, walk through the essential first steps — create your first item, receive stock, run a quality inspection, and process your first production order end to end."
        tags={["ITEMS", "LOTS", "BOM", "BATCH"]}
      />

      <Section title="The production cycle you will complete">
        <StatusFlow
          steps={[
            "RECEIVE",
            "QUARANTINED",
            "APPROVED",
            "RESERVED",
            "IN_PROGRESS",
            "COMPLETED",
          ]}
        />
        <P>
          A single, repeatable flow your whole team can trust. Every step writes
          an immutable audit record.
        </P>
      </Section>

      <Section title="Step 1 — Create your first item">
        <FieldTable
          label="Item fields"
          rows={[
            {
              field: "Code",
              description: "Unique SKU (e.g., WF-500 for Wheat Flour)",
            },
            { field: "Name", description: "Descriptive product name" },
            {
              field: "Type",
              description: "RAW_MATERIAL, FINISHED_GOOD, or CONSUMABLE",
            },
            {
              field: "Unit of measure",
              description: "How the item is quantified (KG, EA, L…)",
            },
            {
              field: "Reorder point",
              description: "Minimum stock level before reordering",
            },
            {
              field: "Reorder quantity",
              description: "How much to order when the reorder point is hit",
            },
            { field: "Barcode", description: "Optional barcode for scanning" },
          ]}
        />
        <CodeBlock
          label="Example — raw material"
          code={`Code:              WF-500
Name:              Wheat Flour
Type:              RAW_MATERIAL
Unit of measure:   KG
Reorder point:     500
Reorder quantity:  2000`}
        />
      </Section>

      <Section title="Step 2 — Receive your first stock">
        <FieldTable
          label="Receiving stock"
          rows={[
            { field: "Item", description: "The item you are receiving" },
            {
              field: "Lot number",
              description: "Unique lot identifier (e.g., LOT-2026-001)",
            },
            { field: "Quantity", description: "How much is being received" },
            {
              field: "Location",
              description: "Where to store it in the warehouse",
            },
            { field: "Supplier", description: "Who supplied this stock" },
            {
              field: "Manufacture date",
              description: "When the item was produced (if applicable)",
            },
            {
              field: "Expiry date",
              description: "When the item expires (if applicable)",
            },
          ]}
        />
        <Card tone="warn">
          <P>
            Received stock always starts <Pill label="QUARANTINED" />. You must
            run a quality inspection before the lot can be used for production
            or shipment — quality control from the moment goods enter your
            facility.
          </P>
        </Card>
      </Section>

      <Section title="Step 3 — Run a quality inspection">
        <Steps
          items={[
            {
              title: "Select the quarantined lot",
              body: "Create an inspection for the lot you just received.",
            },
            {
              title: "Define the checks",
              body: "Appearance, weight, purity, packaging — whatever your standards require.",
            },
            {
              title: "Record results",
              body: "Pass/fail for each check, performed by a named inspector.",
            },
            {
              title: "Make the decision",
              body: "Approve releases the lot from quarantine. Reject locks it permanently.",
            },
          ]}
        />
      </Section>

      <Section title="Step 4 — Create a bill of materials">
        <FieldTable
          label="BOM fields"
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
      </Section>

      <Section title="Step 5 — Create a production order">
        <FieldTable
          label="Order fields"
          rows={[
            {
              field: "Order number",
              description: "Auto-generated unique identifier",
            },
            { field: "BOM", description: "Which bill of materials to use" },
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
              field: "Planned dates",
              description: "Start and end dates for production",
            },
          ]}
        />
      </Section>

      <Section title="Step 6 — Reserve materials">
        <Card shadow>
          <CheckList
            items={[
              "Ensures materials are available when needed",
              "Prevents double-allocation conflicts",
              "Uses FIFO to consume the oldest lots first",
              "Provides visibility into material availability",
            ]}
            columns={2}
          />
        </Card>
      </Section>

      <Section title="Step 7 — Execute the batch">
        <FieldTable
          label="Batch execution"
          rows={[
            {
              field: "Batch number",
              description: "Auto-generated identifier for this production run",
            },
            {
              field: "Consumption",
              description: "Which lots were consumed and in what quantities",
            },
            {
              field: "Output",
              description: "The finished good lot and quantity produced",
            },
            { field: "Scrap", description: "Any waste or rejected output" },
            {
              field: "Yield",
              description: "Actual yield vs expected, calculated automatically",
            },
          ]}
        />
      </Section>

      <Section title="Your first cycle is complete">
        <Card tone="info">
          <div className="flex items-start gap-3">
            <CheckCircle2
              className="mt-0.5 h-5 w-5 shrink-0 text-[#1d3536]"
              strokeWidth={1.5}
            />
            <div>
              <CheckList
                items={[
                  "Items defined in your catalog",
                  "Stock received with lot tracking",
                  "Quality inspections completed",
                  "BOMs configured for production",
                  "Production orders executed",
                  "Material consumption and output tracked",
                  "Full traceability from raw materials to finished goods",
                ]}
              />
            </div>
          </div>
        </Card>
      </Section>

      <NextSteps
        title="Go deeper on inventory"
        body="Items, warehouses, lots, reservations, and the complete movement ledger — the foundation every other module builds on."
        links={[
          {
            label: "Inventory module",
            href: "/docs/modules/inventory",
            primary: true,
          },
        ]}
      />
      <Pager
        prev={{ label: "Setup", href: "/docs/getting-started/setup" }}
        next={{ label: "Dashboard", href: "/docs/getting-started/dashboard" }}
      />
    </article>
  );
}
