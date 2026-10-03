import { pgEnum } from 'drizzle-orm/pg-core';
import {
  INSPECTION_STATUS_LIST,
  INSPECTION_TYPE_LIST,
  QA_DECISION_LIST,
  TEST_RESULT_LIST,
} from '@rona/config/quality';

export const inspectionTypeList = pgEnum(
  'inspection_type_list',
  INSPECTION_TYPE_LIST,
);

export const inspectionStatusList = pgEnum(
  'inspection_status_list',
  INSPECTION_STATUS_LIST,
);

export const testResultList = pgEnum('test_result_list', TEST_RESULT_LIST);

export const qaDecisionList = pgEnum('qa_decision_list', QA_DECISION_LIST);
