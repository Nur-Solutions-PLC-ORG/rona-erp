import { AlertTriangle } from "lucide-react";
import {
  Callout,
  Card,
  CheckList,
  DocHeader,
  FieldTable,
  NextSteps,
  P,
  Pager,
  Pill,
  Section,
} from "../../ui";

export const metadata = {
  title: "Users",
  description: "User accounts, authentication methods, and session management.",
};

export default function UsersPage() {
  return (
    <article>
      <DocHeader
        eyebrow="Admin & Permissions / 01"
        title="Users and Authentication"
        lede="Users are the system accounts that allow people to access Rona ERP. Each user has authentication credentials, roles that determine permissions, and can be linked to employee records."
        tags={["JWT", "RBAC", "SESSIONS"]}
      />

      <Section title="Key concepts">
        <Card shadow>
          <CheckList
            items={[
              "Users have login credentials (email/password or OAuth)",
              "Roles determine what users can do in the system",
              "Permissions are granular actions (read, create, update, delete)",
              "Users can be linked to employee records for HR integration",
              "Multi-factor authentication available for security",
              "Session management with automatic timeout",
            ]}
            columns={2}
          />
        </Card>
      </Section>

      <Section title="User creation">
        <FieldTable
          label="User fields"
          rows={[
            {
              field: "Email",
              description: "Unique email address, used for login",
            },
            {
              field: "Password",
              description: "Secure password, hashed before storage",
            },
            { field: "Name", description: "Display name" },
            {
              field: "Roles",
              description: "One or more roles that grant permissions",
            },
            {
              field: "Employee link",
              description: "Optional link to an employee record",
            },
            { field: "Status", description: "ACTIVE or INACTIVE" },
          ]}
        />
      </Section>

      <Section title="Authentication methods">
        <FieldTable
          label="Supported methods"
          rows={[
            {
              field: "Email / password",
              description: "Traditional username and password",
            },
            {
              field: "Google OAuth",
              description: "Sign in with a Google account",
            },
            {
              field: "Multi-factor",
              description: "Additional security layer (optional)",
            },
          ]}
        />
      </Section>

      <Section title="User status">
        <div className="flex flex-wrap gap-3">
          <Pill label="ACTIVE" />
          <Pill label="INACTIVE" />
        </div>
        <P>
          Inactive users cannot log in, but their data is preserved. Deactivate
          users when an employee leaves, when temporary access is no longer
          needed, or during a security incident requiring account lockout.
        </P>
      </Section>

      <Section title="User–employee link">
        <FieldTable
          label="Link benefits"
          rows={[
            {
              field: "Attendance",
              description: "Attendance records tied to the employee",
            },
            {
              field: "Departments",
              description: "Department-based data access",
            },
            {
              field: "Identity",
              description: "Single source of truth for user identity",
            },
            { field: "Management", description: "Streamlined user management" },
          ]}
        />
      </Section>

      <Section title="Password management">
        <FieldTable
          label="Password security"
          rows={[
            {
              field: "Hashing",
              description: "Passwords are never stored in plain text",
            },
            {
              field: "Minimum length",
              description: "Enforced minimum password length",
            },
            {
              field: "Reset flow",
              description: "Secure password reset via email",
            },
            {
              field: "Session timeout",
              description: "Automatic logout after inactivity",
            },
          ]}
        />
        <Callout
          tone="warn"
          title="Security best practices"
          icon={AlertTriangle}
        >
          <CheckList
            items={[
              "Use strong passwords (minimum 8 characters, mix of types)",
              "Enable multi-factor authentication for sensitive roles",
              "Deactivate users immediately when they leave",
              "Review user access regularly",
              "Apply the principle of least privilege for role assignment",
            ]}
          />
        </Callout>
      </Section>

      <Section title="Session management">
        <FieldTable
          label="Session features"
          rows={[
            {
              field: "Automatic timeout",
              description: "Sessions expire after inactivity",
            },
            {
              field: "Manual logout",
              description: "Users can log out explicitly",
            },
            {
              field: "Session invalidation",
              description: "Admins can invalidate all sessions",
            },
            {
              field: "Remember me",
              description:
                "Optional extended session — not recommended for shared devices",
            },
          ]}
        />
      </Section>

      <Section title="User audit trail">
        <FieldTable
          label="Logged events"
          rows={[
            {
              field: "Lifecycle",
              description: "User creation and modification",
            },
            { field: "Roles", description: "Role assignment changes" },
            {
              field: "Logins",
              description: "Login attempts — successful and failed",
            },
            { field: "Passwords", description: "Password changes" },
            { field: "Sessions", description: "Session invalidation" },
          ]}
        />
      </Section>

      <NextSteps
        title="Roles and permissions"
        body="How RBAC controls what each user can do — default roles, permission format, and least privilege."
        links={[
          {
            label: "Roles & permissions",
            href: "/docs/admin/roles",
            primary: true,
          },
        ]}
      />
      <Pager
        prev={{ label: "Kiosk", href: "/docs/modules/kiosk" }}
        next={{ label: "Roles", href: "/docs/admin/roles" }}
      />
    </article>
  );
}
