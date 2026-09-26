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
  title: "AI Lot Tracing",
  description: "Instant five-hop lot genealogy with natural language queries.",
};

export default function AiTracingPage() {
  return (
    <article>
      <DocHeader
        eyebrow="Rona AI / 04"
        title="AI Lot Tracing"
        lede="Instant lot tracing with natural language — ask to trace a lot and get complete genealogy from receipt through production to shipment. The fastest way to investigate quality issues and manage recalls."
        tags={["5-HOP", "FORWARD", "REVERSE", "RECALLS"]}
      />

      <Section title="Why AI tracing">
        <Card shadow>
          <CheckList
            items={[
              "Instant results — no manual navigation",
              "Complete genealogy in one query",
              "Natural language — no complex filters",
              "5-hop tracing across production",
              "Identifies customers, suppliers, and intermediates",
              "Supports recall planning and execution",
            ]}
            columns={2}
          />
        </Card>
      </Section>

      <Section title="Basic tracing">
        <QuoteList
          items={[
            '"Trace lot LOT-2026-001"',
            '"Show me the genealogy of lot FG-LOT-001"',
            '"Where did lot LOT-001 come from?"',
            '"What happened to lot FG-LOT-002?"',
          ]}
        />
        <Exchange
          prompt="Trace lot LOT-2026-001"
          response="5 hops. Received 500 KG Ethio Grain from Supplier X on Jan 10 → QA approved on Jan 11 → 50 KG consumed in production batch PO-BREAD-044 on Jan 12 → FG-LOT-2026-001 produced with 95% yield on Jan 13 → shipped to Customer A (30 units) and Customer B (20 units) on Jan 14."
        />
      </Section>

      <Section title="Forward tracing">
        <P>
          Forward tracing finds all products that contain a specific lot — used
          when a raw material fails quality inspection and you need to find
          every affected finished good.
        </P>
        <QuoteList
          items={[
            '"Which products contain lot LOT-001?"',
            '"Where was lot FG-LOT-001 shipped?"',
            '"Which customers received products from lot LOT-002?"',
            '"Show me all shipments containing lot LOT-003"',
          ]}
        />
        <Exchange
          prompt="Which products contain lot LOT-2026-001?"
          response="LOT-2026-001 was used in 2 production batches: BATCH-001 (produced FG-LOT-001, 300 units) and BATCH-002 (produced FG-LOT-002, 200 units). FG-LOT-001 was shipped to Customer A (50 units) and Customer B (250 units). FG-LOT-002 is still in stock."
        />
      </Section>

      <Section title="Reverse tracing">
        <P>
          Reverse tracing finds the source of a finished good lot — used when a
          customer reports a quality issue and you need to identify the raw
          materials that caused it.
        </P>
        <QuoteList
          items={[
            '"Where did lot FG-LOT-001 come from?"',
            '"Which lots were used to make FG-LOT-002?"',
            '"Show me the inputs for lot FG-LOT-003"',
            '"Which supplier provided the materials for FG-LOT-004?"',
          ]}
        />
        <Exchange
          prompt="Where did lot FG-LOT-001 come from?"
          response="FG-LOT-001 was produced from batch BATCH-001. Inputs consumed: Wheat Flour LOT-2026-001 (0.5 KG), Yeast LOT-2026-002 (0.01 KG), Water LOT-2026-003 (0.3 L), Salt LOT-2026-004 (0.005 KG). Suppliers: Ethio Grain (flour), Local Supplier (yeast), Municipal Water (water), Salt Co (salt)."
        />
      </Section>

      <Section title="Multi-hop tracing">
        <P>
          Rona AI traces lots through multiple production hops — essential for
          complex manufacturing where raw materials become intermediate
          products, which then become finished goods.
        </P>
        <Card shadow>
          <div className="space-y-2.5 font-mono text-[12.5px] text-ink">
            <p className="font-sans text-[13px] font-semibold">
              Query — &ldquo;Trace lot FG-FINAL-001&rdquo;
            </p>
            <p>Hop 1: FG-FINAL-001 produced from batch BATCH-FINAL</p>
            <p>Hop 2: BATCH-FINAL consumed INTERM-001 (intermediate product)</p>
            <p>Hop 3: INTERM-001 produced from batch BATCH-INTERM</p>
            <p>Hop 4: BATCH-INTERM consumed RAW-001 (raw material)</p>
            <p>Hop 5: RAW-001 received from Supplier X</p>
          </div>
        </Card>
      </Section>

      <Section title="Expiry tracing">
        <P>
          Trace lots approaching expiry to manage inventory and prevent waste.
        </P>
        <QuoteList
          items={[
            '"Which lots are expiring this month?"',
            '"Show me lots expiring in the next 30 days"',
            '"Which lots expire before January 31?"',
            '"What\'s the total value of expiring lots?"',
          ]}
        />
        <Exchange
          prompt="Which lots are expiring this month?"
          response="3 lots expiring in January: LOT-001 (Wheat Flour, expires Jan 15, 200 KG, value ETB 12,000), LOT-002 (Yeast, expires Jan 20, 50 KG, value ETB 8,000), LOT-003 (Sugar, expires Jan 28, 100 KG, value ETB 15,000). Total value: ETB 35,000."
        />
      </Section>

      <Section title="Quality tracing">
        <QuoteList
          items={[
            '"Which lots failed inspection?"',
            '"Show me lots rejected this week"',
            '"Which products contain rejected lots?"',
            '"Which supplier provided rejected lots?"',
          ]}
        />
      </Section>

      <Section title="Recall planning">
        <P>
          Use AI tracing to plan targeted recalls instead of blanket recalls —
          minimizing cost and impact.
        </P>
        <QuoteList
          items={[
            '"Which customers received products from lot LOT-001?"',
            '"How much of lot FG-LOT-001 is still in stock?"',
            '"Which shipments contain lot LOT-002?"',
            '"What\'s the total quantity of affected products?"',
          ]}
        />
        <Exchange
          prompt="Which customers received products from lot LOT-001?"
          response="LOT-001 was used in FG-LOT-001 (300 units). FG-LOT-001 was shipped to: Customer A (50 units, order SO-001), Customer B (250 units, order SO-002). 0 units remain in stock. Recall scope: 300 units total, 2 customers."
        />
      </Section>

      <Section title="Tracing depth — what 5 hops means">
        <FieldTable
          label="Hop structure"
          rows={[
            { field: "Hop 1", description: "Current lot" },
            {
              field: "Hop 2",
              description: "Immediate parent (batch or production)",
            },
            { field: "Hop 3", description: "Grandparent (inputs to parent)" },
            {
              field: "Hop 4",
              description: "Great-grandparent (raw materials)",
            },
            { field: "Hop 5", description: "Original supplier receipt" },
          ]}
        />
      </Section>

      <Section title="Tracing output">
        <FieldTable
          label="Output includes"
          rows={[
            { field: "Lot numbers", description: "All lots in the chain" },
            { field: "Quantities", description: "How much at each hop" },
            { field: "Dates", description: "When each event occurred" },
            { field: "Suppliers", description: "Who provided materials" },
            { field: "Customers", description: "Who received products" },
            { field: "Quality status", description: "Inspection results" },
            { field: "Yield", description: "Production efficiency" },
          ]}
        />
        <Tags
          items={[
            "LOT NUMBERS",
            "QUANTITIES",
            "DATES",
            "SUPPLIERS",
            "CUSTOMERS",
            "QUALITY",
            "YIELD",
          ]}
        />
      </Section>

      <Section title="Best practices">
        <Card tone="info">
          <CheckList
            items={[
              "Use lot numbers for precise tracing",
              "Trace immediately when quality issues are discovered",
              "Document trace results for compliance",
              "Use forward tracing for recall planning",
              "Use reverse tracing for root cause analysis",
              "Combine with manual verification for critical issues",
            ]}
          />
        </Card>
      </Section>

      <NextSteps
        title="API reference"
        body="Integrate with Rona ERP programmatically — JWT authentication and every module's REST endpoints."
        links={[
          {
            label: "Authentication",
            href: "/docs/api/authentication",
            primary: true,
          },
        ]}
      />
      <Pager
        prev={{ label: "Reports", href: "/docs/ai/reports" }}
        next={{ label: "Authentication", href: "/docs/api/authentication" }}
      />
    </article>
  );
}
