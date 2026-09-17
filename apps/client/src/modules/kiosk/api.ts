import { apiClient } from "@/api";
import type { ApiResponse } from "@rona/types/api";
import type {
  KioskFaceDescriptorsResult,
  KioskFacePunchInput,
  KioskPunchInput,
  KioskPunchResult,
  KioskSession,
} from "@rona/types/kiosk";
import {
  API_KIOSK_ATTENDANCE_URL,
  API_KIOSK_AUTHENTICATE_URL,
  API_KIOSK_FACE_DESCRIPTORS_URL,
  API_KIOSK_FACE_PUNCH_URL,
  API_KIOSK_SIGN_OUT_URL,
} from "@rona/routes/workspace";

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

export const postKioskFaceAttendance = async (input: KioskFacePunchInput) => {
  const response = await apiClient.post<ApiResponse<KioskPunchResult>>(
    API_KIOSK_FACE_PUNCH_URL,
    input,
  );
  return response.data;
};

export const getKioskFaceDescriptors = async () => {
  const response = await apiClient.get<ApiResponse<KioskFaceDescriptorsResult>>(
    API_KIOSK_FACE_DESCRIPTORS_URL,
  );
  return response.data;
};

export const postKioskSignOut = async () => {
  const response = await apiClient.post<ApiResponse<never>>(
    API_KIOSK_SIGN_OUT_URL,
  );
  return response.data;
};
