// HTTP Method: "POST"
export const API_AUTH_SIGN_IN_URL = "/api/auth/sign-in";
/**
 * Request body: SignInSchema
 * Response: ApiResponseType<SignInResponseData | never>
 */

// HTTP Method: "POST"
export const API_AUTH_RESEND_VERIFICATION_CODE_URL =
  "/api/auth/resend-verification-code";
/**
 * Request body: ResendVerificationCodeSchema
 * Response: ApiResponse<never>
 */

// HTTP Method: "POST"
export const API_AUTH_REGISTER_URL = "/api/auth/register";
/**
 * Request body: RegisterSchema
 * Response: ApiResponse<never>
 */

// HTTP Method: "POST"
export const API_AUTH_SIGN_OUT_URL = "/api/auth/sign-out";
/**
 * Response: ApiResponse<never>
 */

// HTTP Method: "GET"
export const API_AUTH_SESSION_URL = "/api/auth/session";
/**
 * Response: ApiResponse<Session>
 */

// HTTP Method: "GET"
export const API_AUTH_GOOGLE_CALLBACK_URL = "/api/auth/google/callback";
/**
 * Note: Redirects to client dashboard or error page
 */

// HTTP Method: "GET"
export const API_AUTH_GOOGLE_URL = "/api/auth/google/url";
/**
 * Response: ApiResponse<string>
 */

// HTTP Method: "POST"
export const API_AUTH_FORGOT_PASSWORD_URL = "/api/auth/forgot-password";
/**
 * Request body: ForgotPasswordSchema
 * Response: ApiResponse<never>
 */

// HTTP Method: "POST"
export const API_AUTH_RESET_PASSWORD_URL = "/api/auth/reset-password";
/**
 * Request body: ResetPasswordSchema
 * Response: ApiResponse<never>
 */
