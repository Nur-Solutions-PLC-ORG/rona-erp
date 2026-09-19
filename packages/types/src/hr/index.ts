import type { z } from "zod";
import type {
  attendanceEventDto,
  attendanceListSearchParamsSchema,
  attendanceManageSchema,
  attendanceSelfSchema,
  departmentCreateSchema,
  departmentDto,
  departmentListSearchParamsSchema,
  departmentUpdateSchema,
  employeeCreateSchema,
  employeeDto,
  employeeShiftAssignSchema,
  employeeShiftDto,
  employeeShiftEndSchema,
  employeeUpdateSchema,
  emergencyContactCreateSchema,
  emergencyContactDto,
  emergencyContactUpdateSchema,
  employeeListSearchParamsSchema,
  positionCreateSchema,
  positionDto,
  positionListSearchParamsSchema,
  positionUpdateSchema,
  shiftCreateSchema,
  shiftDto,
  shiftListSearchParamsSchema,
  shiftUpdateSchema,
  webauthnRegistrationVerifySchema,
} from "@rona/validation/hr";

export type AttendanceEventType = z.infer<
  typeof attendanceEventDto
>["eventType"];

export type EmployeeStatus = z.infer<typeof employeeDto>["status"];
export type EmployeeGender = z.infer<typeof employeeDto>["gender"];

export type Department = z.infer<typeof departmentDto>;
export type Position = z.infer<typeof positionDto>;
export type Employee = z.infer<typeof employeeDto>;
export type EmergencyContact = z.infer<typeof emergencyContactDto>;
export type AttendanceEvent = z.infer<typeof attendanceEventDto>;
export type Shift = z.infer<typeof shiftDto>;
export type EmployeeShift = z.infer<typeof employeeShiftDto>;

export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>;
export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>;

export type EmergencyContactCreateInput = z.infer<
  typeof emergencyContactCreateSchema
>;
export type EmergencyContactUpdateInput = z.infer<
  typeof emergencyContactUpdateSchema
>;

export type AttendanceSelfInput = z.infer<typeof attendanceSelfSchema>;
export type AttendanceManageInput = z.infer<typeof attendanceManageSchema>;

export type DepartmentCreateInput = z.infer<typeof departmentCreateSchema>;
export type DepartmentUpdateInput = z.infer<typeof departmentUpdateSchema>;

export type PositionCreateInput = z.infer<typeof positionCreateSchema>;
export type PositionUpdateInput = z.infer<typeof positionUpdateSchema>;

export type ShiftCreateInput = z.infer<typeof shiftCreateSchema>;
export type ShiftUpdateInput = z.infer<typeof shiftUpdateSchema>;

export type EmployeeShiftAssignInput = z.infer<
  typeof employeeShiftAssignSchema
>;
export type EmployeeShiftEndInput = z.infer<typeof employeeShiftEndSchema>;

export type WebAuthnRegistrationVerifyInput = z.infer<
  typeof webauthnRegistrationVerifySchema
>;

export type EmployeeListSearchParams = z.infer<
  typeof employeeListSearchParamsSchema
>;
export type AttendanceListSearchParams = z.infer<
  typeof attendanceListSearchParamsSchema
>;
export type PositionListSearchParams = z.infer<
  typeof positionListSearchParamsSchema
>;
export type DepartmentListSearchParams = z.infer<
  typeof departmentListSearchParamsSchema
>;
export type ShiftListSearchParams = z.infer<typeof shiftListSearchParamsSchema>;

export interface Paginated {
  readonly page: number;
  readonly limit: number;
}

export type EmployeeListParams = EmployeeListSearchParams & Paginated;
export type AttendanceListParams = AttendanceListSearchParams & Paginated;
export type PositionListParams = PositionListSearchParams & Paginated;
export type DepartmentListParams = DepartmentListSearchParams & Paginated;
export type ShiftListParams = ShiftListSearchParams & Paginated;

export interface PaginationMeta {
  readonly page: number;
  readonly limit: number;
  readonly totalItems: number;
  readonly totalPages: number;
}

export interface PaginatedResult<T> {
  readonly data: readonly T[];
  readonly pagination: PaginationMeta;
}
