import { z } from "zod";
import { KIOSK_PASSCODE_LENGTH, KIOSK_STATUS_LIST } from "@rona/config/kiosk";
import { ATTENDANCE_EVENT_TYPE_LIST } from "@rona/config/hr";
import { paginationSearchParamsSchema } from "../global/api.js";

const deviceTokenSchema = z
  .string()
  .trim()
  .min(8, "Device credential must be at least 8 characters")
  .max(128, "Device credential must be at most 128 characters")
  .regex(
    /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
    "Use letters, numbers, dots, dashes or underscores only",
  );

export const kioskCreateSchema = z.object({
  name: z.string().trim().min(1, "Kiosk name is required").max(200),
  deviceToken: deviceTokenSchema.optional(),
});

export const kioskUpdateSchema = z.object({
  name: z.string().trim().min(1, "Kiosk name is required").max(200).optional(),
  deviceToken: deviceTokenSchema.optional(),
});

export const kioskListSearchParamsSchema =
  paginationSearchParamsSchema.extend({
    status: z.enum(KIOSK_STATUS_LIST).optional(),
  });

export const kioskAuthenticateSchema = z.object({
  deviceToken: z.string().trim().min(1).max(512),
});

export const kioskPunchSchema = z.object({
  eid: z.string().trim().min(1, "Employee ID is required").max(50),
  passcode: z
    .string()
    .trim()
    .regex(
      new RegExp(`^\\d{${KIOSK_PASSCODE_LENGTH}}$`),
      `Passcode must be exactly ${KIOSK_PASSCODE_LENGTH} digits`,
    ),
  eventType: z.enum(ATTENDANCE_EVENT_TYPE_LIST),
});
