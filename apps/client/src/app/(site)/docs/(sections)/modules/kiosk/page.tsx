import { Monitor, ScanFace, ShieldCheck } from "lucide-react";
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
  Steps,
} from "../../ui";

export const metadata = {
  title: "Kiosk",
  description:
    "Shared-device attendance terminal for clock in, breaks, and clock out.",
};

export default function KioskPage() {
  return (
    <article>
      <DocHeader
        eyebrow="Core Modules / 08"
        title="Kiosk"
        lede="The Kiosk turns any tablet or shared device into a secure attendance terminal. Employees clock in, start breaks, end breaks, and clock out with their employee ID and a short passcode — or with a face scan — no personal login required."
        tags={["ATTENDANCE", "SHARED DEVICE", "FACE RECOGNITION"]}
      />

      <Section title="Key features">
        <Card shadow>
          <CheckList
            items={[
              "Dedicated terminal that runs without a user session",
              "One-time device credential ties the tablet to your organization",
              "Employee ID plus a short numeric passcode",
              "Optional face sign-in powered by FaceIO",
              "Clock in, clock out, break start, and break end",
              "Large touch-friendly actions for shop-floor tablets",
              "Success screen with automatic reset for the next employee",
              "Live status showing whether a device is active",
              "Rate limiting to protect against repeated attempts",
            ]}
            columns={2}
          />
        </Card>
      </Section>

      <Section title="How it works">
        <Steps
          items={[
            {
              title: "Register the device",
              body: "An administrator registers a kiosk in the workspace and receives a device credential that is shown only once.",
            },
            {
              title: "Activate the terminal",
              body: "Open the kiosk terminal on the tablet and enter the device credential once. The device stays signed in until it is deactivated.",
            },
            {
              title: "Employee identifies themselves",
              body: "On the idle screen the employee enters their employee ID and five-digit passcode, or taps “Sign in with Face” and looks at the camera.",
            },
            {
              title: "Choose an attendance action",
              body: "The employee taps Clock In, Clock Out, Start Break, or End Break. The event is recorded against their attendance record.",
            },
            {
              title: "Confirm and reset",
              body: "A success screen shows the employee name, action, and time, then the terminal returns to the idle screen for the next person.",
            },
          ]}
        />
      </Section>

      <Section title="Terminal screens">
        <FieldTable
          label="Screens"
          rows={[
            {
              field: "Setup",
              description:
                "Shown until a valid device credential is entered. Registers the tablet as a kiosk for the organization.",
            },
            {
              field: "Idle",
              description:
                "The main entry screen — employee ID, passcode, or face sign-in, and the four attendance actions, with a live clock.",
            },
            {
              field: "Success",
              description:
                "Confirms the employee name, the action performed, and the recorded time, then resets automatically.",
            },
          ]}
        />
        <Callout tone="info" title="Auto-reset" icon={Monitor}>
          After a successful punch the terminal waits briefly, then clears the
          form so the next employee can step up — no manual sign-out needed.
        </Callout>
      </Section>

      <Section title="Attendance actions">
        <FieldTable
          label="Available actions"
          rows={[
            { field: "CLOCK_IN", description: "The employee starts their work day" },
            { field: "CLOCK_OUT", description: "The employee finishes their work day" },
            { field: "BREAK_START", description: "The employee begins a break" },
            { field: "BREAK_END", description: "The employee returns from a break" },
          ]}
        />
      </Section>

      <Section title="Face sign-in">
        <P>
          Instead of typing an employee ID and passcode, an employee can tap{" "}
          <strong>Sign in with Face</strong>. A face scan is matched against
          the employee’s enrolled facial ID (FaceIO cloud), and the punch is
          recorded the same way as a passcode punch — the terminal never holds
          employee credentials. Each scan is a fresh authentication; there are
          no stored kiosk sessions or shared face tokens.
        </P>
        <FieldTable
          label="Enrollment"
          rows={[
            {
              field: "Enroll",
              description:
                "An HR administrator opens the employee’s Face ID panel from the Employees list and scans the employee’s face once.",
            },
            {
              field: "One active face",
              description:
                "Each employee keeps a single active face; enrolling a new one automatically revokes the previous.",
            },
            {
              field: "Revoke",
              description:
                "An enrolled face can be revoked at any time, which immediately blocks that facial ID at every kiosk.",
            },
            {
              field: "Configuration",
              description:
                "Requires the NEXT_PUBLIC_FACEIO_PUBLIC_ID setting on the terminal build. The face option is hidden when unset.",
            },
          ]}
        />
        <Callout tone="warn" title="Face recognition is not absolute" icon={ScanFace}>
          Facial recognition can be defeated by photos, videos, or identical
          twins, and is not a guarantee of identity. Treat face sign-in as a
          convenience layer, keep passcodes available, and use it where the
          terminal can be supervised. Face data and images are processed and
          stored by the FaceIO cloud service; make employees aware of this
          consent before enrolling them. The FaceIO free tier is limited, so
          plan enrollment capacity for your workforce size.
        </Callout>
      </Section>

      <Section title="Device credentials">
        <FieldTable
          label="Device data"
          rows={[
            { field: "Name", description: "How the kiosk is identified (e.g. Main Gate Tablet)" },
            {
              field: "Device credential",
              description:
                "Issued at registration, shown only once, and stored securely",
            },
            { field: "Status", description: "ACTIVE or INACTIVE" },
            { field: "Registered at", description: "When the device was added" },
            {
              field: "Last seen",
              description: "The last time the device contacted the server",
            },
          ]}
        />
        <Callout tone="warn" title="Store the credential immediately" icon={ShieldCheck}>
          The device credential is displayed a single time when the kiosk is
          registered or rotated. Copy or download it then and enter it on the
          tablet — it cannot be retrieved later. If it is lost, rotate the
          credential to issue a new one.
        </Callout>
      </Section>

      <Section title="Security">
        <Card tone="info">
          <CheckList
            items={[
              "Employees never need a personal login on the shared device",
              "Each punch requires the employee ID and a five-digit passcode (or a face scan)",
              "Every face scan is authenticated against the enrolled facial ID",
              "Enrolled faces can be revoked per employee at any time",
              "Authentication attempts and punches are rate limited",
              "Device sessions expire and can be revoked by deactivating the kiosk",
              "Only administrators with kiosk permissions can manage devices",
            ]}
          />
        </Card>
      </Section>

      <Section title="Permissions">
        <P>
          Managing kiosk devices is governed by role-based access control. A
          role must hold the relevant permission before it can register or
          manage terminals.
        </P>
        <FieldTable
          label="Kiosk permissions"
          rows={[
            { field: "kiosk.read", description: "View kiosk devices" },
            { field: "kiosk.create", description: "Register new kiosk devices" },
            { field: "kiosk.activate", description: "Activate kiosk devices" },
            { field: "kiosk.deactivate", description: "Deactivate kiosk devices" },
          ]}
        />
      </Section>

      <Section title="Best practices">
        <Card tone="info">
          <CheckList
            items={[
              "Name devices by physical location (e.g. Reception, Warehouse A)",
              "Keep the terminal credential out of shared notes and chat",
              "Deactivate any tablet that is lost, replaced, or retired",
              "Mount devices where they can be supervised",
              "Check last-seen regularly to spot offline or misconfigured tablets",
              "Give kiosk management permissions only to administrators who need them",
            ]}
          />
        </Card>
      </Section>

      <NextSteps
        title="Explore workforce"
        body="Employees, attendance, shifts, departments, and positions — the records that every kiosk punch feeds into."
        links={[
          { label: "Workforce module", href: "/docs/modules/workforce", primary: true },
        ]}
      />
      <Pager
        prev={{ label: "Workforce", href: "/docs/modules/workforce" }}
        next={{ label: "Users", href: "/docs/admin/users" }}
      />
    </article>
  );
}
