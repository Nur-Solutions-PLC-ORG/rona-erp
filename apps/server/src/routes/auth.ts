/**
 * Auth routes - Frontend Developer Guide
 * Base path: /auth
 *
 * Usage:
 * - Public routes: No token needed
 * - User routes: Need accessToken in cookies or Authorization header
 * - Admin/Owner routes: Need valid JWT with admin or owner position
 */

// ============================================
// PUBLIC ROUTES (no auth needed)
// ============================================
export const publicAuthRoutes = [
  {
    name: "Get CSRF Token",
    method: "GET",
    path: "/auth/csrf",
    description: "Get CSRF token for form submissions",
    response: `{ "csrfToken": "string" }`,
  },
  {
    name: "Sign In",
    method: "POST",
    path: "/auth/signin",
    description: "Sign in with email and password",
    body: `{
  "email": "user@example.com",
  "password": "your-password"
}`,
    response: `{
  "user": { "id": "uuid", "email": "string", "full_name": "string", "role": "admin|staff|member", "tenant_id": "uuid" },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token"
}`,
    note: "If MFA is enabled, returns { mfa_required: true, email: 'string' } instead",
  },
  {
    name: "Sign In with MFA",
    method: "POST",
    path: "/auth/signin/mfa",
    description: "Complete sign in with MFA code",
    body: `{
  "email": "user@example.com",
  "password": "your-password",
  "code": "123456"
}`,
    response: `{
  "user": { "id": "uuid", "email": "string", "full_name": "string", "role": "string", "tenant_id": "uuid" },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token"
}`,
  },
  {
    name: "Register",
    method: "POST",
    path: "/auth/register",
    description: "Create new account and organization",
    body: `{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "orgName": "My Company"
}`,
    response: `{
  "message": "signup done",
  "user": { "email": "string", "full_name": "string", "role": "admin" }
}`,
    note: "Creates a new organization and makes the user admin of it",
  },
  {
    name: "Send Verification Code",
    method: "POST",
    path: "/auth/send-verification",
    description: "Send email verification code",
    body: `{ "email": "user@example.com" }`,
    response: `{ "success": true, "message": "code sent", "email": "string", "expiresInMinutes": 15 }`,
  },
  {
    name: "Verify Email",
    method: "POST",
    path: "/auth/verify-code",
    description: "Verify email with 6-digit code",
    body: `{
  "email": "user@example.com",
  "code": "123456"
}`,
    response: `{ "success": true, "message": "email verified" }`,
  },
  {
    name: "Sign Out",
    method: "POST",
    path: "/auth/signout",
    description: "Sign out current user",
    body: "{}",
    response: `{ "success": true, "message": "logged out" }`,
    note: "Clears the access token cookie",
  },
  {
    name: "Forgot Password",
    method: "POST",
    path: "/auth/forgot-password",
    description: "Request password reset code",
    body: `{ "email": "user@example.com" }`,
    response: `{ "success": true, "message": "reset code sent" }`,
  },
  {
    name: "Reset Password",
    method: "POST",
    path: "/auth/reset-password",
    description: "Reset password with code",
    body: `{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "NewSecurePass123!"
}`,
    response: `{ "success": true, "message": "password reset done" }`,
  },
  {
    name: "Refresh Token",
    method: "POST",
    path: "/auth/refresh",
    description: "Get new access token",
    body: `{ "refreshToken": "refresh-token-string" }`,
    response: `{ "accessToken": "new-jwt-token", "refreshToken": "new-refresh-token" }`,
  },
  {
    name: "Get Auth Status",
    method: "GET",
    path: "/auth/status",
    description: "Check if user is logged in (from cookie)",
    body: "{}",
    response: `{
  "id": "uuid",
  "email": "string",
  "full_name": "string",
  "status": "active|inactive|suspended|pending_onboarding",
  "is_email_verified": true|false,
  "role": "admin|staff|member",
  "tenant_id": "uuid",
  "company_name": "string"
} | null`,
  },
] as const;

// ============================================
// USER ROUTES (need auth)
// ============================================
export const userAuthRoutes = [
  {
    name: "Get My Profile",
    method: "GET",
    path: "/auth/user",
    description: "Get current user profile",
    body: "{}",
    response: `{
  "user": {
    "id": "uuid",
    "email": "string",
    "full_name": "string",
    "status": "string",
    "is_email_verified": true|false,
    "role": "admin|staff|member",
    "tenant_id": "uuid",
    "company_name": "string"
  }
}`,
  },
  {
    name: "Setup MFA",
    method: "GET",
    path: "/auth/mfa/setup",
    description: "Generate MFA secret (sends code to email)",
    body: "{}",
    response: `{ "success": true, "message": "code sent to your email" }`,
    note: "Use this to start MFA setup, then call /auth/mfa/enable with the code",
  },
  {
    name: "Enable MFA",
    method: "POST",
    path: "/auth/mfa/enable",
    description: "Enable MFA with verification code",
    body: `{ "code": "123456" }`,
    response: `{ "success": true, "message": "mfa enabled" }`,
  },
  {
    name: "Disable MFA",
    method: "POST",
    path: "/auth/mfa/disable",
    description: "Disable MFA with verification code",
    body: `{ "code": "123456" }`,
    response: `{ "success": true, "message": "mfa disabled" }`,
  },
] as const;

// ============================================
// ADMIN/OWNER ROUTES (need admin or owner position)
// ============================================
export const adminAuthRoutes = [
  {
    name: "Get All Users",
    method: "GET",
    path: "/auth/users",
    description: "Get all users in current tenant",
    body: "{}",
    response: `[
  {
    "id": "uuid",
    "email": "string",
    "full_name": "string",
    "status": "string",
    "is_email_verified": true|false,
    "position": "owner|admin|managers|staff",
    "tenant_id": "uuid"
  }
]`,
  },
  {
    name: "Set User Position",
    method: "POST",
    path: "/auth/users/:id/position",
    description: "Change user's position (owner/admin/managers/staff)",
    body: `{ "position": "owner" }`,
    response: `{ "success": true }`,
    note: "Valid positions: owner, admin, managers, staff. Cannot lower your own position.",
  },
  {
    name: "Set User Tenant Role",
    method: "POST",
    path: "/auth/users/:id/tenant-role",
    description: "Change user's tenant role (admin/staff/member)",
    body: `{ "role": "admin" }`,
    response: `{ "success": true }`,
    note: "Valid roles: admin, staff, member. Cannot change your own role.",
  },
] as const;

// All auth routes combined
export const authRoutes = [...publicAuthRoutes, ...userAuthRoutes, ...adminAuthRoutes] as const;
