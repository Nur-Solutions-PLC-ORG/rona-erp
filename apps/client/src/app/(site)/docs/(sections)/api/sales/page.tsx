import {
  CodeBlock,
  DocHeader,
  Endpoint,
  NextSteps,
  Pager,
  Section,
} from "../../ui";

export const metadata = {
  title: "Sales API",
  description: "REST endpoints for customers, sales orders, and commissions.",
};

export default function SalesApiPage() {
  return (
    <article>
      <DocHeader
        eyebrow="API Reference / 03"
        title="Sales API"
        lede="Endpoints for managing customers, sales orders, and commissions. All endpoints require authentication and appropriate permissions."
        tags={["REST", "JWT", "PAGINATED"]}
      />

      <Section title="Base URL">
        <CodeBlock label="Base" code={`https://api.rona-erp.com/sales`} />
      </Section>

      <Section title="Endpoints">
        <div className="grid grid-cols-1 gap-4">
          <Endpoint
            method="GET"
            path="/sales/customers"
            description="List customers with filtering and pagination."
            permission="sales.customer.read"
          />
          <Endpoint
            method="POST"
            path="/sales/customers"
            description="Create a new customer."
            permission="sales.customer.create"
          />
          <Endpoint
            method="GET"
            path="/sales/orders"
            description="List sales orders with filtering and pagination."
            permission="sales.order.read"
          />
          <Endpoint
            method="POST"
            path="/sales/orders"
            description="Create a new sales order."
            permission="sales.order.create"
          />
          <Endpoint
            method="PATCH"
            path="/sales/orders/:id/status"
            description="Update the sales order status — confirm, fulfill, or cancel."
            permission="sales.order.update"
          />
          <Endpoint
            method="GET"
            path="/sales/commissions"
            description="List commission records with filtering and pagination."
            permission="sales.commission.read"
          />
          <Endpoint
            method="PATCH"
            path="/sales/commissions/:id/approve"
            description="Approve a commission record."
            permission="sales.commission.approve"
          />
        </div>
      </Section>

      <NextSteps
        title="Manufacturing API"
        body="BOMs, production orders, batches, and material consumption endpoints."
        links={[
          {
            label: "Manufacturing API",
            href: "/docs/api/manufacturing",
            primary: true,
          },
        ]}
      />
      <Pager
        prev={{ label: "Inventory API", href: "/docs/api/inventory" }}
        next={{ label: "Manufacturing API", href: "/docs/api/manufacturing" }}
      />
    </article>
  );
}
