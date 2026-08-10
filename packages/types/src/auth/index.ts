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
  userDto,
} from "@rona/validation/auth";
import z from "zod";

// Roles types
export type Position = (typeof POSITIONS_LIST)[number];
export type Module = (typeof MODULE_LIST)[number];
export type UserStatus = (typeof USER_STATUS_LIST)[number];

// Sessions
export interface UserRole {
  position: Position;
  modules: Module[];
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  tenantId?: string | undefined;
}

export interface Session {
  user: SessionUser;
  role: UserRole;
  expires: string;
}

// Response types
export interface SignInResponseData {
  tfaEnabled: boolean;
}

// Zod schema types
export type SignInSchema = z.infer<typeof signInSchema>;
export type ResendVerificationCodeSchema = z.infer<
  typeof resendVerificationCodeSchema
>;
export type RegisterSchema = z.infer<typeof registerSchema>;
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

// dtos
export type UserDto = z.infer<typeof userDto>;
