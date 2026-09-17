import { z } from "zod";
import { KIOSK_STATUS_LIST } from "@rona/config/kiosk";
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
  eventType: z.enum(ATTENDANCE_EVENT_TYPE_LIST),
}).strict();

const base64urlSchema = z
  .string()
  .min(1)
  .max(65536)
  .regex(/^[A-Za-z0-9_-]+$/);
const credentialEnvelopeSchema = z.object({
  id: base64urlSchema.max(2048),
  rawId: base64urlSchema.max(2048),
  type: z.literal("public-key"),
  authenticatorAttachment: z
    .enum(["platform", "cross-platform"])
    .nullable()
    .optional(),
  clientExtensionResults: z.record(z.string(), z.unknown()),
  response: z.object({}).loose(),
});

export const webauthnAuthenticationOptionsSchema = z.object({
  eid: z.string().trim().min(1).max(50).optional(),
}).strict();

export const webauthnRegistrationOptionsSchema = z.object({
  deviceName: z.string().trim().min(1).max(100),
}).strict();

export const webauthnAuthenticationVerifySchema = z.object({
  challengeId: z.string().uuid(),
  response: credentialEnvelopeSchema.extend({
    response: z
      .object({
        clientDataJSON: base64urlSchema,
        authenticatorData: base64urlSchema,
        signature: base64urlSchema,
        userHandle: base64urlSchema.max(128).nullable().optional(),
      })
      .loose(),
  }),
}).strict();

export const webauthnRegistrationVerifySchema = z.object({
  challengeId: z.string().uuid(),
  response: credentialEnvelopeSchema.extend({
    response: z
      .object({
        clientDataJSON: base64urlSchema,
        attestationObject: base64urlSchema,
        transports: z.array(z.string().max(32)).max(10).optional(),
      })
      .loose(),
  }),
}).strict();
