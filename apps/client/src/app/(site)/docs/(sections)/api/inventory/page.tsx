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
} from "../../ui";

export const metadata = {
  title: "Inventory API",
  description: "Items, warehouses, lots, reservations, and stock operations.",
};

export default function InventoryPage() {
  return (
    <article>
      <DocHeader
        eyebrow="API Reference / 02"
        title="Inventory API"
        lede="Everything that describes what you stock, where you stock it, and how quantities move. All routes are relative to the API base URL and require a valid session cookie."
        tags={["ITEMS", "STOCK", "WAREHOUSES", "RESERVATIONS"]}
      />

      <Section title="Base URL and authentication">
        <CodeBlock label="Base URL" code={`https://api.rona.pro.et/api`} />
        <P>
          Every endpoint below is shown as a full path including the{" "}
          <code className="font-mono text-[12.5px] text-[#581c87]">/api</code>{" "}
          prefix. Requests must carry the{" "}
          <code className="font-mono text-[12.5px] text-[#581c87]">
            session_token
          </code>{" "}
          cookie — see <a href="/docs/api/authentication">API Authentication</a>
          .
        </P>
      </Section>

      <Section title="Stock operations">
        <P>
          Stock levels are never edited directly. Quantities only change through
          the six movement operations below, and each one writes a stock
          movement record so the history stays auditable.
        </P>
        <div className="grid grid-cols-1 gap-4">
          <Endpoint
            method="GET"
            path="/api/stock"
            description="List current stock balances with pagination and filters."
            permission="inventory.stock.read"
          />
          <Endpoint
            method="GET"
            path="/api/stock/movements"
            description="List the stock movement ledger. Filter by item, warehouse, or movement type."
            permission="inventory.movement.read"
          />
          <Endpoint
            method="GET"
            path="/api/stock/items/:itemId/on-hand"
            description="Return the on-hand quantity for one item, broken down by warehouse and location."
            permission="inventory.stock.read"
          />
          <Endpoint
            method="POST"
            path="/api/stock/receive"
            description="Record incoming stock from a supplier or a return from production."
            permission="inventory.stock.receive"
          />
          <Endpoint
            method="POST"
            path="/api/stock/issue"
            description="Issue stock to a department, customer order, or production batch."
            permission="inventory.stock.issue"
          />
          <Endpoint
            method="POST"
            path="/api/stock/transfer"
            description="Move stock between warehouses or locations without changing total on-hand."
            permission="inventory.stock.transfer"
          />
          <Endpoint
            method="POST"
            path="/api/stock/adjust"
            description="Correct a quantity after a count or a discrepancy. Always record a reason."
            permission="inventory.stock.adjust"
          />
          <Endpoint
            method="POST"
            path="/api/stock/return"
            description="Return previously issued stock back into inventory."
            permission="inventory.stock.return"
          />
        </div>
      </Section>

      <Section title="Adjusting stock">
        <CodeBlock
          label="POST /api/stock/adjust — request"
          code={`{
  "itemId": "uuid",
  "warehouseId": "uuid",
  "locationId": "uuid",
  "quantity": -3,
  "reason": "Cycle count correction"
}`}
        />
        <P>
          Send a positive quantity to increase stock and a negative quantity to
          decrease it. Adjustments are permissioned separately from the other
          movements because they bypass normal stock in and out.
        </P>
      </Section>

      <Section title="Items">
        <div className="grid grid-cols-1 gap-4">
          <Endpoint
            method="GET"
            path="/api/items"
            description="List catalogue items with search, filtering, and pagination."
            permission="inventory.item.read"
          />
          <Endpoint
            method="POST"
            path="/api/items"
            description="Create a catalogue item."
            permission="inventory.item.create"
          />
          <Endpoint
            method="GET"
            path="/api/items/:id"
            description="Return a single item."
            permission="inventory.item.read"
          />
          <Endpoint
            method="PATCH"
            path="/api/items/:id"
            description="Update an item's descriptive or costing fields."
            permission="inventory.item.update"
          />
          <Endpoint
            method="PATCH"
            path="/api/items/:id/archive"
            description="Archive an item. Archived items stay readable but cannot be transacted."
            permission="inventory.item.archive"
          />
          <Endpoint
            method="GET"
            path="/api/items/units-of-measure"
            description="List the available units of measure."
            permission="inventory.item.read"
          />
          <Endpoint
            method="POST"
            path="/api/items/units-of-measure"
            description="Create a unit of measure."
            permission="inventory.item.create"
          />
        </div>
      </Section>

      <Section title="Warehouses and locations">
        <div className="grid grid-cols-1 gap-4">
          <Endpoint
            method="GET"
            path="/api/warehouses"
            description="List warehouses."
            permission="inventory.warehouse.read"
          />
          <Endpoint
            method="POST"
            path="/api/warehouses"
            description="Create a warehouse."
            permission="inventory.warehouse.create"
          />
          <Endpoint
            method="GET"
            path="/api/warehouses/:id"
            description="Return a single warehouse."
            permission="inventory.warehouse.read"
          />
          <Endpoint
            method="PATCH"
            path="/api/warehouses/:id"
            description="Update a warehouse."
            permission="inventory.warehouse.update"
          />
          <Endpoint
            method="GET"
            path="/api/warehouses/:id/locations"
            description="List the storage locations inside a warehouse."
            permission="inventory.warehouse.read"
          />
          <Endpoint
            method="POST"
            path="/api/warehouses/:id/locations"
            description="Create a storage location inside a warehouse."
            permission="inventory.warehouse.create"
          />
          <Endpoint
            method="GET"
            path="/api/warehouses/locations/:id"
            description="Return a single storage location."
            permission="inventory.warehouse.read"
          />
        </div>
      </Section>

      <Section title="Lots and traceability">
        <div className="grid grid-cols-1 gap-4">
          <Endpoint
            method="GET"
            path="/api/lots"
            description="List inventory lots for batch and expiry tracking."
            permission="inventory.lot.read"
          />
          <Endpoint
            method="POST"
            path="/api/lots"
            description="Create a lot with a batch number and optional expiry date."
            permission="inventory.lot.create"
          />
          <Endpoint
            method="GET"
            path="/api/lots/:id"
            description="Return a single lot."
            permission="inventory.lot.read"
          />
          <Endpoint
            method="PATCH"
            path="/api/lots/:id/quality-status"
            description="Change a lot's quality status, for example to hold or release it."
            permission="inventory.lot.update"
          />
        </div>
      </Section>

      <Section title="Reservations">
        <P>
          A reservation holds stock for an order or a production run without
          issuing it, so the quantity is unavailable to other transactions.
        </P>
        <div className="grid grid-cols-1 gap-4">
          <Endpoint
            method="GET"
            path="/api/reservations"
            description="List reservations."
            permission="inventory.reservation.read"
          />
          <Endpoint
            method="POST"
            path="/api/reservations"
            description="Reserve stock for an order or production run."
            permission="inventory.reservation.create"
          />
          <Endpoint
            method="GET"
            path="/api/reservations/:id"
            description="Return a single reservation."
            permission="inventory.reservation.read"
          />
          <Endpoint
            method="POST"
            path="/api/reservations/:id/release"
            description="Release a reservation and return the quantity to available stock."
            permission="inventory.reservation.release"
          />
          <Endpoint
            method="POST"
            path="/api/reservations/:id/consume"
            description="Consume a reservation, converting the held quantity into an issue."
            permission="inventory.reservation.consume"
          />
        </div>
      </Section>

      <Section title="Permissions reference">
        <FieldTable
          label="Inventory permissions"
          rows={[
            {
              field: "inventory.item.*",
              description: "read, create, update, archive on catalogue items",
            },
            {
              field: "inventory.warehouse.*",
              description: "read, create, update on warehouses and locations",
            },
            {
              field: "inventory.lot.*",
              description: "read, create, update on lots and quality status",
            },
            {
              field: "inventory.stock.*",
              description: "read, receive, issue, transfer, adjust, return",
            },
            {
              field: "inventory.movement.read",
              description: "read the stock movement ledger",
            },
            {
              field: "inventory.reservation.*",
              description: "read, create, release, consume on reservations",
            },
          ]}
        />
      </Section>

      <Section title="Good practices">
        <Card tone="info">
          <CheckList
            items={[
              "Query on-hand from GET /api/stock/items/:itemId/on-hand rather than computing from the movement ledger",
              "Give every adjustment a reason so the audit trail stays useful",
              "Release a reservation when an order is cancelled instead of leaving stock held",
              "Use transfer between locations rather than issue plus receive to keep total on-hand unchanged",
              "Check a lot's quality status before issuing from it",
            ]}
          />
        </Card>
      </Section>

      <Pager
        prev={{ label: "API Authentication", href: "/docs/api/authentication" }}
        next={{ label: "Finance API", href: "/docs/api/finance" }}
      />
    </article>
  );
}
