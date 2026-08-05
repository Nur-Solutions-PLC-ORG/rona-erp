import { z } from "zod";
export declare const signInSchema: z.ZodObject<{
    email: z.ZodEmail;
    password: z.ZodString;
    code: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const resendVerificationCodeSchema: z.ZodObject<{
    email: z.ZodEmail;
}, z.core.$strip>;
export declare const registerSchema: z.ZodObject<{
    fullName: z.ZodString;
    email: z.ZodEmail;
    password: z.ZodString;
    tfaEnabled: z.ZodBoolean;
    role: z.ZodObject<{
        position: z.ZodEnum<{
            admin: "admin";
            manager: "manager";
            owner: "owner";
            staff: "staff";
            super_admin: "super_admin";
        }>;
        modules: z.ZodArray<z.ZodEnum<{
            accounting: "accounting";
            inventory: "inventory";
            payroll: "payroll";
            production: "production";
            sales: "sales";
            workforce: "workforce";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodEmail;
}, z.core.$strip>;
export declare const resetPasswordSchema: z.ZodObject<{
    token: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
