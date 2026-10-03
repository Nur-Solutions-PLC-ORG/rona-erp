import { Request } from "@/api";
import {
  API_HR_ATTENDANCE_SELF_URL,
  API_HR_ATTENDANCE_STATUS_URL,
  API_HR_ATTENDANCE_URL,
  API_HR_DEPARTMENTS_URL,
  API_HR_EMPLOYEE_ARCHIVE_URL,
  API_HR_EMPLOYEE_DETAILS_URL,
  API_HR_EMPLOYEE_RESTORE_URL,
  API_HR_EMPLOYEE_WEBAUTHN_REGISTER_OPTIONS_URL,
  API_HR_EMPLOYEE_WEBAUTHN_REGISTER_VERIFY_URL,
  API_HR_EMPLOYEES_URL,
  API_HR_POSITION_ARCHIVE_URL,
  API_HR_POSITIONS_URL,
  API_HR_POSITION_RESTORE_URL,
  API_HR_SHIFTS_URL,
  API_HR_SHIFT_DETAILS_URL,
} from "@rona/routes/workspace";
import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/browser";
import type {
  AttendanceEvent,
  AttendanceEventType,
  AttendanceManageInput,
  AttendanceSelfInput,
  Department,
  DepartmentCreateInput,
  Employee,
  EmployeeCreateInput,
  EmployeeUpdateInput,
  Position,
  PositionCreateInput,
  Shift,
  ShiftCreateInput,
  ShiftUpdateInput,
  WebAuthnRegistrationVerifyInput,
} from "@rona/types/hr";

export const ApiGetEmployees = Request<Employee[]>("get", API_HR_EMPLOYEES_URL);

export const ApiPostEmployee = Request<Employee, EmployeeCreateInput>(
  "post",
  API_HR_EMPLOYEES_URL,
);

export const ApiPatchEmployee = Request<Employee, EmployeeUpdateInput>(
  "patch",
  API_HR_EMPLOYEE_DETAILS_URL,
);

export const ApiPatchEmployeeArchive = Request<Employee>(
  "patch",
  API_HR_EMPLOYEE_ARCHIVE_URL,
);

export const ApiPatchEmployeeRestore = Request<Employee>(
  "patch",
  API_HR_EMPLOYEE_RESTORE_URL,
);

export const ApiGetAttendanceEvents = Request<AttendanceEvent[]>(
  "get",
  API_HR_ATTENDANCE_URL,
);

export const ApiPostAttendanceSelf = Request<
  AttendanceEvent,
  AttendanceSelfInput
>("post", API_HR_ATTENDANCE_SELF_URL);

export const ApiPostAttendanceManaged = Request<
  AttendanceEvent,
  AttendanceManageInput
>("post", API_HR_ATTENDANCE_URL);

export interface AttendanceSelfStatus {
  employeeId: string;
  currentState: AttendanceEventType | "none";
  lastEvent: AttendanceEvent | null;
}

export const ApiGetAttendanceSelfStatus = Request<AttendanceSelfStatus>(
  "get",
  API_HR_ATTENDANCE_STATUS_URL,
);

export const ApiGetDepartments = Request<Department[]>(
  "get",
  API_HR_DEPARTMENTS_URL,
);

export const ApiPostDepartment = Request<Department, DepartmentCreateInput>(
  "post",
  API_HR_DEPARTMENTS_URL,
);

export const ApiGetPositions = Request<Position[]>(
  "get",
  API_HR_POSITIONS_URL,
);

export const ApiPostPosition = Request<Position, PositionCreateInput>(
  "post",
  API_HR_POSITIONS_URL,
);

export const ApiPatchPositionArchive = Request<Position>(
  "patch",
  API_HR_POSITION_ARCHIVE_URL,
);

export const ApiPatchPositionRestore = Request<Position>(
  "patch",
  API_HR_POSITION_RESTORE_URL,
);

export const ApiGetShifts = Request<Shift[]>("get", API_HR_SHIFTS_URL);

export const ApiPostShift = Request<Shift, ShiftCreateInput>(
  "post",
  API_HR_SHIFTS_URL,
);

export const ApiPatchShift = Request<Shift, ShiftUpdateInput>(
  "patch",
  API_HR_SHIFT_DETAILS_URL,
);

export interface EmployeeWebAuthnRegisterOptionsResult {
  challengeId: string;
  options: PublicKeyCredentialCreationOptionsJSON;
}

export interface EmployeeWebAuthnRegisteredCredential {
  credentialId: string;
  deviceType: string;
  counter: number;
  employeeId: string;
}

export const ApiPostEmployeeWebAuthnRegisterOptions = Request<EmployeeWebAuthnRegisterOptionsResult>(
  "post",
  API_HR_EMPLOYEE_WEBAUTHN_REGISTER_OPTIONS_URL,
);

export const ApiPostEmployeeWebAuthnRegisterVerify = Request<
  EmployeeWebAuthnRegisteredCredential,
  WebAuthnRegistrationVerifyInput
>("post", API_HR_EMPLOYEE_WEBAUTHN_REGISTER_VERIFY_URL);
