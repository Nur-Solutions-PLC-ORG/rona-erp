import * as z from "zod";

/**
 * Zod validation schema for server status
 */

export const ServerStatusSchema = z.object({
  ok: z.boolean(),
  message: z.string().min(1, "Message s required!"),
});
