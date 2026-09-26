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
  title: "Manufacturing API",
  description: "Bills of materials, production orders, and production batches.",
};

export default function ManufacturingPage() {
  return (
    <article>
      <DocHeader
        eyebrow="API Reference / 05"
        title="Manufacturing API"
        lede="Bills of materials with version control, production orders, and the batches that consume and produce stock. Every route is relative to https://api.rona.pro.et/api and requires a valid session cookie."
        tags={["BOMS", "PRODUCTION ORDERS", "BATCHES"]}
      />

      <Section title="Production flow">
        <Steps
          items={[
            { title: "Define a bill of materials with POST /api/boms" },
            {
              title:
                "Approve a BOM version with POST /api/boms/versions/:versionId/approve before it can be produced",
            },
            {
              title:
                "Raise a production order with POST /api/production-orders",
            },
            {
              title: "Approve it with POST /api/production-orders/:id/approve",
            },
            { title: "Start it with POST /api/production-orders/:id/start" },
            {
              title:
                "Create batches with POST /api/production-orders/:id/batches",
            },
            { title: "Consume materials and record output per batch" },
            {
              title:
                "Complete the order with POST /api/production-orders/:id/complete",
            },
          ]}
        />
        <Card tone="info">
          <p className="text-[13.5px] leading-relaxed text-[#5c4d77]">
            These routes are at the top level:{" "}
            <code className="font-mono text-[12.5px] text-[#581c87]">
              /api/boms
            </code>
            ,{" "}
            <code className="font-mono text-[12.5px] text-[#581c87]">
              /api/production-orders
            </code>
            , and{" "}
            <code className="font-mono text-[12.5px] text-[#581c87]">
              /api/batches
            </code>
            . There is no{" "}
            <code className="font-mono text-[12.5px] text-[#581c87]">
              /api/manufacturing
            </code>{" "}
            prefix.
          </p>
        </Card>
      </Section>

      <Section title="Bills of materials">
        <div className="grid grid-cols-1 gap-4">
          <Endpoint
            method="GET"
            path="/api/boms"
            description="List bills of materials."
            permission="manufacturing.bom.read"
          />
          <Endpoint
            method="POST"
            path="/api/boms"
            description="Create a bill of materials and its first version."
            permission="manufacturing.bom.create"
          />
          <Endpoint
            method="GET"
            path="/api/boms/:id"
            description="Return a single bill of materials."
            permission="manufacturing.bom.read"
          />
          <Endpoint
            method="PATCH"
            path="/api/boms/:id"
            description="Update the descriptive fields of a bill of materials."
            permission="manufacturing.bom.update"
          />
          <Endpoint
            method="GET"
            path="/api/boms/:id/versions"
            description="List the versions of a bill of materials."
            permission="manufacturing.bom.read"
          />
          <Endpoint
            method="POST"
            path="/api/boms/:id/versions"
            description="Create a new version of a bill of materials."
            permission="manufacturing.bom.update"
          />
          <Endpoint
            method="GET"
            path="/api/boms/versions/:versionId"
            description="Return a single BOM version."
            permission="manufacturing.bom.read"
          />
          <Endpoint
            method="GET"
            path="/api/boms/versions/:versionId/lines"
            description="List the component lines of a BOM version."
            permission="manufacturing.bom.read"
          />
          <Endpoint
            method="PATCH"
            path="/api/boms/versions/:versionId/lines"
            description="Update the component lines of a BOM version."
            permission="manufacturing.bom.update"
          />
          <Endpoint
            method="POST"
            path="/api/boms/versions/:versionId/approve"
            description="Approve a BOM version so it can be used in production."
            permission="manufacturing.bom.approve"
          />
          <Endpoint
            method="POST"
            path="/api/boms/versions/:versionId/retire"
            description="Retire a BOM version that is no longer in use."
            permission="manufacturing.bom.approve"
          />
        </div>
      </Section>

      <Section title="Production orders">
        <div className="grid grid-cols-1 gap-4">
          <Endpoint
            method="GET"
            path="/api/production-orders"
            description="List production orders with status and date filters."
            permission="manufacturing.production.read"
          />
          <Endpoint
            method="POST"
            path="/api/production-orders"
            description="Raise a production order against an approved BOM version."
            permission="manufacturing.production.create"
          />
          <Endpoint
            method="GET"
            path="/api/production-orders/:id"
            description="Return a single production order."
            permission="manufacturing.production.read"
          />
          <Endpoint
            method="GET"
            path="/api/production-orders/:id/materials"
            description="List the material requirements exploded from the order's BOM version."
            permission="manufacturing.production.read"
          />
          <Endpoint
            method="POST"
            path="/api/production-orders/:id/approve"
            description="Approve a production order to release it to the floor."
            permission="manufacturing.production.approve"
          />
          <Endpoint
            method="POST"
            path="/api/production-orders/:id/start"
            description="Start an approved production order."
            permission="manufacturing.production.execute"
          />
          <Endpoint
            method="POST"
            path="/api/production-orders/:id/batches"
            description="Create a production batch against a started order."
            permission="manufacturing.production.execute"
          />
          <Endpoint
            method="POST"
            path="/api/production-orders/:id/complete"
            description="Complete a production order once its batches are finished."
            permission="manufacturing.production.execute"
          />
          <Endpoint
            method="POST"
            path="/api/production-orders/:id/cancel"
            description="Cancel a production order."
            permission="manufacturing.production.approve"
          />
        </div>
      </Section>

      <Section title="Production batches">
        <P>
          A batch is one run of a production order. Materials are consumed and
          output is recorded per batch, so a partial run still keeps the stock
          ledger accurate.
        </P>
        <div className="grid grid-cols-1 gap-4">
          <Endpoint
            method="GET"
            path="/api/batches"
            description="List production batches with order and status filters."
            permission="manufacturing.production.read"
          />
          <Endpoint
            method="GET"
            path="/api/batches/:id"
            description="Return a single production batch."
            permission="manufacturing.production.read"
          />
          <Endpoint
            method="GET"
            path="/api/batches/:id/consumptions"
            description="List the materials consumed by a batch."
            permission="manufacturing.production.read"
          />
          <Endpoint
            method="POST"
            path="/api/batches/:id/consume"
            description="Record materials consumed by a batch. Issues the stock."
            permission="manufacturing.production.execute"
          />
          <Endpoint
            method="GET"
            path="/api/batches/:id/outputs"
            description="List the output recorded by a batch."
            permission="manufacturing.production.read"
          />
          <Endpoint
            method="POST"
            path="/api/batches/:id/output"
            description="Record finished goods produced by a batch. Receives the stock."
            permission="manufacturing.production.execute"
          />
          <Endpoint
            method="GET"
            path="/api/batches/:id/returns"
            description="List the returns recorded against a batch."
            permission="manufacturing.production.read"
          />
          <Endpoint
            method="POST"
            path="/api/batches/:id/return"
            description="Record a return from a batch back into inventory."
            permission="manufacturing.production.execute"
          />
          <Endpoint
            method="POST"
            path="/api/batches/:id/complete"
            description="Complete a production batch."
            permission="manufacturing.production.execute"
          />
        </div>
      </Section>

      <Section title="Recording a batch run">
        <CodeBlock
          label="Consume materials"
          code={`POST /api/batches/:id/consume`}
        />
        <CodeBlock
          label="Record output"
          code={`POST /api/batches/:id/output`}
        />
        <P>
          Consuming issues component stock; output receives finished stock. Both
          write to the same movement ledger the Inventory API exposes, so
          production and inventory always agree.
        </P>
      </Section>

      <Section title="Permissions reference">
        <FieldTable
          label="Manufacturing permissions"
          rows={[
            {
              field: "manufacturing.bom.read",
              description: "read bills of materials, versions, and lines",
            },
            {
              field: "manufacturing.bom.create",
              description: "create bills of materials",
            },
            {
              field: "manufacturing.bom.update",
              description: "update bills of materials, versions, and lines",
            },
            {
              field: "manufacturing.bom.approve",
              description: "approve and retire BOM versions",
            },
            {
              field: "manufacturing.production.read",
              description: "read production orders, materials, and batches",
            },
            {
              field: "manufacturing.production.create",
              description: "raise production orders",
            },
            {
              field: "manufacturing.production.approve",
              description: "approve and cancel production orders",
            },
            {
              field: "manufacturing.production.execute",
              description:
                "start orders and consume, output, return, and complete batches",
            },
          ]}
        />
      </Section>

      <Section title="Good practices">
        <Card tone="info">
          <CheckList
            items={[
              "Approve a BOM version before referencing it in a production order",
              "Keep BOM editing and BOM approval with separate roles",
              "Read /api/production-orders/:id/materials to see exploded requirements before starting",
              "Record consumption and output per batch rather than only at order level",
              "Retire superseded BOM versions instead of deleting them",
            ]}
          />
        </Card>
      </Section>

      <Pager
        prev={{ label: "Sales API", href: "/docs/api/sales" }}
        next={{ label: "API Authentication", href: "/docs/api/authentication" }}
      />
    </article>
  );
}
