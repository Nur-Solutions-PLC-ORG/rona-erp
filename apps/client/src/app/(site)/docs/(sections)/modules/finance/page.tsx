import {
  Card,
  CheckList,
  CodeBlock,
  DocHeader,
  FieldTable,
  NextSteps,
  P,
  Pager,
  Section,
  StatusFlow,
  Steps,
} from "../../ui";

export const metadata = {
  title: "Finance",
  description: "Invoices, payments, cost tracking, and accounts receivable.",
};

export default function FinancePage() {
  return (
    <article>
      <DocHeader
        eyebrow="Core Modules / 06"
        title="Finance"
        lede="The Finance module manages invoicing, payments, and cost tracking. It integrates with sales for invoice generation and with manufacturing for cost of goods sold (COGS) calculation."
        tags={["INVOICES", "PAYMENTS", "COSTS"]}
      />

      <Section title="Key features">
        <Card shadow>
          <CheckList
            items={[
              "Invoice generation from fulfilled sales orders",
              "Payment recording and allocation",
              "Automatic invoice status updates",
              "Cost tracking by category and cost center",
              "VAT calculation and management",
              "Accounts receivable tracking",
              "Integration with the sales order lifecycle",
            ]}
            columns={2}
          />
        </Card>
      </Section>

      <Section title="Invoices">
        <P>
          Invoices are formal requests for payment, generated from fulfilled
          sales orders and tracked through to closure.
        </P>
        <StatusFlow
          steps={["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "VOID"]}
        />
        <FieldTable
          label="Invoice components"
          rows={[
            {
              field: "Invoice number",
              description: "Auto-generated unique identifier",
            },
            { field: "Customer", description: "Who is being billed" },
            {
              field: "Sales order",
              description: "Source order for the invoice",
            },
            {
              field: "Line items",
              description: "Products, quantities, prices",
            },
            { field: "Subtotal", description: "Sum of line items" },
            { field: "VAT", description: "Tax (default 15%, configurable)" },
            { field: "Total", description: "Subtotal + VAT" },
            { field: "Due date", description: "When payment is expected" },
            {
              field: "Payment terms",
              description:
                "IMMEDIATE, NET_7, NET_15, NET_30, NET_60, END_OF_MONTH",
            },
          ]}
        />
      </Section>

      <Section title="Invoice creation">
        <Steps
          items={[
            { title: "Select a fulfilled sales order" },
            { title: "The system copies order lines to the invoice" },
            { title: "VAT is calculated (15% by default)" },
            { title: "The due date is set based on payment terms" },
            { title: "The invoice is created in DRAFT status" },
            { title: "Review and issue the invoice when ready" },
          ]}
        />
        <P>
          Issuing is a separate step from creation on purpose — the draft phase
          catches mistakes, allows manager approval, and ensures every detail is
          correct before the invoice reaches the customer.
        </P>
      </Section>

      <Section title="Payments">
        <FieldTable
          label="Payment recording"
          rows={[
            {
              field: "Invoice",
              description: "Which invoice this payment is for",
            },
            { field: "Method", description: "BANK, CASH, or CREDIT_NOTE" },
            { field: "Amount", description: "How much was paid" },
            {
              field: "Reference",
              description: "Bank transfer number, receipt number, etc.",
            },
            { field: "Date", description: "When the payment was received" },
            {
              field: "Allocation",
              description: "Automatically linked to the invoice",
            },
          ]}
        />
        <FieldTable
          label="Allocation logic"
          rows={[
            {
              field: "Link",
              description: "The payment is linked to a specific invoice",
            },
            {
              field: "Paid total",
              description: "Invoice paid total increases by the payment amount",
            },
            { field: "Balance", description: "Remaining balance decreases" },
            {
              field: "Fully paid",
              description: "If paid total ≥ total, status changes to PAID",
            },
            {
              field: "Partially paid",
              description:
                "If paid total < total, status changes to PARTIALLY_PAID",
            },
            {
              field: "Overpayment",
              description: "Prevented — you cannot pay more than owed",
            },
          ]}
        />
        <CodeBlock
          label="Example — partial payments"
          code={`Invoice INV-001:            total $100

Payment 1 (BANK):         $60
  → status: PARTIALLY_PAID, remaining $40

Payment 2 (CASH):         $40
  → status: PAID, remaining $0`}
        />
      </Section>

      <Section title="Costs">
        <FieldTable
          label="Cost types"
          rows={[
            { field: "RAW_MATERIAL", description: "Raw material purchases" },
            { field: "ELECTRICITY", description: "Utility costs" },
            { field: "WATER", description: "Water and sewer costs" },
            { field: "LABOR", description: "Employee wages and salaries" },
            { field: "PACKAGING", description: "Packaging materials" },
            { field: "FUEL", description: "Fuel and transportation" },
            { field: "MAINTENANCE", description: "Equipment maintenance" },
            { field: "DEPRECIATION", description: "Asset depreciation" },
          ]}
        />
        <P>
          Cost centers group costs by department or project — Production,
          Warehouse, Quality, Administration, Sales — for accurate financial
          analysis and true COGS calculation.
        </P>
      </Section>

      <Section title="VAT management">
        <CodeBlock
          label="VAT calculation"
          code={`Subtotal:      $1,000
VAT rate:      15%  (configurable per organization)
VAT amount:    $150  (subtotal × VAT rate)
Total:         $1,150  (subtotal + VAT amount)`}
        />
      </Section>

      <Section title="Order-to-cash flow">
        <Steps
          items={[
            { title: "Create sales order", body: "Status DRAFT." },
            {
              title: "Confirm the order",
              body: "Status CONFIRMED — stock can be reserved.",
            },
            { title: "Fulfill the order", body: "Status FULFILLED." },
            {
              title: "Generate the invoice",
              body: "Created in DRAFT from the order lines.",
            },
            {
              title: "Issue the invoice",
              body: "Status ISSUED — due date tracking begins.",
            },
            {
              title: "Record the payment",
              body: "Allocation updates the balance.",
            },
            { title: "Invoice closes", body: "Status changes to PAID." },
          ]}
        />
      </Section>

      <Section title="Accounts receivable">
        <FieldTable
          label="AR metrics"
          rows={[
            {
              field: "Total outstanding",
              description: "Sum of all unpaid invoices",
            },
            {
              field: "Overdue amount",
              description: "Invoices past their due date",
            },
            {
              field: "Days sales outstanding",
              description: "Average collection time",
            },
            {
              field: "Payment aging",
              description: "Buckets by overdue days (0-30, 31-60, 61-90, 90+)",
            },
          ]}
        />
      </Section>

      <Section title="Financial reports">
        <FieldTable
          label="Available reports"
          rows={[
            {
              field: "Sales summary",
              description: "Revenue by period, customer, product",
            },
            {
              field: "Accounts receivable",
              description: "Outstanding and overdue invoices",
            },
            {
              field: "Cost analysis",
              description: "Costs by category and cost center",
            },
            { field: "Profit & loss", description: "Revenue minus costs" },
            { field: "VAT report", description: "VAT collected and payable" },
          ]}
        />
        <P>
          Reports can be generated with Rona AI or manual queries, and exported
          as PDF, Excel, or JSON.
        </P>
      </Section>

      <Section title="Best practices">
        <Card tone="info">
          <CheckList
            items={[
              "Issue invoices promptly after order fulfillment",
              "Follow up on overdue invoices regularly",
              "Reconcile payments with bank statements",
              "Review cost reports monthly",
              "Maintain accurate cost center assignments",
              "Keep VAT rates updated per regulations",
              "Use payment terms that match your cash flow needs",
            ]}
          />
        </Card>
      </Section>

      <NextSteps
        title="Explore workforce"
        body="Employees, attendance, shifts, departments, and positions — with kiosk mode for check-in."
        links={[
          {
            label: "Workforce module",
            href: "/docs/modules/workforce",
            primary: true,
          },
        ]}
      />
      <Pager
        prev={{ label: "Traceability", href: "/docs/modules/traceability" }}
        next={{ label: "Workforce", href: "/docs/modules/workforce" }}
      />
    </article>
  );
}
