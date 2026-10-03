import { z } from "zod";
import { KIOSK_STATUS_LIST } from "@rona/config/kiosk";

export const kioskDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  deviceId: z.string(),
  name: z.string(),
  status: z.enum(KIOSK_STATUS_LIST),
  registeredAt: z.date(),
  lastSeenAt: z.date().nullable(),
});
