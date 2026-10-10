import type { z } from "zod";
import type {
  kioskCreateSchema,
  kioskUpdateSchema,
  kioskListSearchParamsSchema,
  kioskAuthenticateSchema,
  kioskPunchSchema,
  kioskFacePunchSchema,
  kioskWebAuthnAuthVerifySchema,
  faceEnrollSchema,
  kioskDto,
  kioskDeviceInfoSchema,
  kioskDeviceRegisterSchema,
  kioskDeviceSessionSchema,
  kioskDeviceSyncSearchParamsSchema,
  kioskDevicePunchSchema,
  kioskDevicePunchBatchSchema,
  kioskEnrollAuthorizeSchema,
  kioskTemplateEnrollSchema,
  kioskCardBindSchema,
  kioskHeartbeatSchema,
  kioskAdminPinVerifySchema,
  employeeBiometricTemplateDto,
  employeeCardDto,
} from "@rona/validation/kiosk";
import type { AttendanceEventType } from "../hr/index.js";

export type KioskStatus = z.infer<typeof kioskDto>["status"];

export type Kiosk = z.infer<typeof kioskDto>;

export type KioskCreateInput = z.infer<typeof kioskCreateSchema>;
export type KioskUpdateInput = z.infer<typeof kioskUpdateSchema>;
export type KioskListSearchParams = z.infer<typeof kioskListSearchParamsSchema>;
export type KioskAuthenticateInput = z.infer<typeof kioskAuthenticateSchema>;
export type KioskPunchInput = z.infer<typeof kioskPunchSchema>;
export type KioskFacePunchInput = z.infer<typeof kioskFacePunchSchema>;
export type KioskWebAuthnVerifyInput = z.infer<
  typeof kioskWebAuthnAuthVerifySchema
>;
export type FaceEnrollInput = z.infer<typeof faceEnrollSchema>;

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

export interface KioskWebAuthnVerifyResult extends KioskPunchResult {
  employeeId: string;
  credentialId: string;
}

export interface EmployeeFaceMetadata {
  id: string;
  enrolledAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export interface EmployeeFacesResult {
  faces: EmployeeFaceMetadata[];
}

export interface EmployeeFaceEnrollResult {
  face: EmployeeFaceMetadata;
}

export interface EmployeeFaceRevokeResult {
  face: EmployeeFaceMetadata | null;
}

// Native kiosk terminals (Rona Kiosk app)

export type KioskVerificationPolicy = Kiosk["verificationPolicy"];
export type KioskAttestationStatus = Kiosk["attestationStatus"];
export type KioskVerificationMethod = KioskDevicePunchInput["methods"][number];
export type KioskTemplateKind = KioskTemplateEnrollInput["kind"];

export type KioskDeviceInfo = z.infer<typeof kioskDeviceInfoSchema>;
export type KioskDeviceRegisterInput = z.input<
  typeof kioskDeviceRegisterSchema
>;
export type KioskDeviceSessionInput = z.infer<typeof kioskDeviceSessionSchema>;
export type KioskDeviceSyncSearchParams = z.infer<
  typeof kioskDeviceSyncSearchParamsSchema
>;
export type KioskDevicePunchInput = z.infer<typeof kioskDevicePunchSchema>;
export type KioskDevicePunchBatchInput = z.infer<
  typeof kioskDevicePunchBatchSchema
>;
export type KioskEnrollAuthorizeInput = z.infer<
  typeof kioskEnrollAuthorizeSchema
>;
export type KioskTemplateEnrollInput = z.infer<
  typeof kioskTemplateEnrollSchema
>;
export type KioskCardBindInput = z.input<typeof kioskCardBindSchema>;
export type KioskHeartbeatInput = z.infer<typeof kioskHeartbeatSchema>;
export type KioskAdminPinVerifyInput = z.infer<
  typeof kioskAdminPinVerifySchema
>;

export interface KioskDeviceSession {
  sessionToken: string;
  expiresAt: string;
  kiosk: {
    id: string;
    deviceId: string;
    name: string;
    verificationPolicy: KioskVerificationPolicy;
    hasAdminPin: boolean;
  };
  organization: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
}

export interface KioskRosterEntry {
  employeeId: string;
  eid: string;
  fullName: string;
  // false when the employee is inactive or archived: the terminal must refuse punches.
  active: boolean;
  updatedAt: string;
}

export interface KioskRosterResult {
  serverTime: string;
  employees: KioskRosterEntry[];
}

export interface KioskTemplateSyncEntry {
  id: string;
  employeeId: string;
  kind: KioskTemplateKind;
  fingerIndex: number | null;
  algorithmVersion: string;
  // Base64 template; null when revoked (the terminal must delete it).
  template: string | null;
  createdAt: string;
  revokedAt: string | null;
}

export interface KioskTemplateSyncResult {
  serverTime: string;
  templates: KioskTemplateSyncEntry[];
}

export interface KioskCardSyncEntry {
  id: string;
  employeeId: string;
  // sha256 hex of `${organizationId}:${UID_UPPERCASE_HEX}`
  uidHash: string;
  revokedAt: string | null;
}

export interface KioskCardSyncResult {
  serverTime: string;
  cards: KioskCardSyncEntry[];
}

export interface KioskEmployeeStatus {
  employeeId: string;
  employeeName: string;
  currentState: AttendanceEventType | "none";
  allowedNextEvents: AttendanceEventType[];
  lastEventAt: string | null;
}

export interface KioskDevicePunchResult {
  eventId: string;
  clientEventId: string;
  employeeId: string;
  employeeName: string;
  eventType: AttendanceEventType;
  eventAt: string;
  // true when this clientEventId was already recorded (idempotent replay).
  duplicate: boolean;
}

export type KioskDevicePunchBatchItem =
  | { clientEventId: string; status: "RECORDED" | "DUPLICATE"; result: KioskDevicePunchResult }
  | {
      clientEventId: string;
      status: "REJECTED";
      error: { statusCode: number; message: string };
    };

export interface KioskDevicePunchBatchResult {
  results: KioskDevicePunchBatchItem[];
}

export interface KioskEnrollAuthorizeResult {
  enrollToken: string;
  expiresAt: string;
  supervisorName: string;
}

export interface KioskTemplateEnrollResult {
  template: KioskTemplateSyncEntry;
}

export interface KioskCardBindResult {
  card: KioskCardSyncEntry;
}

export interface KioskHeartbeatResult {
  serverTime: string;
  verificationPolicy: KioskVerificationPolicy;
  hasAdminPin: boolean;
}

export interface KioskAdminPinVerifyResult {
  valid: true;
}

export interface KioskEnrollCodeResult {
  code: string;
  expiresAt: string;
}

export type EmployeeBiometricTemplate = z.infer<
  typeof employeeBiometricTemplateDto
>;
export type EmployeeCard = z.infer<typeof employeeCardDto>;

export interface EmployeeCredentialsResult {
  templates: EmployeeBiometricTemplate[];
  cards: EmployeeCard[];
}
