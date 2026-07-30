export const API_AUTH_SIGN_IN_URL = "/api/auth/sign-in";
/**
 * Method: "POST"
 * RequestBody: SignInSchema
 * Response: ApiResponseType<SignInResponseData | never>
 */

export const API_AUTH_RESEND_VERIFICATION_CODE_URL =
  "/api/auth/resend-verification-code";
/**
 * Method: "POST"
 * RequestBody: ResendVerificationCodeSchema
 * Response: ApiResponse<never>
 */

export const API_AUTH_REGISTER_URL = "/api/auth/register";
/**
 * Method: "POST"
 * RequestBody: RegisterSchema
 * Response: ApiResponse<never>
 */

export const API_AUTH_SIGN_OUT_URL = "/api/auth/sign-out";
/**
 * Method: "POST"
 * Response: ApiResponse<never>
 */

export const API_AUTH_SESSION_URL = "/api/auth/session";
/**
 * Method: "GET"
 * Response: ApiResponse<Session>
 */

export const API_AUTH_GOOGLE_CALLBACK_URL = "/api/auth/google/callback";
/**
 * Method: "GET"
 * Note: Redirects to client dashboard or error page
 */

export const API_AUTH_GOOGLE_URL = "/api/auth/google/url";
/**
 * Method: "GET"
 * Response: ApiResponse<string>
 */

export const API_AUTH_FORGOT_PASSWORD_URL = "/api/auth/forgot-password";
/**
 * Method: "POST"
 * RequestBody: ForgotPasswordSchema
 * Response: ApiResponse<never>
 */

export const API_AUTH_RESET_PASSWORD_URL = "/api/auth/reset-password";
/**
 * Method: "POST"
 * RequestBody: ResetPasswordSchema
 * Response: ApiResponse<never>
 */
