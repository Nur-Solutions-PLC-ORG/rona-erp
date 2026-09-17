import type { z } from "zod";
import type {
  kioskCreateSchema,
  kioskUpdateSchema,
  kioskListSearchParamsSchema,
  kioskAuthenticateSchema,
  kioskPunchSchema,
  kioskDto,
} from "@rona/validation/kiosk";
import type { AttendanceEventType } from "../hr/index.js";

export type KioskStatus = z.infer<typeof kioskDto>["status"];

export type Kiosk = z.infer<typeof kioskDto>;

export type KioskCreateInput = z.infer<typeof kioskCreateSchema>;
export type KioskUpdateInput = z.infer<typeof kioskUpdateSchema>;
export type KioskListSearchParams = z.infer<typeof kioskListSearchParamsSchema>;
export type KioskAuthenticateInput = z.infer<typeof kioskAuthenticateSchema>;
export type KioskPunchInput = z.infer<typeof kioskPunchSchema>;

export interface Paginated {
  readonly page: number;
  readonly limit: number;
}

export type KioskListParams = KioskListSearchParams & Paginated;

export interface KioskRegistrationResult {
  kiosk: Kiosk;
  deviceToken: string;
}

export interface KioskUpdateResult {
  kiosk: Kiosk;
  deviceToken?: string;
}

export interface KioskSession {
  kioskId: string;
  name: string;
  organizationName: string;
  expiresAt: string;
}

export interface KioskPunchResult {
  employeeName: string;
  eventType: AttendanceEventType;
  eventAt: string;
}

export interface WebAuthnCredentialMetadata {
  id: string;
  deviceName: string;
  deviceType: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export interface KioskWebAuthnOptions<T> {
  challengeId: string;
  options: T;
}

export interface WebAuthnAuthenticationResult {
  employeeName: string;
  expiresAt: string;
}
