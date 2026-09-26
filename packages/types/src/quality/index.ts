import z from "zod";
import {
  INSPECTION_STATUS_LIST,
  INSPECTION_TYPE_LIST,
  QA_DECISION_LIST,
  TEST_RESULT_LIST,
} from "@rona/config/quality";
import {
  inspectionCompleteSchema,
  inspectionCreateSchema,
  inspectionDto,
  inspectionListSearchParamsSchema,
  inspectionReviewSchema,
  inspectionTestCreateSchema,
  inspectionTestDto,
  qaReviewDto,
  releaseDecisionDto,
  testResultCreateSchema,
  testResultDto,
} from "@rona/validation/quality";

export type InspectionType = (typeof INSPECTION_TYPE_LIST)[number];
export type InspectionStatus = (typeof INSPECTION_STATUS_LIST)[number];
export type TestResultValue = (typeof TEST_RESULT_LIST)[number];
export type QaDecision = (typeof QA_DECISION_LIST)[number];

export type InspectionCreateSchema = z.infer<typeof inspectionCreateSchema>;
export type InspectionListSearchParamsSchema = z.infer<
  typeof inspectionListSearchParamsSchema
>;
export type InspectionTestCreateSchema = z.infer<
  typeof inspectionTestCreateSchema
>;
export type TestResultCreateSchema = z.infer<typeof testResultCreateSchema>;
export type InspectionCompleteSchema = z.infer<typeof inspectionCompleteSchema>;
export type InspectionReviewSchema = z.infer<typeof inspectionReviewSchema>;

export type InspectionDto = z.infer<typeof inspectionDto>;
export type InspectionTestDto = z.infer<typeof inspectionTestDto>;
export type TestResultDto = z.infer<typeof testResultDto>;
export type QaReviewDto = z.infer<typeof qaReviewDto>;
export type ReleaseDecisionDto = z.infer<typeof releaseDecisionDto>;

export type InspectionCreateInput = InspectionCreateSchema;
export type InspectionTestCreateInput = InspectionTestCreateSchema;
export type TestResultCreateInput = TestResultCreateSchema;
export type InspectionCompleteInput = InspectionCompleteSchema;
export type InspectionReviewInput = InspectionReviewSchema;

export interface Paginated {
  page: number;
  limit: number;
}

export type InspectionListParams = InspectionListSearchParamsSchema & Paginated;

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

export type InspectionAggregateResult = "PASS" | "FAIL";
