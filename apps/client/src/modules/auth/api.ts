import { Request } from "@/api";
import {
  API_AUTH_FORGOT_PASSWORD_URL,
  API_AUTH_GOOGLE_URL,
  API_AUTH_RESEND_VERIFICATION_CODE_URL,
  API_AUTH_RESET_PASSWORD_URL,
  API_AUTH_SESSION_URL,
  API_AUTH_SIGN_IN_URL,
  API_AUTH_SIGN_OUT_URL,
} from "@rona/routes/auth";
import {
  ForgotPasswordSchema,
  ResendVerificationCodeSchema,
  ResetPasswordSchema,
  Session,
  SignInResponseData,
  SignInSchema,
} from "@rona/types/auth";

export const ApiGetGoogleUrl = Request<string>("get", API_AUTH_GOOGLE_URL);

export const ApiPostSignIn = Request<SignInResponseData | never, SignInSchema>(
  "post",
  API_AUTH_SIGN_IN_URL,
);
export const ApiPostResendVerificationCode = Request<
  never,
  ResendVerificationCodeSchema
>("post", API_AUTH_RESEND_VERIFICATION_CODE_URL);
export const ApiPostSignOut = Request("post", API_AUTH_SIGN_OUT_URL);

export const ApiPostForgotPassword = Request<never, ForgotPasswordSchema>(
  "post",
  API_AUTH_FORGOT_PASSWORD_URL,
);
export const ApiPostResetPassword = Request<never, ResetPasswordSchema>(
  "post",
  API_AUTH_RESET_PASSWORD_URL,
);

export const ApiGetSessionStatus = Request<Session>(
  "get",
  API_AUTH_SESSION_URL,
);
