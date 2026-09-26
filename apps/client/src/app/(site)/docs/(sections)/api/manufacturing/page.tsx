import {
  CodeBlock,
  DocHeader,
  Endpoint,
  NextSteps,
  Pager,
  Section,
} from "../../ui";

export const metadata = {
  title: "Manufacturing API",
  description:
    "REST endpoints for BOMs, production orders, batches, and consumption.",
};

export default function ManufacturingApiPage() {
  return (
    <article>
      <DocHeader
        eyebrow="API Reference / 04"
        title="Manufacturing API"
        lede="Endpoints for managing bills of materials, production orders, production batches, and material consumption. All endpoints require authentication and appropriate permissions."
        tags={["REST", "JWT", "PAGINATED"]}
      />

      <Section title="Base URL">
        <CodeBlock
          label="Base"
          code={`https://api.rona.pro.et/manufacturing`}
        />
      </Section>

      <Section title="Endpoints">
        <div className="grid grid-cols-1 gap-4">
          <Endpoint
            method="GET"
            path="/manufacturing/boms"
            description="List bills of materials with filtering and pagination."
            permission="manufacturing.bom.read"
          />
          <Endpoint
            method="POST"
            path="/manufacturing/boms"
            description="Create a new bill of materials."
            permission="manufacturing.bom.create"
          />
          <Endpoint
            method="GET"
            path="/manufacturing/orders"
            description="List production orders with filtering and pagination."
            permission="manufacturing.order.read"
          />
          <Endpoint
            method="POST"
            path="/manufacturing/orders"
            description="Create a new production order."
            permission="manufacturing.order.create"
          />
          <Endpoint
            method="PATCH"
            path="/manufacturing/orders/:id/status"
            description="Update the order status — approve, start, complete, or cancel."
            permission="manufacturing.order.update"
          />
          <Endpoint
            method="POST"
            path="/manufacturing/orders/:id/reserve"
            description="Reserve materials for a production order."
            permission="manufacturing.order.reserve"
          />
          <Endpoint
            method="POST"
            path="/manufacturing/batches"
            description="Create a new production batch."
            permission="manufacturing.batch.create"
          />
          <Endpoint
            method="POST"
            path="/manufacturing/batches/:id/consume"
            description="Record material consumption for a batch."
            permission="manufacturing.batch.consume"
          />
          <Endpoint
            method="POST"
            path="/manufacturing/batches/:id/output"
            description="Record production output for a batch."
            permission="manufacturing.batch.output"
          />
        </div>
      </Section>

      <NextSteps
        title="Finance API"
        body="Invoices, payments, and costs — the final module in the API reference."
        links={[
          { label: "Finance API", href: "/docs/api/finance", primary: true },
        ]}
      />
      <Pager
        prev={{ label: "Sales API", href: "/docs/api/sales" }}
        next={{ label: "Finance API", href: "/docs/api/finance" }}
      />
    </article>
  );
}
