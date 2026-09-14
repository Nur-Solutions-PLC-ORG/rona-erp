import { AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Callout,
  Card,
  CheckList,
  DocHeader,
  FieldTable,
  H3,
  NextSteps,
  P,
  Pager,
  Section,
  Steps,
} from "../../ui";

export const metadata = {
  title: "Setup",
  description:
    "Create your organization, configure settings, and prepare Rona ERP for operations.",
};

const setupSteps = [
  {
    title: "Create your organization",
    body: "The top-level entity that contains all your data, users, and settings. Each organization is completely isolated from others through row-level security.",
  },
  {
    title: "Configure basic settings",
    body: "Inventory, manufacturing, and sales defaults — page sizes, default warehouse, payment terms — used across every module.",
  },
  {
    title: "Create your first warehouse",
    body: "Warehouses are the physical locations where inventory is stored. You need at least one before receiving or issuing stock.",
  },
  {
    title: "Define units of measure",
    body: "UOMs define how quantities are tracked per item — pieces, kilograms, liters, meters, and more.",
  },
  {
    title: "Create users and roles",
    body: "Invite your team and assign roles. Role-based access control ensures users only see what they need.",
  },
  {
    title: "Configure cost centers",
    body: "Cost centers track expenses by department or project — production, warehouse, quality, administration, sales.",
  },
];

export default function SetupPage() {
  return (
    <article>
      <DocHeader
        eyebrow="Getting Started / 02"
        title="Setting up your workspace"
        lede="Walk through setting up your Rona ERP workspace from scratch — create an organization, configure settings, and prepare the system for day-to-day operations."
        tags={["ORGANIZATION", "WAREHOUSES", "RBAC"]}
      />

      <Section title="Prerequisites">
        <Card tone="ok" shadow>
          <CheckList
            items={[
              "A valid email address for the admin account",
              "Organization name and legal details",
              "Basic understanding of your business operations",
              "Your operational timezone and base currency",
            ]}
          />
        </Card>
      </Section>

      <Section title="The setup path">
        <Steps items={setupSteps} />
      </Section>

      <Section title="Step 1 — Organization details">
        <FieldTable
          label="Organization"
          rows={[
            { field: "Name", description: "Your company or organization name" },
            {
              field: "Domain",
              description: "Optional custom domain for your workspace",
            },
            {
              field: "Timezone",
              description: "Your operational timezone for accurate reporting",
            },
            {
              field: "Currency",
              description:
                "Base currency for financial operations (e.g., ETB, USD)",
            },
            {
              field: "VAT Rate",
              description: "Default VAT percentage (default: 15%)",
            },
            {
              field: "Tax ID",
              description: "Tax identification number for invoices",
            },
          ]}
        />
      </Section>

      <Section title="Step 2 — Module settings">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card title="Inventory" shadow={false}>
            <FieldTable
              label="Config"
              rows={[
                {
                  field: "Default warehouse",
                  description: "Primary warehouse for operations",
                },
                {
                  field: "Page size",
                  description: "Items per page in lists (default: 25)",
                },
                {
                  field: "Money precision",
                  description: "Decimal precision for values (18, 2)",
                },
              ]}
            />
          </Card>
          <Card title="Manufacturing" shadow={false}>
            <FieldTable
              label="Config"
              rows={[
                {
                  field: "Page size",
                  description: "Orders per page (default: 25)",
                },
                {
                  field: "Default yield",
                  description: "Expected yield percentage for new orders",
                },
              ]}
            />
          </Card>
          <Card title="Sales" shadow={false}>
            <FieldTable
              label="Config"
              rows={[
                {
                  field: "Page size",
                  description: "Records per page (default: 25)",
                },
                {
                  field: "Payment terms",
                  description: "Available payment term options",
                },
                {
                  field: "Commission rules",
                  description: "Default commission structures",
                },
              ]}
            />
          </Card>
        </div>
      </Section>

      <Section title="Step 3 — Warehouse configuration">
        <FieldTable
          label="Warehouse"
          rows={[
            {
              field: "Code",
              description:
                "Unique identifier for the warehouse (e.g., MAIN, WH1)",
            },
            {
              field: "Name",
              description:
                "Descriptive name (e.g., Main Warehouse, Distribution Center)",
            },
            { field: "Address", description: "Physical location address" },
            {
              field: "Locations",
              description:
                "Storage locations within the warehouse (e.g., A-01, B-15)",
            },
          ]}
        />
      </Section>

      <Section title="Step 4 — Units of measure">
        <FieldTable
          label="Standard UOMs"
          rows={[
            { field: "EA", description: "Each / piece" },
            { field: "KG", description: "Kilogram" },
            { field: "G", description: "Gram" },
            { field: "L", description: "Liter" },
            { field: "ML", description: "Milliliter" },
            { field: "M", description: "Meter" },
            { field: "CM", description: "Centimeter" },
          ]}
        />
      </Section>

      <Section title="Step 5 — Users and roles">
        <FieldTable
          label="Default roles"
          rows={[
            {
              field: "Admin",
              description: "Full access to all features and settings",
            },
            {
              field: "Manager",
              description: "Access to operational features, no system settings",
            },
            {
              field: "Operator",
              description: "Limited to specific operational tasks",
            },
            {
              field: "Viewer",
              description: "Read-only access to most features",
            },
          ]}
        />
        <Callout
          tone="warn"
          title="Principle of least privilege"
          icon={AlertCircle}
        >
          Only give users the minimum access they need to perform their job
          functions. You can create custom roles with specific permission
          combinations to match your organizational structure — review
          assignments quarterly.
        </Callout>
      </Section>

      <Section title="Step 6 — Cost centers">
        <FieldTable
          label="Common cost centers"
          rows={[
            {
              field: "Production",
              description: "Manufacturing operations costs",
            },
            { field: "Warehouse", description: "Storage and handling costs" },
            { field: "Quality", description: "Inspection and testing costs" },
            {
              field: "Administration",
              description: "Overhead and management costs",
            },
            { field: "Sales", description: "Sales and marketing costs" },
          ]}
        />
      </Section>

      <Section title="Setup complete">
        <Card tone="info">
          <div className="flex items-start gap-3">
            <CheckCircle2
              className="mt-0.5 h-5 w-5 shrink-0 text-[#581c87]"
              strokeWidth={1.5}
            />
            <div>
              <H3>Your workspace is configured and ready</H3>
              <P>
                Next, learn how the dashboard surfaces your operation, then
                create your first items and receive stock.
              </P>
            </div>
          </div>
        </Card>
      </Section>

      <NextSteps
        title="Understand the dashboard"
        body="Your command center — key metrics, real-time alerts, the audit stream, and Rona AI, all in one view."
        links={[
          {
            label: "Dashboard guide",
            href: "/docs/getting-started/dashboard",
            primary: true,
          },
          { label: "First steps", href: "/docs/getting-started/first-steps" },
        ]}
      />
      <Pager
        prev={{
          label: "Introduction",
          href: "/docs/getting-started/introduction",
        }}
        next={{
          label: "First Steps",
          href: "/docs/getting-started/first-steps",
        }}
      />
    </article>
  );
}
