import { Request } from "@/api";
import {
  API_QUALITY_INSPECTIONS_URL,
  API_QUALITY_INSPECTION_COMPLETE_URL,
  API_QUALITY_INSPECTION_RELEASE_URL,
  API_QUALITY_INSPECTION_REJECT_URL,
  API_QUALITY_INSPECTION_TESTS_URL,
  API_QUALITY_TEST_RESULT_URL,
} from "@rona/routes/workspace";
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

export const ApiGetInspections = Request<InspectionDto[]>(
  "get",
  API_QUALITY_INSPECTIONS_URL,
);
export const ApiPostInspection = Request<InspectionDto, InspectionCreateSchema>(
  "post",
  API_QUALITY_INSPECTIONS_URL,
);
export const ApiGetInspectionTests = Request<InspectionTestDto[]>(
  "get",
  API_QUALITY_INSPECTION_TESTS_URL,
);
export const ApiPostInspectionTest = Request<
  InspectionTestDto,
  InspectionTestCreateSchema
>("post", API_QUALITY_INSPECTION_TESTS_URL);
export const ApiPostTestResult = Request<
  TestResultDto,
  TestResultCreateSchema
>("post", API_QUALITY_TEST_RESULT_URL);
export const ApiPostInspectionComplete = Request<
  InspectionDto,
  InspectionCompleteSchema
>("post", API_QUALITY_INSPECTION_COMPLETE_URL);
export const ApiPostInspectionRelease = Request<
  InspectionDto,
  InspectionReviewSchema
>("post", API_QUALITY_INSPECTION_RELEASE_URL);
export const ApiPostInspectionReject = Request<
  InspectionDto,
  InspectionReviewSchema
>("post", API_QUALITY_INSPECTION_REJECT_URL);
