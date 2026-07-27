import { z } from "zod";

export const platformSettingsSchema = z.object({
  key: z.string().min(1, "Setting key is required"),
  value: z.string().min(1, "Setting value is required"),
});

export type PlatformSettingsInput = z.infer<typeof platformSettingsSchema>;

export const maintenanceModeSchema = z.object({
  enabled: z.boolean(),
  message: z.string().optional(),
});

export type MaintenanceModeInput = z.infer<typeof maintenanceModeSchema>;
