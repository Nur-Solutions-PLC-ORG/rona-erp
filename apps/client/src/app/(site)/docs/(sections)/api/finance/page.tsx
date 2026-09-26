import {
  Card,
  CheckList,
  CodeBlock,
  DocHeader,
  Endpoint,
  FieldTable,
  P,
  Pager,
  Section,
  Steps,
} from "../../ui";

export const metadata = {
  title: "Finance API",
  description: "Invoices, payments, and cost records.",
};

export default function FinancePage() {
  return (
    <article>
      <DocHeader
        eyebrow="API Reference / 03"
        title="Finance API"
        lede="Invoices, payments, and cost records. Every route is relative to https://api.rona.pro.et/api and requires a valid session cookie."
        tags={["INVOICES", "PAYMENTS", "COSTS"]}
      />

      <Section title="Invoice lifecycle">
        <Steps
          items={[
            { title: "Create a draft invoice with POST /api/finance/invoices" },
            { title: "Review the draft and its lines" },
            {
              title:
                "Issue it with POST /api/finance/invoices/:id/issue — this is the point of no return",
            },
            { title: "Record settlement with POST /api/finance/payments" },
            {
              title:
                "Void it instead with POST /api/finance/invoices/:id/void if it must be cancelled",
            },
          ]}
        />
        <Card tone="warn">
          <p className="text-[13.5px] leading-relaxed text-[#5c4d77]">
            <strong>Issuing and voiding are both POST requests.</strong> They
            are state transitions, not partial updates, so they do not use
            PATCH. Each one is permissioned separately, which keeps invoice
            approval separate from invoice creation.
          </p>
        </Card>
      </Section>

      <Section title="Invoices">
        <div className="grid grid-cols-1 gap-4">
          <Endpoint
            method="POST"
            path="/api/finance/invoices"
            description="Create a draft invoice with its line items."
            permission="finance.invoice.create"
          />
          <Endpoint
            method="GET"
            path="/api/finance/invoices"
            description="List invoices with status, customer, and date filters."
            permission="finance.invoice.read"
          />
          <Endpoint
            method="GET"
            path="/api/finance/invoices/:id"
            description="Return a single invoice with its lines and payment totals."
            permission="finance.invoice.read"
          />
          <Endpoint
            method="POST"
            path="/api/finance/invoices/:id/issue"
            description="Issue a draft invoice. Only a draft can be issued, and an issued invoice can no longer be edited."
            permission="finance.invoice.issue"
          />
          <Endpoint
            method="POST"
            path="/api/finance/invoices/:id/void"
            description="Void an invoice. Use this rather than deleting or editing an issued invoice."
            permission="finance.invoice.void"
          />
        </div>
      </Section>

      <Section title="Payments">
        <div className="grid grid-cols-1 gap-4">
          <Endpoint
            method="POST"
            path="/api/finance/payments"
            description="Record a payment against an invoice."
            permission="finance.payment.create"
          />
          <Endpoint
            method="GET"
            path="/api/finance/payments"
            description="List payments with invoice, customer, method, and date filters."
            permission="finance.payment.read"
          />
          <Endpoint
            method="PATCH"
            path="/api/finance/payments/:id"
            description="Update a payment record."
            permission="finance.payment.create"
          />
          <Endpoint
            method="DELETE"
            path="/api/finance/payments/:id"
            description="Delete a payment record."
            permission="finance.payment.create"
          />
          <Endpoint
            method="GET"
            path="/api/finance/invoices/:id/payments"
            description="List every payment recorded against one invoice."
            permission="finance.payment.read"
          />
        </div>
      </Section>

      <Section title="Costs">
        <div className="grid grid-cols-1 gap-4">
          <Endpoint
            method="POST"
            path="/api/finance/costs"
            description="Record a cost entry, such as an operating or production cost."
            permission="finance.cost.create"
          />
          <Endpoint
            method="GET"
            path="/api/finance/costs"
            description="List cost entries with category and date filters."
            permission="finance.cost.read"
          />
          <Endpoint
            method="GET"
            path="/api/finance/costs/:id"
            description="Return a single cost entry."
            permission="finance.cost.read"
          />
          <Endpoint
            method="PATCH"
            path="/api/finance/costs/:id"
            description="Update a cost entry."
            permission="finance.cost.update"
          />
        </div>
      </Section>

      <Section title="Creating an invoice">
        <CodeBlock
          label="POST /api/finance/invoices — request"
          code={`{
  "customerId": "uuid",
  "dueDate": "2026-10-30",
  "currency": "ETB",
  "lines": [
    {
      "itemId": "uuid",
      "description": "Widget assembly",
      "quantity": 10,
      "unitPrice": 250.0
    }
  ]
}`}
        />
        <CodeBlock
          label="Issued invoice"
          code={`POST /api/finance/invoices/:id/issue`}
        />
        <P>
          The invoice is created as a draft. Totals are recalculated by the
          server, so do not send a total field — only the lines.
        </P>
      </Section>

      <Section title="Permissions reference">
        <FieldTable
          label="Finance permissions"
          rows={[
            {
              field: "finance.invoice.create",
              description: "create draft invoices",
            },
            {
              field: "finance.invoice.read",
              description: "read invoices and invoice details",
            },
            {
              field: "finance.invoice.issue",
              description: "issue a draft invoice",
            },
            {
              field: "finance.invoice.void",
              description: "void an invoice",
            },
            {
              field: "finance.payment.create",
              description: "create, update, and delete payment records",
            },
            {
              field: "finance.payment.read",
              description: "read payments and invoice payment history",
            },
            {
              field: "finance.cost.create",
              description: "record cost entries",
            },
            {
              field: "finance.cost.read",
              description: "read cost entries",
            },
            {
              field: "finance.cost.update",
              description: "update cost entries",
            },
          ]}
        />
      </Section>

      <Section title="Good practices">
        <Card tone="info">
          <CheckList
            items={[
              "Never edit an issued invoice — void it and issue a replacement",
              "Keep invoice creation, issuing, and voiding with separate roles",
              "Read the invoice payment history instead of filtering all payments client-side",
              "Do not send calculated totals; the server derives them from the lines",
            ]}
          />
        </Card>
      </Section>

      <Pager
        prev={{ label: "Inventory API", href: "/docs/api/inventory" }}
        next={{ label: "Sales API", href: "/docs/api/sales" }}
      />
    </article>
  );
}
