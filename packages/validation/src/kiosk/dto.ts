import { z } from "zod";
import {
  KIOSK_ATTESTATION_STATUS_LIST,
  KIOSK_STATUS_LIST,
  KIOSK_TEMPLATE_KIND_LIST,
  KIOSK_VERIFICATION_POLICY_LIST,
} from "@rona/config/kiosk";

export const kioskDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  deviceId: z.string(),
  name: z.string(),
  status: z.enum(KIOSK_STATUS_LIST),
  registeredAt: z.date(),
  lastSeenAt: z.date().nullable(),
  verificationPolicy: z.enum(KIOSK_VERIFICATION_POLICY_LIST),
  // Native terminal pairing (Rona Kiosk app). null when never paired.
  pairedAt: z.date().nullable(),
  attestationStatus: z.enum(KIOSK_ATTESTATION_STATUS_LIST),
  appVersion: z.string().nullable(),
  deviceInfo: z
    .object({
      manufacturer: z.string(),
      model: z.string(),
      serial: z.string().optional(),
      androidVersion: z.string(),
      sdkInt: z.number(),
      appVersion: z.string(),
      engine: z.enum(["SIM", "ZKTECO"]),
      capabilities: z.array(z.string()),
    })
    .nullable(),
  lastHeartbeat: z.record(z.string(), z.unknown()).nullable(),
  lastHeartbeatAt: z.date().nullable(),
  hasAdminPin: z.boolean(),
});

export const employeeBiometricTemplateDto = z.object({
  id: z.string(),
  employeeId: z.string(),
  kind: z.enum(KIOSK_TEMPLATE_KIND_LIST),
  fingerIndex: z.number().nullable(),
  algorithmVersion: z.string(),
  enrolledByKioskId: z.string().nullable(),
  enrolledByKioskName: z.string().nullable(),
  enrolledByUserId: z.string().nullable(),
  consentAt: z.date(),
  createdAt: z.date(),
  revokedAt: z.date().nullable(),
});

export const employeeCardDto = z.object({
  id: z.string(),
  employeeId: z.string(),
  label: z.string().nullable(),
  // Last 4 hex characters of the card UID, for recognition in the UI.
  uidSuffix: z.string(),
  createdAt: z.date(),
  revokedAt: z.date().nullable(),
});
