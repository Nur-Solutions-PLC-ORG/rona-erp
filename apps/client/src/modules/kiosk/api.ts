import { apiClient } from "@/api";
import type { ApiResponse } from "@rona/types/api";
import type {
  KioskSession,
  KioskPunchInput,
  KioskPunchResult,
  KioskWebAuthnOptions,
  WebAuthnAuthenticationResult,
} from "@rona/types/kiosk";
import {
  API_KIOSK_ATTENDANCE_URL,
  API_KIOSK_AUTHENTICATE_URL,
  API_KIOSK_SIGN_OUT_URL,
  API_KIOSK_WEBAUTHN_AUTH_OPTIONS_URL,
  API_KIOSK_WEBAUTHN_AUTH_VERIFY_URL,
} from "@rona/routes/workspace";
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";

export const postKioskAuthenticate = async (deviceToken: string) => {
  const response = await apiClient.post<ApiResponse<KioskSession>>(
    API_KIOSK_AUTHENTICATE_URL,
    { deviceToken },
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

export const postKioskSignOut = async () => {
  const response = await apiClient.post<ApiResponse<never>>(
    API_KIOSK_SIGN_OUT_URL,
  );
  return response.data;
};

export const postKioskWebAuthnOptions = async (input: { eid?: string }) => {
  const response = await apiClient.post<
    ApiResponse<KioskWebAuthnOptions<PublicKeyCredentialRequestOptionsJSON>>
  >(API_KIOSK_WEBAUTHN_AUTH_OPTIONS_URL, input);
  return response.data;
};

export const postKioskWebAuthnVerify = async (input: {
  challengeId: string;
  response: AuthenticationResponseJSON;
}) => {
  const response = await apiClient.post<
    ApiResponse<WebAuthnAuthenticationResult>
  >(API_KIOSK_WEBAUTHN_AUTH_VERIFY_URL, input);
  return response.data;
};
