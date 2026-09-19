import { apiClient } from "@/api";
import type { ApiResponse } from "@rona/types/api";
import type {
  KioskFacePunchInput,
  KioskPunchInput,
  KioskPunchResult,
  KioskSession,
  KioskWebAuthnVerifyInput,
  KioskWebAuthnVerifyResult,
} from "@rona/types/kiosk";
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";
import {
  API_KIOSK_ATTENDANCE_URL,
  API_KIOSK_AUTHENTICATE_URL,
  API_KIOSK_FACE_PUNCH_URL,
  API_KIOSK_SIGN_OUT_URL,
  API_KIOSK_WEBAUTHN_AUTH_OPTIONS_URL,
  API_KIOSK_WEBAUTHN_AUTH_VERIFY_URL,
} from "@rona/routes/workspace";

export interface KioskWebAuthnAuthOptionsResult {
  challengeId: string;
  options: PublicKeyCredentialRequestOptionsJSON;
}

export interface KioskWebAuthnVerifyBody
  extends Omit<KioskWebAuthnVerifyInput, "response"> {
  response: AuthenticationResponseJSON;
}

export const postKioskAuthenticate = async (deviceToken: string) => {
  const response = await apiClient.post<ApiResponse<KioskSession>>(
    API_KIOSK_AUTHENTICATE_URL,
    { deviceToken },
  );
  return response.data;
};

export const postKioskWebAuthnAuthOptions = async () => {
  const response = await apiClient.post<
    ApiResponse<KioskWebAuthnAuthOptionsResult>
  >(API_KIOSK_WEBAUTHN_AUTH_OPTIONS_URL);
  return response.data;
};

export const postKioskWebAuthnAuthVerify = async (
  input: KioskWebAuthnVerifyBody,
) => {
  const response = await apiClient.post<ApiResponse<KioskWebAuthnVerifyResult>>(
    API_KIOSK_WEBAUTHN_AUTH_VERIFY_URL,
    input,
  );
  return response.data;
};

export const postKioskAttendance = async (input: KioskPunchInput) => {
  const response = await apiClient.post<ApiResponse<KioskPunchResult>>(
    API_KIOSK_ATTENDANCE_URL,
    input,
  );
  return response.data;
};

export const postKioskFaceAttendance = async (input: KioskFacePunchInput) => {
  const response = await apiClient.post<ApiResponse<KioskPunchResult>>(
    API_KIOSK_FACE_PUNCH_URL,
    input,
  );
  return response.data;
};

export const postKioskSignOut = async () => {
  const response = await apiClient.post<ApiResponse<never>>(
    API_KIOSK_SIGN_OUT_URL,
  );
  return response.data;
};
