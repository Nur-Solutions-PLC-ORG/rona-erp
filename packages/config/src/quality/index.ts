// Quality configuration

export const INSPECTION_TYPE_LIST = [
  "INCOMING",
  "IN_PROCESS",
  "FINISHED_GOOD",
] as const;

export const INSPECTION_STATUS_LIST = [
  "IN_PROGRESS",
  "COMPLETED",
  "REVIEWED",
] as const;

export const TEST_RESULT_LIST = ["PASS", "FAIL"] as const;

export const QA_DECISION_LIST = ["RELEASE", "REJECT"] as const;

export const QUALITY_DEFAULT_PAGE_SIZE = 25;
export const QUALITY_DEFAULT_PAGE = 1;

export const INSPECTION_CODE_PREFIX = "INSP";
