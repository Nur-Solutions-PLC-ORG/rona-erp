import { z } from "zod";
export declare const userListSearchParamsSchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
    searchQuery: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        active: "active";
        inactive: "inactive";
        pending_onboarding: "pending_onboarding";
        suspended: "suspended";
    }>>;
    position: z.ZodOptional<z.ZodEnum<{
        admin: "admin";
        manager: "manager";
        owner: "owner";
        staff: "staff";
        super_admin: "super_admin";
    }>>;
}, z.core.$strip>;
export declare const companyListSearchParamsSchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
    searchQuery: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        active: "active";
        inactive: "inactive";
    }>>;
}, z.core.$strip>;
export declare const employeeListSearchParamsSchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
    searchQuery: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        active: "active";
        resigned: "resigned";
        suspended: "suspended";
        terminated: "terminated";
    }>>;
}, z.core.$strip>;
export declare const departmentListSearchParamsSchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
    searchQuery: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const branchListSearchParamsSchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
    searchQuery: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const configsListSearchParamsSchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
    searchQuery: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const companySettingsListSearchParamsSchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
    searchQuery: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const userSchema: z.ZodObject<{
    fullName: z.ZodString;
    email: z.ZodEmail;
    password: z.ZodString;
    tenantId: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<{
        active: "active";
        inactive: "inactive";
        pending_onboarding: "pending_onboarding";
        suspended: "suspended";
    }>;
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
export declare const companySchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    email: z.ZodEmail;
    phone: z.ZodString;
    country: z.ZodString;
    status: z.ZodEnum<{
        active: "active";
        inactive: "inactive";
    }>;
}, z.core.$strip>;
export declare const companySettingsSchema: z.ZodObject<{
    tenantId: z.ZodOptional<z.ZodString>;
    currency: z.ZodEnum<{
        ETB: "ETB";
        USD: "USD";
    }>;
}, z.core.$strip>;
export declare const departmentSchema: z.ZodObject<{
    tenantId: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    module: z.ZodArray<z.ZodEnum<{
        accounting: "accounting";
        inventory: "inventory";
        payroll: "payroll";
        production: "production";
        sales: "sales";
        workforce: "workforce";
    }>>;
}, z.core.$strip>;
export declare const branchSchema: z.ZodObject<{
    departmentId: z.ZodString;
    name: z.ZodString;
}, z.core.$strip>;
export declare const employeeSchema: z.ZodObject<{
    tenantId: z.ZodString;
    eId: z.ZodString;
    fullName: z.ZodString;
    phone: z.ZodString;
    email: z.ZodUnion<[z.ZodOptional<z.ZodEmail>, z.ZodLiteral<"">]>;
    gender: z.ZodEnum<{
        F: "F";
        M: "M";
    }>;
    birthDate: z.ZodDate;
    status: z.ZodEnum<{
        active: "active";
        resigned: "resigned";
        suspended: "suspended";
        terminated: "terminated";
    }>;
}, z.core.$strip>;
export declare const platformConfigSchema: z.ZodObject<{
    key: z.ZodEnum<{
        contact_email: "contact_email";
        contact_phone: "contact_phone";
        maintenance_mode: "maintenance_mode";
        name: "name";
    }>;
    value: z.ZodString;
    type: z.ZodEnum<{
        boolean: "boolean";
        number: "number";
        string: "string";
    }>;
}, z.core.$strip>;
