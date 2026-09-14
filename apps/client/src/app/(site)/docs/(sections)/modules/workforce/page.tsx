import { Monitor } from "lucide-react";
import {
  Callout,
  Card,
  CheckList,
  DocHeader,
  FieldTable,
  NextSteps,
  P,
  Pager,
  Section,
} from "../../ui";

export const metadata = {
  title: "Workforce",
  description: "Employees, attendance, shifts, departments, and positions.",
};

export default function WorkforcePage() {
  return (
    <article>
      <DocHeader
        eyebrow="Core Modules / 07"
        title="Workforce"
        lede="The Workforce module manages your employees, attendance, shifts, departments, and positions — the foundation for role-based access control and operational planning."
        tags={["ATTENDANCE", "SHIFTS", "DEPARTMENTS"]}
      />

      <Section title="Key features">
        <Card shadow>
          <CheckList
            items={[
              "Employee directory with contact information",
              "Attendance tracking with check-in/check-out",
              "Shift scheduling and management",
              "Department and position organization",
              "Role-based access control integration",
              "Attendance reports and analytics",
            ]}
            columns={2}
          />
        </Card>
      </Section>

      <Section title="Employees">
        <FieldTable
          label="Employee data"
          rows={[
            { field: "Employee ID", description: "Unique identifier" },
            { field: "Name", description: "Full name" },
            { field: "Email", description: "Work email address" },
            { field: "Phone", description: "Contact number" },
            {
              field: "Department",
              description: "Which department they belong to",
            },
            { field: "Position", description: "Job title or role" },
            { field: "Shift", description: "Assigned shift schedule" },
            { field: "Status", description: "ACTIVE or INACTIVE" },
          ]}
        />
      </Section>

      <Section title="Departments">
        <FieldTable
          label="Common departments"
          rows={[
            { field: "Production", description: "Manufacturing operations" },
            { field: "Warehouse", description: "Inventory management" },
            { field: "Quality", description: "Quality control and inspection" },
            { field: "Sales", description: "Sales and customer service" },
            {
              field: "Finance",
              description: "Accounting and financial operations",
            },
            { field: "Administration", description: "Management and support" },
            { field: "Maintenance", description: "Equipment maintenance" },
          ]}
        />
      </Section>

      <Section title="Positions">
        <FieldTable
          label="Position examples"
          rows={[
            {
              field: "Production Manager",
              description: "Oversees manufacturing operations",
            },
            {
              field: "Machine Operator",
              description: "Operates production equipment",
            },
            {
              field: "Quality Inspector",
              description: "Performs quality inspections",
            },
            {
              field: "Warehouse Clerk",
              description: "Manages stock movements",
            },
            {
              field: "Sales Representative",
              description: "Handles customer orders",
            },
            { field: "Accountant", description: "Manages financial records" },
          ]}
        />
      </Section>

      <Section title="Shifts">
        <FieldTable
          label="Shift configuration"
          rows={[
            {
              field: "Shift name",
              description: "Descriptive name (e.g., Morning Shift)",
            },
            { field: "Start time", description: "When the shift begins" },
            { field: "End time", description: "When the shift ends" },
            {
              field: "Break duration",
              description: "Length of the break period",
            },
            { field: "Work days", description: "Which days of the week" },
          ]}
        />
        <Card tone="info">
          <div className="space-y-1.5 font-mono text-[12.5px] text-[#581c87]">
            <p>Morning Shift · 06:00 – 14:00 · Mon–Fri</p>
            <p>Afternoon Shift · 14:00 – 22:00 · Mon–Fri</p>
            <p>Night Shift · 22:00 – 06:00 · Mon–Fri</p>
            <p>Weekend Shift · 08:00 – 16:00 · Sat–Sun</p>
          </div>
        </Card>
      </Section>

      <Section title="Attendance">
        <FieldTable
          label="Attendance data"
          rows={[
            { field: "Employee", description: "Who clocked in and out" },
            { field: "Date", description: "Which day" },
            { field: "Check-in time", description: "When they arrived" },
            { field: "Check-out time", description: "When they left" },
            { field: "Shift", description: "Assigned shift, for comparison" },
            {
              field: "Status",
              description: "PRESENT, LATE, ABSENT, or EARLY_DEPARTURE",
            },
            { field: "Hours worked", description: "Calculated duration" },
          ]}
        />
      </Section>

      <Section title="Attendance reports">
        <FieldTable
          label="Report types"
          rows={[
            {
              field: "Daily attendance",
              description: "Who was present each day",
            },
            {
              field: "Monthly summary",
              description: "Total hours per employee",
            },
            {
              field: "Lateness report",
              description: "Employees who were late",
            },
            {
              field: "Absence report",
              description: "Employees who missed work",
            },
            {
              field: "Overtime report",
              description: "Hours worked beyond shift",
            },
            {
              field: "Department summary",
              description: "Attendance by department",
            },
          ]}
        />
      </Section>

      <Section title="Integration with access control">
        <P>
          Workforce data integrates with the organization&apos;s role-based
          access control. Employees are linked to users who have system access
          based on their role.
        </P>
        <FieldTable
          label="User–employee relationship"
          rows={[
            {
              field: "User",
              description: "System account with login credentials",
            },
            {
              field: "Employee",
              description: "HR record with employment details",
            },
            {
              field: "Link",
              description: "A user can be linked to an employee record",
            },
            { field: "Role", description: "Determines system permissions" },
            {
              field: "Department",
              description: "Determines data access scope",
            },
          ]}
        />
      </Section>

      <Section title="Kiosk mode">
        <Callout tone="info" title="Shared-device attendance" icon={Monitor}>
          Employees can check in and out from a shared device using their
          employee ID — simple interface, shift display, and live status of who
          is already clocked in.
        </Callout>
      </Section>

      <Section title="Best practices">
        <Card tone="info">
          <CheckList
            items={[
              "Keep employee records up to date",
              "Assign appropriate shifts based on operational needs",
              "Monitor attendance patterns for issues",
              "Use attendance data for productivity analysis",
              "Link employees to users for system access",
              "Regularly review department assignments",
              "Maintain accurate position titles",
            ]}
          />
        </Card>
      </Section>

      <NextSteps
        title="Explore admin & permissions"
        body="Users, roles, organization settings, and the audit log — how workforce data connects to system access control."
        links={[
          {
            label: "Users & authentication",
            href: "/docs/admin/users",
            primary: true,
          },
        ]}
      />
      <Pager
        prev={{ label: "Finance", href: "/docs/modules/finance" }}
        next={{ label: "Users", href: "/docs/admin/users" }}
      />
    </article>
  );
}
