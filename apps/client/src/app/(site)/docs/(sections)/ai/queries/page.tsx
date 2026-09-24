import {
  Card,
  CheckList,
  DocHeader,
  FieldTable,
  NextSteps,
  P,
  Pager,
  QuoteList,
  Section,
  TipCard,
} from "../../ui";

export const metadata = {
  title: "AI Queries",
  description:
    "Natural language queries across every module — patterns, follow-ups, and examples.",
};

export default function AiQueriesPage() {
  return (
    <article>
      <DocHeader
        eyebrow="Rona AI / 02"
        title="Natural Language Queries"
        lede="Ask questions in plain English and get instant answers with data from your live ERP system — across every module, no query language required."
        tags={["PLAIN ENGLISH", "FOLLOW-UPS", "CROSS-MODULE"]}
      />

      <Section title="Query best practices">
        <Card shadow>
          <CheckList
            items={[
              "Be specific about what you want to know",
              "Include time ranges when relevant (last week, this month)",
              "Use natural language — no technical terms needed",
              "Ask follow-up questions to drill down",
              "Use module names to narrow scope (inventory, production, etc.)",
            ]}
          />
        </Card>
      </Section>

      <Section title="Inventory queries">
        <QuoteList
          items={[
            '"Which items are below reorder point?"',
            '"What\'s the total stock value?"',
            '"Show me lots expiring in the next 30 days"',
            '"Which lots are in quarantine?"',
            '"How much wheat flour do we have?"',
            '"Show me stock by warehouse"',
            '"Show me stock movements this week"',
            '"What was received yesterday?"',
            '"Which items were issued today?"',
          ]}
        />
      </Section>

      <Section title="Manufacturing queries">
        <QuoteList
          items={[
            '"Which production orders are in progress?"',
            '"Show me orders delayed this week"',
            '"What\'s the planned production for next week?"',
            '"Which orders are awaiting approval?"',
            '"What\'s the average yield for bread?"',
            '"Show me batches with low yield"',
            '"Which batches had high scrap?"',
            '"Summarize material consumption for PO-BREAD-044"',
          ]}
        />
      </Section>

      <Section title="Quality queries">
        <QuoteList
          items={[
            '"What\'s the pass rate this month?"',
            '"Show me failed inspections this week"',
            '"Which lots failed quality checks?"',
            '"What\'s the pass rate by supplier?"',
            '"How long has lot LOT-001 been quarantined?"',
            '"Show me lots pending inspection"',
          ]}
        />
      </Section>

      <Section title="Sales queries">
        <QuoteList
          items={[
            '"What\'s the total revenue this month?"',
            '"Show me orders awaiting fulfillment"',
            '"Which customers have overdue payments?"',
            '"What are the top selling products?"',
            '"Show me orders by customer"',
            '"What commissions are pending approval?"',
            '"How much commission did John earn this month?"',
          ]}
        />
      </Section>

      <Section title="Finance queries">
        <QuoteList
          items={[
            '"Which invoices are overdue?"',
            '"What\'s the accounts receivable balance?"',
            '"Show me payments received this week"',
            '"Which invoices are partially paid?"',
            '"Summarize costs by category this month"',
            '"Show me costs by cost center"',
          ]}
        />
      </Section>

      <Section title="Workforce queries">
        <QuoteList
          items={[
            '"Who was late this week?"',
            '"Show me attendance by department"',
            '"What\'s the absence rate this month?"',
            '"Which employees missed work yesterday?"',
          ]}
        />
      </Section>

      <Section title="Cross-module queries">
        <P>
          Rona AI can handle complex queries that span multiple modules and
          require calculations:
        </P>
        <QuoteList
          items={[
            '"Which production orders used lot LOT-001 and what was the yield?"',
            '"Show me customers who received products from lot FG-LOT-001"',
            '"What\'s the cost of goods sold for order SO-001?"',
            '"Which suppliers provided lots that failed inspection?"',
          ]}
        />
      </Section>

      <Section title="Follow-up questions">
        <Card shadow>
          <div className="space-y-2.5 text-[13px]">
            <p>
              <span className="font-mono text-[10px] font-bold uppercase text-[#7c6f96]">
                Q1
              </span>{" "}
              <span className="text-[#581c87]">
                &ldquo;Which items are below reorder point?&rdquo;
              </span>
            </p>
            <p className="text-[#5c4d77]">
              <span className="font-mono text-[10px] font-bold uppercase text-[#581c87]">
                A1
              </span>{" "}
              2 items: VC-012 (12 &lt; 20), DR-045 (0 &lt; 40)
            </p>
            <p>
              <span className="font-mono text-[10px] font-bold uppercase text-[#7c6f96]">
                Q2
              </span>{" "}
              <span className="text-[#581c87]">
                &ldquo;Show me the stock movements for VC-012&rdquo;
              </span>
            </p>
            <p className="text-[#5c4d77]">
              <span className="font-mono text-[10px] font-bold uppercase text-[#581c87]">
                A2
              </span>{" "}
              VC-012 had 3 movements this week: received 50, issued 30, issued 8
            </p>
            <p>
              <span className="font-mono text-[10px] font-bold uppercase text-[#7c6f96]">
                Q3
              </span>{" "}
              <span className="text-[#581c87]">
                &ldquo;When did we issue the 8 units?&rdquo;
              </span>
            </p>
            <p className="text-[#5c4d77]">
              <span className="font-mono text-[10px] font-bold uppercase text-[#581c87]">
                A3
              </span>{" "}
              8 units were issued on Jan 14 for order SO-123
            </p>
          </div>
        </Card>
      </Section>

      <Section title="Query patterns">
        <FieldTable
          label="Patterns that work everywhere"
          rows={[
            {
              field: "Show me [entity] [time range]",
              description: "\u201cShow me orders this week\u201d",
            },
            {
              field: "Which [entity] [condition]",
              description: "\u201cWhich orders are delayed\u201d",
            },
            {
              field: "What's the [metric] [time range]",
              description: "\u201cWhat's the revenue this month\u201d",
            },
            {
              field: "Summarize [entity] by [dimension]",
              description: "\u201cSummarize costs by category\u201d",
            },
            {
              field: "How much [metric] [condition]",
              description: "\u201cHow much stock is in quarantine\u201d",
            },
          ]}
        />
        <TipCard title="Pro tip">
          If Rona AI does not understand your query, try rephrasing it. Use
          different words or be more specific about time ranges, modules, or
          entities — the AI learns from your patterns over time.
        </TipCard>
      </Section>

      <NextSteps
        title="Report generation"
        body="Comprehensive documents on demand or on a schedule — PDF, Excel, or JSON."
        links={[
          { label: "AI reports", href: "/docs/ai/reports", primary: true },
        ]}
      />
      <Pager
        prev={{ label: "AI Overview", href: "/docs/ai/overview" }}
        next={{ label: "Reports", href: "/docs/ai/reports" }}
      />
    </article>
  );
}
