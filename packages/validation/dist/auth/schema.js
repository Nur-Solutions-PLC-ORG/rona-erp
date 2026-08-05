import { z } from "zod";
import { POSITIONS_LIST, MODULE_LIST } from "@rona/config/auth";
export const signInSchema = z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    code: z.string().length(6, "Code must be 6 characters").optional(),
});
export const resendVerificationCodeSchema = z.object({
    email: z.email("Invalid email address"),
});
export const registerSchema = z.object({
    fullName: z.string().min(2, "Full name must be at least 2 characters long"),
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
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
    token: z.string().min(6, "Token must be 6 characters"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
});
