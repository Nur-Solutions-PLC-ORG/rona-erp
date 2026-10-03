import {
  Card,
  CheckList,
  CodeBlock,
  DocHeader,
  FieldTable,
  NextSteps,
  P,
  Pager,
  Section,
} from "../../ui";

export const metadata = {
  title: "Organization",
  description:
    "Organization settings, financial configuration, branches, and platform options.",
};

export default function OrganizationPage() {
  return (
    <article>
      <DocHeader
        eyebrow="Admin & Permissions / 03"
        title="Organization Settings"
        lede="Organization settings configure the top-level parameters that affect your entire Rona ERP instance — basic information, financial settings, and system-wide preferences."
        tags={["BRANDING", "CURRENCY", "VAT", "BRANCHES"]}
      />

      <Section title="Organization information">
        <Card shadow>
          <CheckList
            items={[
              "Organization name and legal details",
              "Contact information and address",
              "Timezone for accurate reporting",
              "Base currency for financial operations",
              "VAT rate configuration",
              "Logo and branding",
            ]}
            columns={2}
          />
        </Card>
      </Section>

      <Section title="Basic settings">
        <FieldTable
          label="Organization details"
          rows={[
            { field: "Name", description: "Your company or organization name" },
            {
              field: "Legal name",
              description: "Official legal entity name (if different)",
            },
            { field: "Tax ID", description: "Tax identification number" },
            { field: "Address", description: "Physical address" },
            { field: "Phone", description: "Contact phone number" },
            { field: "Email", description: "General contact email" },
          ]}
        />
        <FieldTable
          label="Operational settings"
          rows={[
            {
              field: "Timezone",
              description:
                "Your operational timezone — affects reporting timestamps",
            },
            {
              field: "Date format",
              description: "Preferred date display format",
            },
            {
              field: "Language",
              description: "System language (if multi-language is supported)",
            },
          ]}
        />
      </Section>

      <Section title="Financial settings">
        <FieldTable
          label="Currency configuration"
          rows={[
            {
              field: "Base currency",
              description: "Your primary currency (e.g., ETB, USD, EUR)",
            },
            {
              field: "Currency symbol",
              description: "Display symbol (e.g., $, €, Br)",
            },
            {
              field: "Decimal places",
              description: "Number of decimal places for monetary values",
            },
            {
              field: "Thousands separator",
              description: "Character for thousands grouping",
            },
          ]}
        />
        <FieldTable
          label="VAT settings"
          rows={[
            {
              field: "Default VAT rate",
              description: "Standard VAT percentage (default: 15%)",
            },
            {
              field: "VAT registration number",
              description: "Your VAT registration ID",
            },
            {
              field: "VAT inclusive pricing",
              description: "Whether prices include VAT by default",
            },
          ]}
        />
        <CodeBlock
          label="VAT calculation example"
          code={`Subtotal:      $1,000
VAT rate:      15%
VAT amount:    $150
Total:         $1,150`}
        />
      </Section>

      <Section title="Module-specific settings">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card title="Inventory">
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
          <Card title="Manufacturing">
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
          <Card title="Sales">
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
                  field: "Default terms",
                  description: "Default payment term for new orders",
                },
              ]}
            />
          </Card>
        </div>
      </Section>

      <Section title="Branding">
        <FieldTable
          label="Branding options"
          rows={[
            { field: "Logo", description: "Upload your organization logo" },
            { field: "Favicon", description: "Browser tab icon" },
            {
              field: "Primary color",
              description: "Main accent color (default: purple)",
            },
            {
              field: "Custom domain",
              description: "Use your own domain (e.g., erp.yourcompany.com)",
            },
          ]}
        />
      </Section>

      <Section title="Branches">
        <P>
          For multi-location organizations, set up branches to manage different
          facilities within a single organization.
        </P>
        <FieldTable
          label="Branch configuration"
          rows={[
            {
              field: "Branch code",
              description: "Unique identifier (e.g., BR-001)",
            },
            {
              field: "Branch name",
              description: "Descriptive name (e.g., Addis Ababa Branch)",
            },
            { field: "Address", description: "Physical location" },
            { field: "Warehouse", description: "Associated warehouse(s)" },
            { field: "Manager", description: "Branch manager" },
          ]}
        />
      </Section>

      <Section title="Platform configuration">
        <FieldTable
          label="Configuration options"
          rows={[
            {
              field: "Email settings",
              description: "SMTP configuration for notifications",
            },
            { field: "SMS settings", description: "SMS gateway for alerts" },
            {
              field: "Backup schedule",
              description: "Automated backup frequency",
            },
            {
              field: "Retention policy",
              description: "How long to keep audit logs",
            },
            { field: "API rate limits", description: "API request throttling" },
          ]}
        />
      </Section>

      <Section title="Settings audit trail">
        <FieldTable
          label="Logged changes"
          rows={[
            { field: "Organization", description: "Information updates" },
            { field: "Financial", description: "Setting changes" },
            { field: "VAT", description: "Rate modifications" },
            {
              field: "Branches",
              description: "Branch creation and modification",
            },
            {
              field: "Platform",
              description: "Configuration changes — with who and when",
            },
          ]}
        />
      </Section>

      <NextSteps
        title="Audit logs"
        body="Every state change — who did what, when, and exactly what changed."
        links={[
          { label: "Audit logs", href: "/docs/admin/audit", primary: true },
        ]}
      />
      <Pager
        prev={{ label: "Roles", href: "/docs/admin/roles" }}
        next={{ label: "Audit Logs", href: "/docs/admin/audit" }}
      />
    </article>
  );
}
