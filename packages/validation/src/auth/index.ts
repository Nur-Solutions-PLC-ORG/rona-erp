import { z } from "zod";

export const emailSchema = z.string().email({ message: "Invalid email address" });

export const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

export const uuidSchema = z.string().uuid({ message: "Invalid UUID format" });

export const registerValidationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1, "Name is required").max(100),
  tenant_id: uuidSchema,
  role: z.string().optional(),
  eid: z.string().optional(),
  sex: z.string().optional(),
  date_of_birth: z.string().optional(),
  emergency_contacts: z
    .array(
      z
        .object({
          name: z.string().min(1, "Contact name is required"),
          phone: z.string().min(1, "Contact phone is required"),
          relation: z.string().optional(),
        })
        .strict()
    )
    .optional(),
  photo_url: z.string().url({ message: "Invalid photo URL" }).optional(),
});

export type RegisterInput = z.infer<typeof registerValidationSchema>;

export const loginValidationSchema = z.object({
  email: emailSchema.optional(),
  eid: z.string().optional(),
  tenant_id: uuidSchema.optional(),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginValidationSchema>;

export const VerifyEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().min(6, "Code must be 6 digits").max(6),
});

export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;

export const ResendVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type ResendVerificationInput = z.infer<typeof ResendVerificationSchema>;
