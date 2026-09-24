import { AlertCircle } from "lucide-react";
import {
  Callout,
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
  title: "Sales",
  description:
    "Customers, sales orders, stock availability, and commission tracking.",
};

export default function SalesPage() {
  return (
    <article>
      <DocHeader
        eyebrow="Core Modules / 02"
        title="Sales & Orders"
        lede="The Sales module manages customer relationships, sales orders, and commission tracking. It integrates with inventory for stock availability checks and with finance for invoice generation."
        tags={["CUSTOMERS", "ORDERS", "COMMISSIONS"]}
      />

      <Callout tone="warn" title="Current status" icon={AlertCircle}>
        The sales frontend UI is still being built out. Customer creation and
        sales order creation are fully supported by the backend API but do not
        yet have complete forms — commission management is fully functional in
        the app.
      </Callout>

      <Section title="Customers">
        <P>
          Customers are the entities you sell to. Each customer can have
          multiple contacts and addresses.
        </P>
        <FieldTable
          label="Customer data"
          rows={[
            { field: "Code", description: "Unique customer identifier" },
            { field: "Name", description: "Company or individual name" },
            { field: "Status", description: "ACTIVE or INACTIVE" },
            {
              field: "Contacts",
              description: "Multiple contact persons with phone and email",
            },
            {
              field: "Addresses",
              description: "Billing and shipping addresses",
            },
          ]}
        />
      </Section>

      <Section title="Sales orders">
        <P>
          Sales orders represent commitments to sell products to customers. They
          track status, line items, and link to invoices for payment tracking.
        </P>
        <StatusFlow steps={["DRAFT", "CONFIRMED", "FULFILLING", "FULFILLED"]} />
        <FieldTable
          label="Order components"
          rows={[
            { field: "Order number", description: "Auto-generated unique ID" },
            { field: "Customer", description: "Who is buying" },
            { field: "Order lines", description: "Items, quantities, prices" },
            {
              field: "Payment terms",
              description:
                "IMMEDIATE, NET_7, NET_15, NET_30, NET_60, END_OF_MONTH",
            },
            { field: "Due date", description: "When payment is expected" },
            { field: "Total amount", description: "Sum of line items" },
          ]}
        />
      </Section>

      <Section title="Commissions">
        <P>
          Commissions reward salespeople for their performance. Rules define
          commission structures; records track earned commissions per order.
        </P>
        <FieldTable
          label="Commission rules"
          rows={[
            { field: "Salesperson", description: "Who earns the commission" },
            {
              field: "Commission rate",
              description: "Percentage of sale value",
            },
            {
              field: "Conditions",
              description: "Optional filters (product type, customer, etc.)",
            },
            { field: "Status", description: "ACTIVE or INACTIVE" },
          ]}
        />
        <Steps
          items={[
            { title: "Sales order is fulfilled" },
            { title: "The system calculates the commission based on rules" },
            { title: "A commission record is created with PENDING status" },
            { title: "A manager reviews and approves the commission" },
            { title: "The commission is paid — status changes to PAID" },
          ]}
        />
      </Section>

      <Section title="Order to invoice flow">
        <CodeBlock
          label="Lifecycle"
          code={`DRAFT ─▶ CONFIRMED ─▶ FULFILLED ─▶ INVOICE DRAFT ─▶ ISSUED ─▶ PAID`}
        />
        <P>
          When an order is fulfilled, you can generate an invoice that tracks
          payment and accounts receivable — see the <Pill label="FIN" /> module
          for the complete flow.
        </P>
      </Section>

      <Section title="Stock availability">
        <Card shadow>
          <CheckList
            items={[
              "Real-time stock availability checks before confirmation",
              "Automatic stock reservations on confirmation",
              "FIFO allocation for fair distribution",
              "Backorder handling when stock is insufficient",
            ]}
            columns={2}
          />
        </Card>
      </Section>

      <NextSteps
        title="Explore finance"
        body="Invoices generated from fulfilled orders, payment allocation, and cost centers for true COGS."
        links={[
          {
            label: "Finance module",
            href: "/docs/modules/finance",
            primary: true,
          },
        ]}
      />
      <Pager
        prev={{ label: "Inventory", href: "/docs/modules/inventory" }}
        next={{ label: "Manufacturing", href: "/docs/modules/manufacturing" }}
      />
    </article>
  );
}
