import { z } from "zod";
import {
  KIOSK_ADMIN_PIN_LENGTH,
  KIOSK_ENROLL_CODE_LENGTH,
  KIOSK_PUNCH_BATCH_MAX,
  KIOSK_TEMPLATE_KIND_LIST,
  KIOSK_TEMPLATE_MAX_BASE64_LENGTH,
  KIOSK_VERIFICATION_METHOD_LIST,
} from "@rona/config/kiosk";
import { ATTENDANCE_EVENT_TYPE_LIST } from "@rona/config/hr";

// Native kiosk terminal (Rona Kiosk app) request schemas.

const base64Schema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[A-Za-z0-9+/_-]+={0,2}$/, "Must be base64 encoded");

const sinceSchema = z.coerce.date().optional();

export const kioskDeviceInfoSchema = z.object({
  manufacturer: z.string().trim().max(100),
  model: z.string().trim().max(100),
  serial: z.string().trim().max(100).optional(),
  androidVersion: z.string().trim().max(20),
  sdkInt: z.number().int().min(1).max(1000),
  appVersion: z.string().trim().max(40),
  engine: z.enum(["SIM", "ZKTECO"]),
  capabilities: z
    .array(z.enum(["FACE", "FINGER", "CARD", "RELAY", "LED", "BUZZER"]))
    .max(10),
});

export const kioskDeviceRegisterSchema = z.object({
  deviceToken: z.string().trim().min(1).max(512),
  // X.509 SubjectPublicKeyInfo (DER, base64) of the Keystore EC P-256 key.
  publicKey: base64Schema.max(1024),
  // Android Key Attestation chain, leaf first (DER certificates, base64).
  attestationChain: z.array(base64Schema.max(8192)).max(10).default([]),
  device: kioskDeviceInfoSchema,
});

export const kioskDeviceSessionSchema = z.object({
  kioskId: z.string().uuid(),
});

export const kioskDeviceSyncSearchParamsSchema = z.object({
  since: sinceSchema,
});

const verificationMethodsSchema = z
  .array(z.enum(KIOSK_VERIFICATION_METHOD_LIST))
  .min(1)
  .max(KIOSK_VERIFICATION_METHOD_LIST.length)
  .refine((methods) => new Set(methods).size === methods.length, {
    message: "Verification methods must be unique",
  });

export const kioskDevicePunchSchema = z.object({
  clientEventId: z.string().uuid(),
  employeeId: z.string().uuid(),
  eventType: z.enum(ATTENDANCE_EVENT_TYPE_LIST),
  methods: verificationMethodsSchema,
  matchScore: z.number().finite().min(0).max(100).optional(),
  cardId: z.string().uuid().optional(),
  deviceEventAt: z.coerce.date(),
});

export const kioskDevicePunchBatchSchema = z.object({
  events: z.array(kioskDevicePunchSchema).min(1).max(KIOSK_PUNCH_BATCH_MAX),
});

export const kioskEnrollAuthorizeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(
      new RegExp(`^\\d{${KIOSK_ENROLL_CODE_LENGTH}}$`),
      `Code must be exactly ${KIOSK_ENROLL_CODE_LENGTH} digits`,
    ),
});

export const kioskTemplateEnrollSchema = z
  .object({
    employeeId: z.string().uuid(),
    kind: z.enum(KIOSK_TEMPLATE_KIND_LIST),
    fingerIndex: z.number().int().min(0).max(9).optional(),
    algorithmVersion: z.string().trim().min(1).max(60),
    template: base64Schema.max(KIOSK_TEMPLATE_MAX_BASE64_LENGTH),
    consentAt: z.coerce.date(),
  })
  .refine(
    (input) =>
      input.kind === "FINGER"
        ? input.fingerIndex !== undefined
        : input.fingerIndex === undefined,
    {
      message: "fingerIndex is required for FINGER and not allowed for FACE",
      path: ["fingerIndex"],
    },
  );

export const kioskCardBindSchema = z.object({
  employeeId: z.string().uuid(),
  // Hex card UID as read by the terminal (normalised to upper case).
  uid: z
    .string()
    .trim()
    .regex(/^[0-9A-Fa-f]{4,64}$/, "Card UID must be hex")
    .transform((uid) => uid.toUpperCase()),
  label: z.string().trim().max(100).optional(),
});

export const kioskHeartbeatSchema = z.object({
  appVersion: z.string().trim().max(40),
  engine: z.enum(["SIM", "ZKTECO"]),
  batteryLevel: z.number().min(0).max(100).optional(),
  charging: z.boolean().optional(),
  queueLength: z.number().int().min(0),
  templateCount: z.number().int().min(0),
  hardware: z.object({
    face: z.enum(["READY", "UNAVAILABLE", "LICENSE_MISSING", "ERROR"]),
    finger: z.enum(["READY", "UNAVAILABLE", "LICENSE_MISSING", "ERROR"]),
    card: z.enum(["READY", "UNAVAILABLE", "ERROR"]),
  }),
  lastError: z.string().trim().max(500).optional(),
});

export const kioskAdminPinVerifySchema = z.object({
  pin: z
    .string()
    .trim()
    .regex(
      new RegExp(`^\\d{${KIOSK_ADMIN_PIN_LENGTH}}$`),
      `PIN must be exactly ${KIOSK_ADMIN_PIN_LENGTH} digits`,
    ),
});
