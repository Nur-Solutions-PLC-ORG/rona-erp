/**
 * Google Auth routes - Frontend Developer Guide
 * Base path: /auth/google
 */

export const googleRoutes = [
  {
    name: "Google Login",
    method: "POST",
    path: "/auth/google/login",
    description: "Sign in with Google ID token",
    body: `{ "idToken": "google-id-token-string" }`,
    response: `{
  "user": { "id": "uuid", "email": "string", "full_name": "string", "role": "string", "tenant_id": "uuid" },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token"
}`,
    note: "Get idToken from Google Sign-In button on frontend",
  },
  {
    name: "Get Google Auth URL",
    method: "GET",
    path: "/auth/google/url",
    description: "Get Google OAuth URL for redirect",
    body: "{}",
    response: "Redirects to Google login page",
    note: "Use this if you want server-side OAuth flow instead of popup",
  },
  {
    name: "Google Callback",
    method: "GET",
    path: "/auth/google/callback",
    description: "Google OAuth callback (handles redirect)",
    body: "{}",
    response: "Redirects to frontend with ?success=true or ?error=auth_failed",
    note: "This is handled automatically by Google OAuth flow",
  },
] as const;
