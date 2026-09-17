import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TryCatchNullWrap } from "@/api";
import { usePermissions } from "@/modules/workspace/hooks";
import { useCreateMutation } from "@/hooks/utils";
import type { ApiResponse, ResponseMeta } from "@rona/types/api";
import type { Permission } from "@rona/types/tenancy";
import type { AttendanceEvent, AttendanceEventType } from "@rona/types/hr";
import type {
  EmployeeFaceEnrollResult,
  EmployeeFaceRevokeResult,
  EmployeeFacesResult,
} from "@rona/types/kiosk";
import {
  ApiGetAttendanceEvents,
  ApiGetAttendanceSelfStatus,
  ApiGetDepartments,
  ApiGetEmployeeFaces,
  ApiGetEmployees,
  ApiGetPositions,
  ApiGetShifts,
  ApiPatchEmployeeArchive,
  ApiPatchEmployeeRestore,
  ApiPatchEmployee,
  ApiPatchPositionArchive,
  ApiPatchPositionRestore,
  ApiPatchShift,
  ApiPostAttendanceManaged,
  ApiPostAttendanceSelf,
  ApiPostDepartment,
  ApiPostEmployee,
  ApiPostEmployeeFaceEnroll,
  ApiPostEmployeeFaceRevoke,
  ApiPostPosition,
  ApiPostShift,
} from "./api";
import type {
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
} from "@rona/types/hr";

const WORKFORCE_PAGE_SIZE = 25;
const LOOKUP_PAGE_SIZE = 100;

function useWorkforceQuery<TDto>(
  permission: Permission,
  queryKey: unknown[],
  queryFn: () => Promise<ApiResponse<TDto[]> | null>,
) {
  const { hasPermission } = usePermissions();

  return useQuery({
    queryKey,
    queryFn,
    enabled: hasPermission(permission),
  });
}

export interface EmployeeFilters {
  status?: string;
  departmentId?: string;
  includeArchived?: boolean;
  searchQuery?: string;
}

export const useEmployees = (page: number, filters: EmployeeFilters = {}) => {
  const query = useWorkforceQuery(
    "hr.employee.read",
    [
      "hr-employees",
      page,
      filters.status,
      filters.departmentId,
      filters.includeArchived,
      filters.searchQuery ?? "",
    ],
    TryCatchNullWrap(() =>
      ApiGetEmployees({
        searchParams: {
          page,
          limit: WORKFORCE_PAGE_SIZE,
          status: filters.status,
          departmentId: filters.departmentId,
          includeArchived: filters.includeArchived ? "true" : undefined,
          searchQuery: filters.searchQuery || undefined,
        },
      }),
    ),
  );

  return {
    employees: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
  };
};

export const useEmployeeLookup = () => {
  const query = useWorkforceQuery(
    "hr.employee.read",
    ["hr-employees-lookup"],
    TryCatchNullWrap(() =>
      ApiGetEmployees({
        searchParams: { limit: LOOKUP_PAGE_SIZE, includeArchived: "true" },
      }),
    ),
  );

  const employees = useMemo(
    () => query.data?.data ?? [],
    [query.data],
  );

  const nameLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const employee of employees) {
      map.set(employee.id, `${employee.eId} — ${employee.fullName}`);
    }
    return map;
  }, [employees]);

  return {
    employees,
    nameLookup,
    isLoading: query.isLoading,
  };
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<Employee, EmployeeCreateInput>(
    (input) => ApiPostEmployee({ body: input }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: ["hr-employees"] });
    },
    (error) => toast.error(error.message),
  );
};

const invalidateEmployees = (queryClient: ReturnType<typeof useQueryClient>) => {
  void queryClient.invalidateQueries({ queryKey: ["hr-employees"] });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<Employee, { id: string; input: EmployeeUpdateInput }>(
    ({ id, input }) => ApiPatchEmployee({ slugReplacement: { id }, body: input }),
    (data) => {
      toast.success(data.message);
      invalidateEmployees(queryClient);
    },
    (error) => toast.error(error.message),
  );
};

export const useArchiveEmployee = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<Employee, string>(
    (id) => ApiPatchEmployeeArchive({ slugReplacement: { id } }),
    (data) => {
      toast.success(data.message);
      invalidateEmployees(queryClient);
    },
    (error) => toast.error(error.message),
  );
};

export const useRestoreEmployee = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<Employee, string>(
    (id) => ApiPatchEmployeeRestore({ slugReplacement: { id } }),
    (data) => {
      toast.success(data.message);
      invalidateEmployees(queryClient);
    },
    (error) => toast.error(error.message),
  );
};

export interface AttendanceFilters {
  employeeId?: string;
  eventType?: AttendanceEventType;
  from?: string;
  to?: string;
  searchQuery?: string;
}

export const useAttendanceEvents = (
  page: number,
  filters: AttendanceFilters = {},
) => {
  const query = useWorkforceQuery(
    "hr.attendance.read",
    [
      "hr-attendance",
      page,
      filters.employeeId,
      filters.eventType,
      filters.from,
      filters.to,
      filters.searchQuery ?? "",
    ],
    TryCatchNullWrap(() =>
      ApiGetAttendanceEvents({
        searchParams: {
          page,
          limit: WORKFORCE_PAGE_SIZE,
          employeeId: filters.employeeId,
          eventType: filters.eventType,
          from: filters.from,
          to: filters.to,
          searchQuery: filters.searchQuery || undefined,
        },
      }),
    ),
  );

  return {
    events: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
  };
};

