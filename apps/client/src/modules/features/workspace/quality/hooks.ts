import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TryCatchNullWrap } from "@/api";
import { useQuery } from "@tanstack/react-query";
import { usePermissions } from "@/modules/workspace/hooks";
import { useCreateMutation } from "@/hooks/utils";
import type { Permission } from "@rona/types/tenancy";
import type {
  InspectionCompleteSchema,
  InspectionCreateSchema,
  InspectionDto,
  InspectionReviewSchema,
  InspectionTestCreateSchema,
  InspectionTestDto,
  TestResultCreateSchema,
  TestResultDto,
} from "@rona/types/quality";
import type { ApiResponse } from "@rona/types/api";
import {
  ApiGetInspections,
  ApiGetInspectionTests,
  ApiPostInspection,
  ApiPostInspectionComplete,
  ApiPostInspectionRelease,
  ApiPostInspectionReject,
  ApiPostInspectionTest,
  ApiPostTestResult,
} from "./api";

export const QUALITY_PAGE_SIZE = 25;

export function useQualityQuery<TDto>(
  permission: Permission,
  queryKey: unknown[],
  queryFn: () => Promise<ApiResponse<TDto[]> | null>,
  isEnabled = true,
) {
  const { hasPermission } = usePermissions();

  return useQuery({
    queryKey,
    queryFn,
    enabled: hasPermission(permission) && isEnabled,
  });
}

export function useQualityMutation<TData, TVariables>(
  operation: (variables: TVariables) => Promise<ApiResponse<TData>>,
  invalidate: string[][],
  successExtra?: () => void,
) {
  const queryClient = useQueryClient();

  return useCreateMutation<TData, TVariables>(
    operation,
    (data) => {
      toast.success(data.message);
      for (const key of invalidate) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
      successExtra?.();
    },
    (error) => toast.error(error.message),
  );
}

export interface InspectionFilters {
  status?: string;
  type?: string;
  lotId?: string;
  itemId?: string;
  searchQuery?: string;
}

export const useInspections = (page: number, filters: InspectionFilters = {}) => {
  const query = useQualityQuery(
    "quality.inspection.read",
    [
      "quality-inspections",
      page,
      filters.status,
      filters.type,
      filters.lotId,
      filters.itemId,
      filters.searchQuery ?? "",
    ],
    TryCatchNullWrap(() =>
      ApiGetInspections({
        searchParams: {
          page,
          limit: QUALITY_PAGE_SIZE,
          status: filters.status,
          type: filters.type,
          lotId: filters.lotId,
          itemId: filters.itemId,
          searchQuery: filters.searchQuery || undefined,
        },
      }),
    ),
  );

  return {
    inspections: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
  };
};

export const useInspectionTests = (inspectionId: string | undefined) => {
  const query = useQualityQuery(
    "quality.inspection.read",
    ["quality-inspection-tests", inspectionId],
    TryCatchNullWrap(() =>
      ApiGetInspectionTests({
        slugReplacement: { id: inspectionId ?? "" },
      }),
    ),
    inspectionId !== undefined && inspectionId !== "",
  );

  return {
    tests: query.data?.data ?? [],
    isLoading: query.isLoading,
  };
};

export const useCreateInspection = () =>
  useQualityMutation<InspectionDto, InspectionCreateSchema>(
    (input) => ApiPostInspection({ body: input }),
    [["quality-inspections"]],
  );

export const useAddInspectionTest = (inspectionId: string) =>
  useQualityMutation<InspectionTestDto, InspectionTestCreateSchema>(
    (input) =>
      ApiPostInspectionTest({ body: input, slugReplacement: { id: inspectionId } }),
    [["quality-inspection-tests", inspectionId]],
  );

export interface TestResultInput extends TestResultCreateSchema {
  inspectionId: string;
  testId: string;
}

export const useRecordTestResult = (inspectionId: string) =>
  useQualityMutation<TestResultDto, TestResultInput>(
    ({ inspectionId: id, testId, ...input }) =>
      ApiPostTestResult({
        body: input,
        slugReplacement: { id, testId },
      }),
    [["quality-inspection-tests", inspectionId], ["quality-inspections"]],
  );

export const useCompleteInspection = (inspectionId: string) =>
  useQualityMutation<InspectionDto, InspectionCompleteSchema>(
    (input) =>
      ApiPostInspectionComplete({
        body: input,
        slugReplacement: { id: inspectionId },
      }),
    [["quality-inspections"], ["quality-inspection-tests", inspectionId]],
  );

export const useReleaseInspection = (inspectionId: string) =>
  useQualityMutation<InspectionDto, InspectionReviewSchema>(
    (input) =>
      ApiPostInspectionRelease({
        body: input,
        slugReplacement: { id: inspectionId },
      }),
    [["quality-inspections"], ["inventory-lots"]],
  );

export const useRejectInspection = (inspectionId: string) =>
  useQualityMutation<InspectionDto, InspectionReviewSchema>(
    (input) =>
      ApiPostInspectionReject({
        body: input,
        slugReplacement: { id: inspectionId },
      }),
    [["quality-inspections"], ["inventory-lots"]],
  );
