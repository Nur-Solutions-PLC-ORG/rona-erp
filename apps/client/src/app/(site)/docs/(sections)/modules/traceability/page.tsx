import {
  Card,
  CheckList,
  DocHeader,
  Exchange,
  FieldTable,
  NextSteps,
  P,
  Pager,
  Section,
  Tags,
} from "../../ui";

export const metadata = {
  title: "Traceability",
  description:
    "Forward and reverse lot tracing across every production hop — from receipt to shipment.",
};

export default function TraceabilityPage() {
  return (
    <article>
      <DocHeader
        eyebrow="Core Modules / 05"
        title="Traceability"
        lede="Track any lot from inbound receipt through production to outbound shipment. Rona ERP provides complete lot genealogy — forward and reverse tracing across every production hop — critical for quality management, regulatory compliance, and recall management."
        tags={["5-HOP TRACE", "GENEALOGY", "FDA-READY"]}
      />

      <Section title="Why traceability matters">
        <Card shadow>
          <CheckList
            items={[
              "Quality issue management — trace problems to source",
              "Regulatory compliance — FDA and food safety requirements",
              "Recall management — targeted recalls instead of blanket recalls",
              "Supplier accountability — identify problematic suppliers",
              "Customer trust — demonstrate quality control",
              "Cost reduction — minimize recall scope and impact",
            ]}
            columns={2}
          />
        </Card>
      </Section>

      <Section title="Lot genealogy">
        <P>
          Lot genealogy is the complete history of a lot from creation to
          consumption — every movement, transformation, and relationship with
          other lots.
        </P>
        <FieldTable
          label="Genealogy components"
          rows={[
            {
              field: "Origin",
              description: "Supplier, manufacture date, receipt date",
            },
            {
              field: "Quality status",
              description: "Inspection history and current status",
            },
            {
              field: "Consumption",
              description: "Which production batches consumed this lot",
            },
            {
              field: "Output",
              description: "Which lots were produced from this lot",
            },
            {
              field: "Shipments",
              description: "Which customers received products from this lot",
            },
            { field: "Movements", description: "Complete movement ledger" },
          ]}
        />
      </Section>

      <Section title="Forward tracing">
        <P>
          Forward tracing finds all products that contain a specific lot — used
          when you discover a quality issue with a raw material and need to find
          all affected finished goods.
        </P>
        <Card shadow>
          <div className="space-y-2 font-mono text-[12.5px] text-[#1d3536]">
            <p className="font-sans text-[13px] font-semibold text-[#1d3536]">
              Scenario — lot LOT-2026-001 (wheat flour) failed quality
              inspection
            </p>
            <p>→ Consumed in production batch BATCH-001</p>
            <p>→ Produced finished lot FG-LOT-001 (Bread Loaves)</p>
            <p>→ Shipped to Customer A (50 units)</p>
            <p>→ Shipped to Customer B (30 units)</p>
            <p className="border-t border-[#d6e8e6] pt-2 font-sans text-[13px] font-semibold">
              Action — recall 80 units from Customers A and B
            </p>
          </div>
        </Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card tone="warn">
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#1d3536]">
              Without traceability
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-[#386163]">
              You would have to recall ALL bread loaves produced during the
              entire period when the lot might have been used — potentially
              thousands of units across all customers.
            </p>
          </Card>
          <Card tone="ok">
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#1d3536]">
              With traceability
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-[#386163]">
              You know exactly which 80 units were affected and can target the
              recall to those specific customers — minimizing cost, protecting
              brand reputation, and maintaining customer trust.
            </p>
          </Card>
        </div>
      </Section>

      <Section title="Reverse tracing">
        <P>
          Reverse tracing finds the source of a finished good lot — used when a
          customer reports a quality issue and you need to identify which raw
          materials caused the problem.
        </P>
        <Card shadow>
          <div className="space-y-2 font-mono text-[12.5px] text-[#1d3536]">
            <p className="font-sans text-[13px] font-semibold">
              Scenario — customer reports an issue with Bread Loaf FG-LOT-001
            </p>
            <p>← Produced from production batch BATCH-001</p>
            <p>← Consumed Wheat Flour LOT-2026-001 (0.5 KG)</p>
            <p>← Consumed Yeast LOT-2026-002 (0.01 KG)</p>
            <p>← Consumed Water LOT-2026-003 (0.3 L)</p>
            <p>← Consumed Salt LOT-2026-004 (0.005 KG)</p>
            <p className="border-t border-[#d6e8e6] pt-2 font-sans text-[13px] font-semibold">
              Action — investigate which input lot caused the issue
            </p>
          </div>
        </Card>
      </Section>

      <Section title="Multi-hop tracing">
        <P>
          Production hop tracing tracks lots through multiple production stages
          — essential when raw materials become intermediate products, which
          then become finished goods.
        </P>
        <Card shadow>
          <div className="space-y-3 font-mono text-[12.5px] text-[#1d3536]">
            <div>
              <p className="font-sans text-[12px] font-bold uppercase tracking-widest text-[#518985]">
                Hop 1 — raw material to intermediate
              </p>
              <p className="mt-1">Wheat Flour LOT-001 → Dough LOT-A</p>
            </div>
            <div>
              <p className="font-sans text-[12px] font-bold uppercase tracking-widest text-[#518985]">
                Hop 2 — intermediate to finished good
              </p>
              <p className="mt-1">Dough LOT-A → Bread Loaf FG-001</p>
            </div>
            <p className="border-t border-[#d6e8e6] pt-2">
              Full trace: FG-001 → LOT-A → LOT-001 → Supplier
            </p>
          </div>
        </Card>
        <Tags
          items={[
            "HOP 1: CURRENT LOT",
            "HOP 2: PARENT BATCH",
            "HOP 3: INPUTS",
            "HOP 4: RAW MATERIALS",
            "HOP 5: SUPPLIER RECEIPT",
          ]}
        />
      </Section>

      <Section title="Data sources">
        <FieldTable
          label="Where trace data comes from"
          rows={[
            {
              field: "Inventory",
              description: "Lot creation, movements, stock balances",
            },
            {
              field: "Manufacturing",
              description: "Material consumption, production output",
            },
            {
              field: "Quality",
              description: "Inspection results, lot status changes",
            },
            { field: "Sales", description: "Shipments, customer allocations" },
            {
              field: "Audit",
              description: "All state changes with timestamps",
            },
          ]}
        />
      </Section>

      <Section title="Tracing with Rona AI">
        <P>
          Ask questions about lots in natural language and get instant answers
          with full genealogy.
        </P>
        <Exchange
          prompt="Trace lot LOT-2026-001"
          response="5 hops. Received 500 KG from Supplier X → QA approved → 50 KG consumed in PO-BREAD-044 → FG-LOT-001 produced → shipped to Customer A."
        />
        <Exchange
          prompt="Which lots are expiring this month?"
          response="3 lots. LOT-001 expires Jan 15, LOT-002 expires Jan 20, LOT-003 expires Jan 28. Total value: ETB 45,000."
        />
      </Section>

      <Section title="Regulatory compliance">
        <FieldTable
          label="Compliance features"
          rows={[
            {
              field: "One-up-one-down",
              description: "Track immediate supplier and customer",
            },
            {
              field: "Full chain",
              description: "Complete genealogy across all hops",
            },
            {
              field: "Audit trail",
              description: "Immutable records of all changes",
            },
            {
              field: "Reporting",
              description: "Generate compliance reports on demand",
            },
            {
              field: "Recall plans",
              description: "Pre-defined recall procedures",
            },
          ]}
        />
      </Section>

      <Section title="Best practices">
        <Card tone="info">
          <CheckList
            items={[
              "Always assign unique lot numbers to every receipt",
              "Record lot information accurately (supplier, dates, expiry)",
              "Inspect all lots before releasing from quarantine",
              "Use lot tracing for every quality issue investigation",
              "Maintain accurate lot relationships in production",
              "Regularly review expiry dates and plan accordingly",
              "Train staff on lot tracking procedures",
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
        prev={{ label: "Quality", href: "/docs/modules/quality" }}
        next={{ label: "Finance", href: "/docs/modules/finance" }}
      />
    </article>
  );
}
