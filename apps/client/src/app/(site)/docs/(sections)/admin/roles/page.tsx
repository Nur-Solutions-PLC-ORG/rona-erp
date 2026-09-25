import { AlertTriangle } from "lucide-react";
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
  Section,
} from "../../ui";

export const metadata = {
  title: "Roles",
  description:
    "Role-based access control, default roles, and permission structure.",
};

export default function RolesPage() {
  return (
    <article>
      <DocHeader
        eyebrow="Admin & Permissions / 02"
        title="Roles and Permissions"
        lede="Roles and permissions control what users can do in Rona ERP. Role-based access control (RBAC) ensures users only have access to the features they need — following the principle of least privilege."
        tags={["RBAC", "LEAST PRIVILEGE", "CUSTOM ROLES"]}
      />

      <Section title="Key concepts">
        <Card shadow>
          <CheckList
            items={[
              "Roles group permissions together",
              "Users can have multiple roles",
              "Permissions are granular actions (read, create, update, delete)",
              "Permissions are module-specific (e.g., inventory.item.read)",
              "Follow the principle of least privilege",
              "Custom roles can be created for specific needs",
            ]}
            columns={2}
          />
        </Card>
      </Section>

      <Section title="Default roles">
        <div className="grid grid-cols-1 gap-px border border-[#1d3536] bg-[#1d3536] sm:grid-cols-2">
          {[
            {
              name: "Admin",
              body: "Full access to all features and system settings. Can create users, manage roles, and configure organization settings. Limit to trusted personnel.",
              perms: [
                "ALL MODULE PERMISSIONS",
                "USER MANAGEMENT",
                "ORG SETTINGS",
                "AUDIT ACCESS",
              ],
            },
            {
              name: "Manager",
              body: "Full access to operational features but no system administration. Can manage day-to-day operations but cannot change system configuration or user access.",
              perms: [
                "ALL MODULE PERMISSIONS",
                "NO USER MGMT",
                "LIMITED AUDIT",
              ],
            },
            {
              name: "Operator",
              body: "Limited to specific operational tasks. Can perform day-to-day work but cannot make strategic decisions or access sensitive data.",
              perms: ["READ + CREATE", "LIMITED UPDATE", "NO DELETE"],
            },
            {
              name: "Viewer",
              body: "Read-only access to most features. Can view data and reports but cannot make changes — useful for auditors, executives, or external stakeholders.",
              perms: ["READ ONLY", "REPORTS", "DASHBOARDS"],
            },
          ].map((role) => (
            <div key={role.name} className="bg-white p-5 hover:bg-[#f2f3fa]">
              <h3 className="text-[14px] font-semibold text-[#1d3536]">
                {role.name}
              </h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-[#386163]">
                {role.body}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[#d6e8e6] pt-3">
                {role.perms.map((perm) => (
                  <span
                    key={perm}
                    className="border border-[#1d3536] px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-widest text-[#1d3536]"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Permission structure">
        <CodeBlock
          label="Permission format"
          code={`module.entity.action

module    →  which module (inventory, sales, manufacturing, ...)
entity    →  which entity (item, order, batch, ...)
action    →  what action (read, create, update, delete)`}
        />
        <CodeBlock
          label="Examples"
          code={`inventory.item.read           View items
inventory.item.create          Create new items
inventory.item.update          Modify existing items
inventory.item.delete          Delete items
sales.order.read               View sales orders
sales.order.create             Create sales orders
manufacturing.batch.read       View production batches
finance.invoice.issue          Issue invoices`}
        />
      </Section>

      <Section title="Custom roles">
        <P>
          Create custom roles with specific permission combinations when default
          roles do not fit — department-specific roles, external partners with
          limited access, or compliance-driven permission sets.
        </P>
        <FieldTable
          label="Example — Quality Manager"
          rows={[
            {
              field: "Quality module",
              description: "Full permissions (read, create, update, delete)",
            },
            {
              field: "Inventory module",
              description: "Read-only — to view lot status",
            },
            {
              field: "Manufacturing module",
              description: "Read-only — to view batch status",
            },
            { field: "Other modules", description: "No access" },
          ]}
        />
      </Section>

      <Section title="Assigning roles">
        <Card>
          <CheckList
            items={[
              "Assign the minimum roles needed for the job",
              "Review role assignments regularly",
              "Remove roles when job responsibilities change",
              "Document role assignment rationale",
              "Avoid role proliferation (too many custom roles)",
            ]}
          />
        </Card>
        <Callout
          tone="warn"
          title="Principle of least privilege"
          icon={AlertTriangle}
        >
          Always assign the minimum permissions needed for a user to perform
          their job. This reduces security risk and limits the potential impact
          of compromised accounts.
        </Callout>
      </Section>

      <Section title="Permission enforcement">
        <FieldTable
          label="Defense in depth"
          rows={[
            {
              field: "Frontend UI",
              description: "Buttons and forms hidden based on permissions",
            },
            {
              field: "Backend API",
              description: "Controllers check permissions before executing",
            },
            {
              field: "Database",
              description: "Row-level security (RLS) enforces tenant isolation",
            },
          ]}
        />
      </Section>

      <Section title="Auditing role changes">
        <FieldTable
          label="Logged events"
          rows={[
            {
              field: "Role lifecycle",
              description: "Role creation and modification",
            },
            {
              field: "Permissions",
              description: "Permission assignment to roles",
            },
            { field: "Assignment", description: "Role assignment to users" },
            { field: "Removal", description: "Role removal from users" },
            {
              field: "Accountability",
              description: "Who made the change and when",
            },
          ]}
        />
      </Section>

      <NextSteps
        title="Organization settings"
        body="Branding, currency, VAT, branches, and platform configuration."
        links={[
          {
            label: "Organization settings",
            href: "/docs/admin/organization",
            primary: true,
          },
        ]}
      />
      <Pager
        prev={{ label: "Users", href: "/docs/admin/users" }}
        next={{ label: "Organization", href: "/docs/admin/organization" }}
      />
    </article>
  );
}
