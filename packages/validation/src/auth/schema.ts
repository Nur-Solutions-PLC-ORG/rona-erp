import { z } from "zod";
import { POSITIONS_LIST, MODULE_LIST, PASSWORD_MAX_LENGTH } from "@rona/config/auth";

export const signInSchema = z.object({
  email: z.email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(PASSWORD_MAX_LENGTH, "Password must be at most 128 characters long"),
  code: z.string().length(6, "Code must be 6 characters").optional(),
});

export const resendVerificationCodeSchema = z.object({
  email: z.email("Invalid email address"),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters long"),
  email: z.email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(PASSWORD_MAX_LENGTH, "Password must be at most 128 characters long"),
  tfaEnabled: z.boolean(),
  role: z.object({
    position: z.enum(POSITIONS_LIST),
    modules: z.array(z.enum(MODULE_LIST)),
  }),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  email: z.email("Invalid email address"),
  token: z
    .string()
    .length(6, "Token must be 6 characters")
    .regex(/^\d{6}$/, "Token must be a 6-digit code"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(PASSWORD_MAX_LENGTH, "Password must be at most 128 characters long"),
});

export const changePasswordSchema = z.object({
  email: z.email("Invalid email address"),
  currentPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(PASSWORD_MAX_LENGTH, "Password must be at most 128 characters long"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(PASSWORD_MAX_LENGTH, "Password must be at most 128 characters long"),
});
