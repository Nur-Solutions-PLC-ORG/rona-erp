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
  title: "Sales API",
  description: "Customers, orders, and sales commissions.",
};

export default function SalesPage() {
  return (
    <article>
      <DocHeader
        eyebrow="API Reference / 04"
        title="Sales API"
        lede="Customers and their contacts, sales orders, and the commissions that result from them. Every route is relative to https://api.rona.pro.et/api and requires a valid session cookie."
        tags={["CUSTOMERS", "ORDERS", "COMMISSIONS"]}
      />

      <Section title="Order lifecycle">
        <Steps
          items={[
            { title: "Create the order with POST /api/sales/orders" },
            {
              title:
                "Check availability with GET /api/sales/orders/availability before you commit",
            },
            { title: "Confirm it with POST /api/sales/orders/:id/confirm" },
            { title: "Fulfil it with POST /api/sales/orders/:id/fulfill" },
            {
              title:
                "Cancel it instead with POST /api/sales/orders/:id/cancel if it cannot proceed",
            },
          ]}
        />
        <Card tone="warn">
          <p className="text-[13.5px] leading-relaxed text-[#5c4d77]">
            There is no generic status update endpoint. Confirm, fulfil, and
            cancel are separate POST actions, each with its own permission, so
            an order can never be moved to an arbitrary state.
          </p>
        </Card>
      </Section>

      <Section title="Orders">
        <div className="grid grid-cols-1 gap-4">
          <Endpoint
            method="POST"
            path="/api/sales/orders"
            description="Create a sales order with its line items."
            permission="sales.order.create"
          />
          <Endpoint
            method="GET"
            path="/api/sales/orders"
            description="List sales orders with customer, status, and date filters."
            permission="sales.order.read"
          />
          <Endpoint
            method="GET"
            path="/api/sales/orders/availability"
            description="Report whether the requested items can be supplied, before the order is confirmed."
            permission="sales.order.read"
          />
          <Endpoint
            method="GET"
            path="/api/sales/orders/:id"
            description="Return a single order with its lines and current status."
            permission="sales.order.read"
          />
          <Endpoint
            method="POST"
            path="/api/sales/orders/:id/confirm"
            description="Confirm a draft order and reserve the stock it needs."
            permission="sales.order.confirm"
          />
          <Endpoint
            method="POST"
            path="/api/sales/orders/:id/fulfill"
            description="Fulfil a confirmed order. Issues the reserved stock."
            permission="sales.order.confirm"
          />
          <Endpoint
            method="POST"
            path="/api/sales/orders/:id/cancel"
            description="Cancel an order and release any stock still reserved for it."
            permission="sales.order.cancel"
          />
        </div>
      </Section>

      <Section title="Customers">
        <div className="grid grid-cols-1 gap-4">
          <Endpoint
            method="GET"
            path="/api/sales/customers"
            description="List customers with search and pagination."
            permission="sales.customer.read"
          />
          <Endpoint
            method="POST"
            path="/api/sales/customers"
            description="Create a customer."
            permission="sales.customer.create"
          />
          <Endpoint
            method="GET"
            path="/api/sales/customers/:id"
            description="Return a single customer."
            permission="sales.customer.read"
          />
          <Endpoint
            method="PATCH"
            path="/api/sales/customers/:id"
            description="Update a customer."
            permission="sales.customer.update"
          />
          <Endpoint
            method="POST"
            path="/api/sales/customers/:customerId/contacts"
            description="Add a contact to a customer."
            permission="sales.customer.read + sales.customer.create"
          />
          <Endpoint
            method="PATCH"
            path="/api/sales/customers/contacts/:contactId"
            description="Update one of a customer's contacts."
            permission="sales.customer.update"
          />
          <Endpoint
            method="POST"
            path="/api/sales/customers/:customerId/addresses"
            description="Add an address to a customer."
            permission="sales.customer.read + sales.customer.create"
          />
          <Endpoint
            method="PATCH"
            path="/api/sales/customers/addresses/:addressId"
            description="Update one of a customer's addresses."
            permission="sales.customer.update"
          />
        </div>
      </Section>

      <Section title="Commissions">
        <P>
          Commission rules define how a salesperson earns. They generate
          commission records once orders are fulfilled, and each record is
          approved and then marked as paid.
        </P>
        <div className="grid grid-cols-1 gap-4">
          <Endpoint
            method="GET"
            path="/api/sales/commissions/rules"
            description="List commission rules."
            permission="sales.commission.read"
          />
          <Endpoint
            method="POST"
            path="/api/sales/commissions/rules"
            description="Create a commission rule."
            permission="sales.commission.approve"
          />
          <Endpoint
            method="GET"
            path="/api/sales/commissions/rules/:id"
            description="Return a single commission rule."
            permission="sales.commission.read"
          />
          <Endpoint
            method="PATCH"
            path="/api/sales/commissions/rules/:id"
            description="Update a commission rule."
            permission="sales.commission.approve"
          />
          <Endpoint
            method="GET"
            path="/api/sales/commissions/records"
            description="List earned commission records with salesperson and period filters."
            permission="sales.commission.read"
          />
          <Endpoint
            method="POST"
            path="/api/sales/commissions/records/:id/approve"
            description="Approve an earned commission record for payment."
            permission="sales.commission.approve"
          />
          <Endpoint
            method="POST"
            path="/api/sales/commissions/records/:id/mark-paid"
            description="Mark an approved commission record as paid."
            permission="sales.commission.approve"
          />
        </div>
      </Section>

      <Section title="Fulfilling an order">
        <CodeBlock
          label="POST /api/sales/orders — request"
          code={`{
  "customerId": "uuid",
  "lines": [
    { "itemId": "uuid", "quantity": 5 }
  ]
}`}
        />
        <CodeBlock
          label="POST /api/sales/orders/:id/confirm then /fulfill"
          code={`POST /api/sales/orders/:id/confirm
POST /api/sales/orders/:id/fulfill`}
        />
        <P>
          Confirming reserves the stock; fulfilling issues it. Use{" "}
          <code className="font-mono text-[12.5px] text-[#581c87]">cancel</code>{" "}
          instead of fulfilling if the order cannot be supplied — cancelling
          releases the reservation.
        </P>
      </Section>

      <Section title="Permissions reference">
        <FieldTable
          label="Sales permissions"
          rows={[
            {
              field: "sales.customer.*",
              description:
                "read, create, update on customers, contacts, and addresses",
            },
            {
              field: "sales.order.create",
              description: "create sales orders",
            },
            {
              field: "sales.order.read",
              description: "read orders and check availability",
            },
            {
              field: "sales.order.confirm",
              description: "confirm and fulfil orders",
            },
            {
              field: "sales.order.cancel",
              description: "cancel orders",
            },
            {
              field: "sales.commission.read",
              description: "read commission rules and records",
            },
            {
              field: "sales.commission.approve",
              description: "manage rules, approve records, mark records paid",
            },
          ]}
        />
      </Section>

      <Section title="Good practices">
        <Card tone="info">
          <CheckList
            items={[
              "Check availability before confirming so orders are not confirmed against stock you do not have",
              "Cancel rather than abandon an order, so reserved stock is released",
              "Approve commission records before marking them paid",
              "Create contacts and addresses through the nested customer routes rather than a separate collection",
            ]}
          />
        </Card>
      </Section>

      <Pager
        prev={{ label: "Finance API", href: "/docs/api/finance" }}
        next={{ label: "Manufacturing API", href: "/docs/api/manufacturing" }}
      />
    </article>
  );
}
