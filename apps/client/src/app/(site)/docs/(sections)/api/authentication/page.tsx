import {
  Card,
  CheckList,
  CodeBlock,
  DocHeader,
  Endpoint,
  FieldTable,
  NextSteps,
  P,
  Pager,
  Section,
  Steps,
} from "../../ui";

export const metadata = {
  title: "API Authentication",
  description: "Session cookie authentication for the Rona ERP REST API.",
};

export default function AuthenticationPage() {
  return (
    <article>
      <DocHeader
        eyebrow="API Reference / 01"
        title="API Authentication"
        lede="The Rona ERP API authenticates with an opaque session token stored in an httpOnly cookie. There is no bearer token: the token is set by the server and is never readable by client-side JavaScript."
        tags={["SESSION COOKIE", "HTTPONLY", "14 DAY SESSION"]}
      />

      <Section title="Authentication flow">
        <Steps
          items={[
            { title: "Send credentials to POST /api/auth/sign-in" },
            { title: "The server sets the session_token cookie" },
            {
              title:
                "The browser attaches the cookie to every later request automatically",
            },
            { title: "The session is validated on every request" },
            { title: "The session expires after 14 days" },
          ]}
        />
      </Section>

      <Section title="Sign-in endpoint">
        <CodeBlock
          label="POST /api/auth/sign-in — request"
          code={`{
  "email": "user@example.com",
  "password": "your-password"
}`}
        />
        <CodeBlock
          label="POST /api/auth/sign-in — response"
          code={`{
  "success": true,
  "statusCode": 200,
  "message": "You have signed in successfully.",
  "data": {
    "tfaEnabled": false,
    "mustChangePassword": false
  }
}`}
        />
        <P>
          The session token is returned only in a <strong>Set-Cookie</strong>{" "}
          header, never in the JSON body. The body only tells you whether the
          account needs a password change or two-factor enrolment.
        </P>
      </Section>

      <Section title="Session cookie">
        <FieldTable
          label="Cookie properties"
          rows={[
            { field: "Name", description: "session_token" },
            {
              field: "httpOnly",
              description: "True — not readable from JavaScript",
            },
            {
              field: "secure",
              description: "True in production, false in development",
            },
            {
              field: "sameSite",
              description: "strict in production, lax in development",
            },
            { field: "maxAge", description: "14 days (1209600000 ms)" },
          ]}
        />
        <P>
          Because the cookie is <strong>sameSite=strict</strong>, browsers do
          not attach it to cross-site requests. That is what protects the API
          against cross-site request forgery — no separate CSRF token is
          required.
        </P>
      </Section>

      <Section title="Auth endpoints">
        <div className="grid grid-cols-1 gap-4">
          <Endpoint
            method="POST"
            path="/api/auth/sign-in"
            description="Exchange credentials for a session cookie. Public."
            permission="public"
          />
          <Endpoint
            method="POST"
            path="/api/auth/register"
            description="Create a user account. This is not open registration — it requires an already signed-in super admin."
            permission="super_admin"
          />
          <Endpoint
            method="POST"
            path="/api/auth/forgot-password"
            description="Request a password reset email."
            permission="public"
          />
          <Endpoint
            method="POST"
            path="/api/auth/reset-password"
            description="Complete a password reset with an emailed token."
            permission="public"
          />
          <Endpoint
            method="POST"
            path="/api/auth/resend-verification-code"
            description="Resend an account verification code."
            permission="public"
          />
          <Endpoint
            method="GET"
            path="/api/auth/session"
            description="Return the current session. Used to check whether a cookie is still valid."
            permission="authenticated"
          />
          <Endpoint
            method="POST"
            path="/api/auth/sign-out"
            description="Clear the session cookie."
            permission="authenticated"
          />
          <Endpoint
            method="POST"
            path="/api/auth/change-password"
            description="Set a new password using your email and current password. Authenticates with those credentials, not with the session cookie, so it works while signed out."
            permission="public"
          />
          <Endpoint
            method="GET"
            path="/api/auth/google/url"
            description="Return a Google OAuth authorisation URL to redirect the user to."
            permission="public"
          />
          <Endpoint
            method="GET"
            path="/api/auth/google/callback"
            description="Google redirect target. Exchanges the authorisation code, then sets the session cookie and redirects back to the client."
            permission="public"
          />
        </div>
      </Section>

      <Section title="Google OAuth">
        <Steps
          items={[
            {
              title: "GET /api/auth/google/url to obtain the authorisation URL",
            },
            { title: "Redirect the user to Google" },
            { title: "Google redirects back to /api/auth/google/callback" },
            {
              title:
                "The server exchanges the code and sets the session cookie",
            },
            { title: "The user is redirected back to the client" },
          ]}
        />
      </Section>

      <Section title="Error responses">
        <FieldTable
          label="Status codes"
          rows={[
            {
              field: "401 Unauthorized",
              description: "Missing, expired or invalid session cookie",
            },
            {
              field: "403 Forbidden",
              description:
                "Valid session but the role lacks the required permission",
            },
            {
              field: "400 Bad Request",
              description: "Payload failed schema validation",
            },
          ]}
        />
      </Section>

      <Section title="Best practices">
        <Card tone="info">
          <CheckList
            items={[
              "Send requests with credentials included so the cookie is attached",
              "Do not attempt to read the session token from JavaScript — it is httpOnly by design",
              "Call GET /api/auth/session on load to detect an expired session",
              "Call POST /api/auth/sign-out to end a session explicitly",
              "Use HTTPS for all API calls — the cookie is only marked secure in production",
            ]}
          />
        </Card>
      </Section>

      <NextSteps
        title="Inventory API"
        body="Endpoints for items, stock balances, movements, and every stock operation."
        links={[
          {
            label: "Inventory API",
            href: "/docs/api/inventory",
            primary: true,
          },
        ]}
      />
      <Pager
        prev={{ label: "Tracing", href: "/docs/ai/tracing" }}
        next={{ label: "Inventory API", href: "/docs/api/inventory" }}
      />
    </article>
  );
}
