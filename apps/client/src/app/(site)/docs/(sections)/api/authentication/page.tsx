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
  Steps,
} from "../../ui";

export const metadata = {
  title: "API Authentication",
  description: "JWT authentication for the Rona ERP REST API.",
};

export default function AuthenticationPage() {
  return (
    <article>
      <DocHeader
        eyebrow="API Reference / 01"
        title="API Authentication"
        lede="The Rona ERP API uses JWT (JSON Web Token) authentication for secure access. All endpoints require authentication — except public endpoints like sign-in and password reset."
        tags={["JWT", "BEARER", "24H TOKENS"]}
      />

      <Section title="Authentication flow">
        <Steps
          items={[
            { title: "Send credentials to POST /auth/sign-in" },
            { title: "Receive a JWT token in the response" },
            { title: "Include the token in the Authorization header" },
            { title: "The token is validated on every request" },
            { title: "The token expires after 24 hours by default" },
          ]}
        />
      </Section>

      <Section title="Sign-in endpoint">
        <CodeBlock
          label="POST /auth/sign-in — request"
          code={`{
  "email": "user@example.com",
  "password": "your-password"
}`}
        />
        <CodeBlock
          label="POST /auth/sign-in — response"
          code={`{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}`}
        />
      </Section>

      <Section title="Using the token">
        <Card shadow>
          <p className="font-mono text-[13px] font-semibold text-[#1d3536]">
            Authorization header
          </p>
          <p className="mt-2 border-l-2 border-[#1d3536] bg-[#f2f3fa] px-3 py-2 font-mono text-[12px] text-[#386163]">
            Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
          </p>
        </Card>
      </Section>

      <Section title="Token expiration">
        <FieldTable
          label="Expiration behavior"
          rows={[
            { field: "Default duration", description: "24 hours" },
            { field: "Expiration response", description: "401 Unauthorized" },
            {
              field: "Action",
              description: "Re-authenticate to get a new token",
            },
          ]}
        />
      </Section>

      <Section title="OAuth integration">
        <P>
          Rona ERP supports Google OAuth — users can sign in with their Google
          account.
        </P>
        <Steps
          items={[
            { title: "Redirect to /auth/google/oauth" },
            { title: "The user authenticates with Google" },
            { title: "Google redirects back with an authorization code" },
            { title: "Exchange the code for a JWT token" },
            { title: "Return the token to the client" },
          ]}
        />
      </Section>

      <Section title="Permission checks">
        <P>
          Beyond authentication, the API checks permissions based on the
          user&apos;s roles.
        </P>
        <FieldTable
          label="Error responses"
          rows={[
            {
              field: "401 Unauthorized",
              description: "Missing or invalid token",
            },
            {
              field: "403 Forbidden",
              description: "Valid token but insufficient permissions",
            },
          ]}
        />
      </Section>

      <Section title="Best practices">
        <Card tone="info">
          <CheckList
            items={[
              "Store tokens securely (httpOnly cookies recommended)",
              "Validate token expiration before use",
              "Implement a token refresh flow",
              "Use HTTPS for all API calls",
              "Never expose tokens in client-side code",
              "Log out by clearing the token on the client side",
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
