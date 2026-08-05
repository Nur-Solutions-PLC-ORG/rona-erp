import z from "zod";
export declare const userDto: z.ZodObject<{
    id: z.ZodString;
    fullName: z.ZodString;
    email: z.ZodString;
    status: z.ZodEnum<{
        active: "active";
        inactive: "inactive";
        pending_onboarding: "pending_onboarding";
        suspended: "suspended";
    }>;
    tenantId: z.ZodOptional<z.ZodString>;
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
