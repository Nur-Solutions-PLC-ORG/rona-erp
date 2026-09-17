import type { z } from "zod";
import type {
  kioskCreateSchema,
  kioskUpdateSchema,
  kioskListSearchParamsSchema,
  kioskAuthenticateSchema,
  kioskPunchSchema,
  kioskFacePunchSchema,
  faceEnrollSchema,
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
export type KioskFacePunchInput = z.infer<typeof kioskFacePunchSchema>;
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

export interface KioskFaceDescriptorItem {
  id: string;
  descriptor: number[];
}

export interface KioskFaceDescriptorsResult {
  faces: KioskFaceDescriptorItem[];
}
