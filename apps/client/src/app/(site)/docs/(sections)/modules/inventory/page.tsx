import {
  AlertTriangle,
  ArrowUpDown,
  Box,
  PackageCheck,
  Warehouse,
} from "lucide-react";
import {
  Card,
  CheckList,
  DocHeader,
  FieldTable,
  H3,
  NextSteps,
  P,
  Pager,
  Pill,
  Section,
  StatusFlow,
  Steps,
} from "../../ui";

export const metadata = {
  title: "Inventory",
  description:
    "Items, warehouses, lots, stock balances, reservations, and the movement ledger.",
};

const operations = [
  {
    icon: Box,
    title: "Receive stock",
    body: "Add stock to your warehouse from suppliers. Creates new lots with quarantine status.",
    tags: ["NEW LOT", "LEDGER ENTRY"],
  },
  {
    icon: ArrowUpDown,
    title: "Issue stock",
    body: "Remove stock for sales orders, production, or other purposes. Decreases the stock balance.",
    tags: ["CONSUMES LOTS", "REFERENCE"],
  },
  {
    icon: Warehouse,
    title: "Transfer stock",
    body: "Move stock between locations or warehouses. Total balance is maintained; location changes.",
    tags: ["PRESERVES LOT", "FROM/TO"],
  },
  {
    icon: PackageCheck,
    title: "Return stock",
    body: "Return unused materials from production or customer returns. Increases the stock balance.",
    tags: ["REASON", "+BALANCE"],
  },
  {
    icon: AlertTriangle,
    title: "Adjust stock",
    body: "Manual corrections for count discrepancies, damage, or write-offs. Requires a reason.",
    tags: ["AUDIT REASON", "CORRECTIONS"],
  },
];

