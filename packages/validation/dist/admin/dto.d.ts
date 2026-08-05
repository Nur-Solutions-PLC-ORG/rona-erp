import z from "zod";
export declare const companyDto: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    slug: z.ZodString;
    email: z.ZodString;
    phone: z.ZodString;
    country: z.ZodString;
    status: z.ZodEnum<{
        active: "active";
        inactive: "inactive";
    }>;
    createdAt: z.ZodString;
}, z.core.$strip>;
export declare const companySettingsDto: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    currency: z.ZodEnum<{
        ETB: "ETB";
        USD: "USD";
    }>;
    createdAt: z.ZodString;
}, z.core.$strip>;
export declare const departmentDto: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    name: z.ZodString;
    module: z.ZodArray<z.ZodString>;
    createdAt: z.ZodString;
}, z.core.$strip>;
export declare const branchDto: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    departmentId: z.ZodString;
    name: z.ZodString;
    createdAt: z.ZodString;
}, z.core.$strip>;
export declare const employeeDto: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    eId: z.ZodString;
    fullName: z.ZodString;
    phone: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    gender: z.ZodEnum<{
        F: "F";
        M: "M";
    }>;
    birthDate: z.ZodString;
    status: z.ZodEnum<{
        active: "active";
        resigned: "resigned";
        suspended: "suspended";
        terminated: "terminated";
    }>;
    createdAt: z.ZodString;
}, z.core.$strip>;
export declare const platformConfigDto: z.ZodObject<{
    id: z.ZodString;
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
    createdAt: z.ZodString;
}, z.core.$strip>;
