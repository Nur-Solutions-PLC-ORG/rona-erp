import { CheckCircle2 } from "lucide-react";
import {
  Card,
  CodeBlock,
  DocHeader,
  Endpoint,
  NextSteps,
  Pager,
  P,
  Section,
} from "../../ui";

export const metadata = {
  title: "Finance API",
  description: "REST endpoints for invoices, payments, and costs.",
};

export default function FinanceApiPage() {
  return (
    <article>
      <DocHeader
        eyebrow="API Reference / 05"
        title="Finance API"
        lede="Endpoints for managing invoices, payments, and costs. All endpoints require authentication and appropriate permissions."
        tags={["REST", "JWT", "PAGINATED"]}
      />

      <Section title="Base URL">
        <CodeBlock label="Base" code={`https://api.rona-erp.com/finance`} />
      </Section>

      <Section title="Endpoints">
        <div className="grid grid-cols-1 gap-4">
          <Endpoint
            method="GET"
            path="/finance/invoices"
            description="List invoices with filtering and pagination."
            permission="finance.invoice.read"
          />
          <Endpoint
            method="POST"
            path="/finance/invoices"
            description="Create a new invoice — typically from a fulfilled sales order."
            permission="finance.invoice.create"
          />
          <Endpoint
            method="PATCH"
            path="/finance/invoices/:id/issue"
            description="Issue an invoice to the customer — status changes to ISSUED."
            permission="finance.invoice.issue"
          />
          <Endpoint
            method="PATCH"
            path="/finance/invoices/:id/void"
            description="Void an invoice — only if it is not paid."
            permission="finance.invoice.void"
          />
          <Endpoint
            method="GET"
            path="/finance/payments"
            description="List payments with filtering and pagination."
            permission="finance.payment.read"
          />
          <Endpoint
            method="POST"
            path="/finance/payments"
            description="Record a payment against an invoice."
            permission="finance.payment.create"
          />
          <Endpoint
            method="GET"
            path="/finance/costs"
            description="List costs with filtering and pagination."
            permission="finance.cost.read"
          />
          <Endpoint
            method="POST"
            path="/finance/costs"
            description="Record a new cost."
            permission="finance.cost.create"
          />
        </div>
      </Section>

      <Section title="Documentation complete">
        <Card tone="ok" shadow>
          <div className="flex items-start gap-3">
            <CheckCircle2
              className="mt-0.5 h-5 w-5 shrink-0 text-[#581c87]"
              strokeWidth={1.5}
            />
            <div>
              <h3 className="text-[14px] font-semibold text-[#581c87]">
                You have covered every section
              </h3>
              <P>
                Getting Started, Core Modules, Admin &amp; Permissions, Rona AI,
                and the API Reference. Head back to the hub any time — the docs
                are updated with every release.
              </P>
            </div>
          </div>
        </Card>
      </Section>

      <NextSteps
        title="Back to the docs hub"
        body="Search all 24 guides, jump between sections, or revisit any topic."
        links={[
          { label: "Docs hub", href: "/docs", primary: true },
          { label: "Introduction", href: "/docs/getting-started/introduction" },
        ]}
      />
      <Pager
        prev={{ label: "Manufacturing API", href: "/docs/api/manufacturing" }}
        next={undefined}
      />
    </article>
  );
}
