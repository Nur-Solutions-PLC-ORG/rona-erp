import * as z from "zod";
/**
 * Zod validation schema for server status
 */
export declare const ServerStatusSchema: z.ZodObject<{
    ok: z.ZodBoolean;
    message: z.ZodString;
}, z.core.$strip>;
