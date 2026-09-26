import {
  POSITIONS_LIST,
  MODULE_LIST,
  USER_STATUS_LIST,
} from "@rona/config/auth";
import {
  registerSchema,
  resendVerificationCodeSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  changePasswordSchema,
} from "@rona/validation/auth";
import z from "zod";

export type Position = (typeof POSITIONS_LIST)[number];
export type Module = (typeof MODULE_LIST)[number];
export type UserStatus = (typeof USER_STATUS_LIST)[number];

export interface UserRole {
  position: Position;
  modules: Module[];
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  organizationId?: string | undefined;
}

export interface Session {
  user: SessionUser;
  role: UserRole;
  expires: string;
}

export interface SignInResponseData {
  tfaEnabled: boolean;
  mustChangePassword?: boolean;
  telegramUrl?: string;
}

export interface ForgotPasswordResponseData {
  telegramUrl?: string;
}

export type SignInSchema = z.infer<typeof signInSchema>;
export type ResendVerificationCodeSchema = z.infer<
  typeof resendVerificationCodeSchema
>;
export type RegisterSchema = z.infer<typeof registerSchema>;
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;