export default function InventoryPage() {
  return (
    <article>
      <DocHeader
        eyebrow="Core Modules / 01"
        title="Inventory Control"
        lede="The foundation of Rona ERP. It manages items, warehouses, lots, stock balances, and movements with complete traceability — every item tracked at the lot level for precise control and full genealogy from receipt to shipment."
        tags={["MULTI-WAREHOUSE", "LOTS", "LEDGER", "FIFO"]}
      />

      <Section title="Key features">
        <Card shadow>
          <CheckList
            items={[
              "Multi-warehouse support with location tracking",
              "Lot-level inventory with expiry and quality status",
              "Real-time stock balances and reservations",
              "Complete movement ledger for audit trails",
              "FIFO allocation for stock reservations",
              "Automatic low-stock alerts based on reorder points",
              "Stock adjustments for corrections and write-offs",
            ]}
            columns={2}
          />
        </Card>
      </Section>

      <Section title="Items">
        <P>
          Items are the products you manufacture, sell, or use in operations.
          Each item has a unique code, name, type, and unit of measure.
        </P>
        <FieldTable
          label="Item types"
          rows={[
            {
              field: "RAW_MATERIAL",
              description: "Materials used in production (flour, sugar, oil)",
            },
            {
              field: "FINISHED_GOOD",
              description: "Products you manufacture and sell (bread, cakes)",
            },
            {
              field: "CONSUMABLE",
              description:
                "Used but not part of finished goods (packaging, labels)",
            },
          ]}
        />
        <FieldTable
          label="Item fields"
          rows={[
            { field: "Code", description: "Unique SKU (e.g., WF-500)" },
            { field: "Name", description: "Descriptive name" },
            {
              field: "Type",
              description: "RAW_MATERIAL, FINISHED_GOOD, or CONSUMABLE",
            },
            { field: "Unit of measure", description: "KG, EA, L, M, and more" },
            {
              field: "Reorder point",
              description: "Minimum stock before reordering",
            },
            { field: "Reorder quantity", description: "How much to order" },
            { field: "Barcode", description: "Optional, for scanning" },
          ]}
        />
      </Section>

      <Section title="Warehouses and locations">
        <P>
          Warehouses are physical storage locations. Each warehouse can have
          multiple storage locations — bins, shelves, zones — for precise stock
          tracking.
        </P>
        <FieldTable
          label="Structure"
          rows={[
            {
              field: "Warehouse",
              description: "Top-level location (e.g., Main Warehouse)",
            },
            {
              field: "Location",
              description:
                "Storage area within the warehouse (e.g., A-01, Zone B)",
            },
            {
              field: "Stock balance",
              description: "Tracked per item, lot, and location",
            },
          ]}
        />
      </Section>

      <Section title="Lots and quality status">
        <P>
          Lots are groups of items that share the same origin, production date,
          or expiry. Every lot carries its own quality status.
        </P>
        <FieldTable
          label="Lot attributes"
          rows={[
            {
              field: "Lot number",
              description: "Unique identifier (e.g., LOT-2026-001)",
            },
            { field: "Supplier", description: "Who provided the stock" },
            { field: "Receipt date", description: "When it was received" },
            {
              field: "Manufacture date",
              description: "When it was produced (if applicable)",
            },
            { field: "Expiry date", description: "When it expires" },
            {
              field: "Quality status",
              description: "QUARANTINED, APPROVED, or REJECTED",
            },
          ]}
        />
        <StatusFlow steps={["QUARANTINED", "APPROVED", "REJECTED"]} />
        <P>
          New lots start quarantined and cannot be used until inspected.
          Approved lots are available for production and shipment; rejected lots
          are locked permanently.
        </P>
      </Section>

      <Section title="The five stock operations">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {operations.map((op) => (
            <Card key={op.title}>
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center border border-[#581c87] bg-[#f3eefb]">
                  <op.icon
                    className="h-4 w-4 text-[#581c87]"
                    strokeWidth={1.5}
                  />
                </span>
                <H3>{op.title}</H3>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-[#5c4d77]">
                {op.body}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[#e9e2f2] pt-3">
                {op.tags.map((t) => (
                  <span
                    key={t}
                    className="border border-[#581c87] bg-white px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-widest text-[#581c87]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Stock reservations">
        <FieldTable
          label="Reservation benefits"
          rows={[
            {
              field: "FIFO allocation",
              description: "Consumes the oldest lots first to prevent expiry",
            },
            {
              field: "Conflict prevention",
              description:
                "Zero-latency conflict resolution — no double-allocation",
            },
            {
              field: "Visibility",
              description: "See reserved vs available quantities at a glance",
            },
            {
              field: "Automatic",
              description: "Allocations happen when orders are fulfilled",
            },
          ]}
        />
        <Steps
          items={[
            { title: "Create a sales order or production order" },
            { title: "The system checks stock availability" },
            { title: "Stock is reserved using FIFO allocation" },
            { title: "Reserved quantity is locked for that order" },
            { title: "On fulfillment, reserved stock is issued" },
          ]}
        />
      </Section>

      <Section title="The movement ledger">
        <P>
          Every stock movement is recorded with complete details for audit
          trails and traceability:
        </P>
        <FieldTable
          label="Movement record"
          rows={[
            {
              field: "Type",
              description: "RECEIVE, ISSUE, TRANSFER, RETURN, or ADJUST",
            },
            { field: "Item and lot", description: "What was moved" },
            { field: "Quantity", description: "How much" },
            { field: "From / to location", description: "Where it moved" },
            { field: "Reference", description: "Order, batch, or reason" },
            { field: "Performed by", description: "Who made the movement" },
            { field: "Timestamp", description: "When it happened" },
          ]}
        />
      </Section>

      <Section title="Reorder management">
        <Card tone="info" shadow>
          <H3>Reorder logic</H3>
          <div className="mt-3 space-y-2">
            <p className="text-[13.5px] text-[#5c4d77]">
              <strong>Reorder point:</strong> minimum stock level (e.g., 50
              units)
            </p>
            <p className="text-[13.5px] text-[#5c4d77]">
              <strong>Reorder quantity:</strong> order size (e.g., 200 units)
            </p>
            <p className="text-[13.5px] text-[#5c4d77]">
              <strong>Trigger:</strong> when stock ≤ reorder point, the system
              alerts and suggests an order
            </p>
            <p className="text-[13.5px] text-[#5c4d77]">
              <strong>Result:</strong> new total = current stock + reorder
              quantity
            </p>
          </div>
        </Card>
      </Section>

      <Section title="Integration with other modules">
        <FieldTable
          label="Connections"
          rows={[
            {
              field: "Manufacturing",
              description:
                "Material reservations, consumption, and output lot creation",
            },
            {
              field: "Quality",
              description: "Lot quarantine control and inspection gates",
            },
            {
              field: "Sales",
              description: "Stock availability checks and order fulfillment",
            },
            {
              field: "Traceability",
              description: "Lot genealogy across production hops",
            },
            {
              field: "Finance",
              description: "Stock valuation and COGS calculation",
            },
          ]}
        />
        <P>
          A lot moves through your entire operation — and every hop is recorded.
          Status examples: <Pill label="APPROVED" /> after QA,{" "}
          <Pill label="IN_PROGRESS" /> while being consumed by a batch.
        </P>
      </Section>

      <NextSteps
        title="Explore manufacturing"
        body="BOMs, production orders, batches, and yield tracking — where reserved materials become finished goods with full genealogy."
        links={[
          {
            label: "Manufacturing module",
            href: "/docs/modules/manufacturing",
            primary: true,
          },
          { label: "Traceability module", href: "/docs/modules/traceability" },
        ]}
      />
      <Pager
        prev={{ label: "Dashboard", href: "/docs/getting-started/dashboard" }}
        next={{ label: "Sales", href: "/docs/modules/sales" }}
      />
    </article>
  );
}