export const useSelfAttendanceStatus = () => {
  const { hasPermission } = usePermissions();

  return useQuery({
    queryKey: ["hr-attendance-self-status"],
    queryFn: TryCatchNullWrap(() => ApiGetAttendanceSelfStatus()),
    enabled: hasPermission("hr.attendance.clock"),
  });
};

export const usePunchSelf = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<AttendanceEvent, AttendanceSelfInput>(
    (input) => ApiPostAttendanceSelf({ body: input }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: ["hr-attendance"] });
      void queryClient.invalidateQueries({ queryKey: ["hr-attendance-self-status"] });
    },
    (error) => toast.error(error.message),
  );
};

export const usePunchManaged = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<AttendanceEvent, AttendanceManageInput>(
    (input) => ApiPostAttendanceManaged({ body: input }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: ["hr-attendance"] });
    },
    (error) => toast.error(error.message),
  );
};

export const useDepartments = (searchQuery?: string) => {
  const query = useWorkforceQuery(
    "hr.employee.read",
    ["hr-departments", searchQuery ?? ""],
    TryCatchNullWrap(() =>
      ApiGetDepartments({
        searchParams: {
          limit: LOOKUP_PAGE_SIZE,
          searchQuery: searchQuery || undefined,
        },
      }),
    ),
  );

  return {
    departments: query.data?.data ?? [],
    meta: query.data?.meta as ResponseMeta | undefined,
    isLoading: query.isLoading,
  };
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<Department, DepartmentCreateInput>(
    (input) => ApiPostDepartment({ body: input }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: ["hr-departments"] });
    },
    (error) => toast.error(error.message),
  );
};

export interface PositionFilters {
  departmentId?: string;
  includeArchived?: boolean;
  searchQuery?: string;
}

export const usePositions = (page: number, filters: PositionFilters = {}) => {
  const query = useWorkforceQuery(
    "hr.employee.read",
    [
      "hr-positions",
      page,
      filters.departmentId,
      filters.includeArchived,
      filters.searchQuery ?? "",
    ],
    TryCatchNullWrap(() =>
      ApiGetPositions({
        searchParams: {
          page,
          limit: WORKFORCE_PAGE_SIZE,
          departmentId: filters.departmentId,
          includeArchived: filters.includeArchived ? "true" : undefined,
          searchQuery: filters.searchQuery || undefined,
        },
      }),
    ),
  );

  return {
    positions: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
  };
};

export const useCreatePosition = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<Position, PositionCreateInput>(
    (input) => ApiPostPosition({ body: input }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: ["hr-positions"] });
    },
    (error) => toast.error(error.message),
  );
};

export const useArchivePosition = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<Position, string>(
    (id) => ApiPatchPositionArchive({ slugReplacement: { id } }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: ["hr-positions"] });
    },
    (error) => toast.error(error.message),
  );
};

export const useRestorePosition = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<Position, string>(
    (id) => ApiPatchPositionRestore({ slugReplacement: { id } }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: ["hr-positions"] });
    },
    (error) => toast.error(error.message),
  );
};

export const useShifts = (searchQuery?: string) => {
  const query = useWorkforceQuery(
    "hr.schedule.read",
    ["hr-shifts", searchQuery ?? ""],
    TryCatchNullWrap(() =>
      ApiGetShifts({
        searchParams: {
          limit: WORKFORCE_PAGE_SIZE,
          searchQuery: searchQuery || undefined,
        },
      }),
    ),
  );

  return {
    shifts: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
  };
};

export const useCreateShift = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<Shift, ShiftCreateInput>(
    (input) => ApiPostShift({ body: input }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: ["hr-shifts"] });
    },
    (error) => toast.error(error.message),
  );
};

export const useUpdateShift = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<
    Shift,
    { id: string; input: ShiftUpdateInput }
  >(
    ({ id, input }) =>
      ApiPatchShift({ slugReplacement: { id }, body: input }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: ["hr-shifts"] });
    },
    (error) => toast.error(error.message),
  );
};

export const useEmployeeFaces = (employeeId: string | null) => {
  const { hasPermission } = usePermissions();

  return useQuery({
    queryKey: ["hr-employee-faces", employeeId],
    queryFn: TryCatchNullWrap(() =>
      ApiGetEmployeeFaces({ slugReplacement: { id: employeeId! } }),
    ),
    enabled: hasPermission("hr.employee.update") && Boolean(employeeId),
  });
};

export const useEnrollFace = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<
    EmployeeFaceEnrollResult,
    { id: string; descriptor: number[] }
  >(
    ({ id, descriptor }) =>
      ApiPostEmployeeFaceEnroll({
        slugReplacement: { id },
        body: { descriptor },
      }),
    () => {
      void queryClient.invalidateQueries({ queryKey: ["hr-employee-faces"] });
    },
    (error) => toast.error(error.message),
  );
};

export const useRevokeFace = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<
    EmployeeFaceRevokeResult,
    { id: string; faceId: string }
  >(
    ({ id, faceId }) =>
      ApiPostEmployeeFaceRevoke({
        slugReplacement: { id, faceId },
      }),
    () => {
      void queryClient.invalidateQueries({ queryKey: ["hr-employee-faces"] });
    },
    (error) => toast.error(error.message),
  );
};
