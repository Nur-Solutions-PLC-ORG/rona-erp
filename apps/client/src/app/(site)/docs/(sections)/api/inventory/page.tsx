import {
  CodeBlock,
  DocHeader,
  Endpoint,
  NextSteps,
  P,
  Pager,
  Section,
} from "../../ui";

export const metadata = {
  title: "Inventory API",
  description:
    "REST endpoints for items, stock balances, movements, and stock operations.",
};

export default function InventoryApiPage() {
  return (
    <article>
      <DocHeader
        eyebrow="API Reference / 02"
        title="Inventory API"
        lede="Endpoints for managing items, warehouses, lots, stock balances, and movements. All endpoints require authentication and appropriate permissions."
        tags={["REST", "JWT", "PAGINATED"]}
      />

      <Section title="Base URL">
        <CodeBlock label="Base" code={`https://api.rona.pro.et/stock`} />
      </Section>

      <Section title="Endpoints">
        <div className="grid grid-cols-1 gap-4">
          <Endpoint
            method="GET"
            path="/stock"
            description="List stock balances with filtering and pagination."
            permission="inventory.stock.read"
          />
          <Endpoint
            method="GET"
            path="/stock/movements"
            description="List stock movements with filtering and pagination."
            permission="inventory.movement.read"
          />
          <Endpoint
            method="GET"
            path="/stock/items/:itemId/on-hand"
            description="Get the on-hand quantity for a specific item."
            permission="inventory.stock.read"
          />
          <Endpoint
            method="POST"
            path="/stock/receive"
            description="Receive stock into a warehouse — creates new lots in quarantine status."
            permission="inventory.stock.receive"
          />
          <Endpoint
            method="POST"
            path="/stock/issue"
            description="Issue stock from a warehouse — decreases the balance."
            permission="inventory.stock.issue"
          />
          <Endpoint
            method="POST"
            path="/stock/transfer"
            description="Transfer stock between locations or warehouses."
            permission="inventory.stock.transfer"
          />
          <Endpoint
            method="POST"
            path="/stock/adjust"
            description="Adjust stock for corrections — requires a reason."
            permission="inventory.stock.adjust"
          />
          <Endpoint
            method="POST"
            path="/stock/return"
            description="Return stock to inventory — increases the balance."
            permission="inventory.stock.return"
          />
        </div>
      </Section>

      <Section title="Example — receive stock">
        <CodeBlock
          label="POST /stock/receive"
          code={`{
  "itemId": "item-123",
  "lotNumber": "LOT-2026-001",
  "quantity": 500,
  "locationId": "loc-main-01",
  "supplier": "Ethio Grain",
  "manufactureDate": "2026-01-10",
  "expiryDate": "2026-07-10"
}`}
        />
        <P>
          The created lot starts in QUARANTINED status — run a quality
          inspection before it can be consumed.
        </P>
      </Section>

      <NextSteps
        title="Sales API"
        body="Customers, sales orders, status transitions, and commissions."
        links={[{ label: "Sales API", href: "/docs/api/sales", primary: true }]}
      />
      <Pager
        prev={{ label: "Authentication", href: "/docs/api/authentication" }}
        next={{ label: "Sales API", href: "/docs/api/sales" }}
      />
    </article>
  );
}
