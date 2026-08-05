import z from "zod";
export declare const paginationSearchParamsSchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
    searchQuery: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
