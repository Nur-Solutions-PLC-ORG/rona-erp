import { Request } from "@/api";
import {
  API_HR_FACES_URL,
  API_HR_FACE_ENROLL_URL,
  API_HR_FACE_REVOKE_URL,
} from "@rona/routes/workspace";
import type {
  EmployeeFaceEnrollResult,
  EmployeeFaceRevokeResult,
  EmployeeFacesResult,
  FaceEnrollInput,
} from "@rona/types/kiosk";

export const ApiGetSelfFaces = Request<EmployeeFacesResult>("get", API_HR_FACES_URL);

export const ApiPostSelfFaceEnroll = Request<EmployeeFaceEnrollResult, FaceEnrollInput>(
  "post",
  API_HR_FACE_ENROLL_URL,
);

export const ApiPostSelfFaceRevoke = Request<EmployeeFaceRevokeResult>(
  "post",
  API_HR_FACE_REVOKE_URL,
);
