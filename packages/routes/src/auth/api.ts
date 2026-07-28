// HTTP Method: "POST"
export const API_AUTH_SIGN_IN_URL = "/api/auth/sign-in";
/**
 * Request body: { email, password, code? } (SignInSchema)
 * Response: {
 *    success: boolean,
 *    message: string,
 *    data?: SignInResponseData (if tfaEnabled is true, wait for code)
 * }
 */

// HTTP Method: "POST"
export const API_AUTH_REGISTER_URL = "/api/auth/register";
/**
 * Request body: RegisterSchema
 * Response: {
 *    success: boolean,
 *    message: string,
 * }
 */

// HTTP Method: "POST"
export const API_AUTH_SIGN_OUT_URL = "/api/auth/sign-out";
/**
 * Response: {
 *    success: boolean,
 *    message: string,
 * }
 */

// HTTP Method: "GET"
export const API_AUTH_SESSION_URL = "/api/auth/session";
/**
 * Response: {
 *    success: boolean,
 *    message: string,
 *    data: Session
 * }
 */

// HTTP Method: "GET"
export const API_AUTH_GOOGLE_CALLBACK_URL = "/api/auth/google/callback";
/**
 * Note: Redirects to client dashboard or error page
 */

// HTTP Method: "GET"
export const API_AUTH_GOOGLE_URL = "/api/auth/google/url";
/**
 * Response: {
 *    success: boolean,
 *    message: string,
 *    data: string,
 * }
 */

// HTTP Method: "GET"
export const API_AUTH_STATUS_URL = "/api/auth/status";
/**
 * Response: {
 *    success: boolean,
 *    message: string,
 * }
 */
