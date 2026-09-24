import { Request } from "@/api";
import {
  API_TRACEABILITY_FORWARD_URL,
  API_TRACEABILITY_LOT_URL,
  API_TRACEABILITY_REVERSE_URL,
} from "@rona/routes/workspace";
import type { ForwardTraceDto, LotDetailDto, ReverseTraceDto } from "@rona/types/traceability";

export const ApiGetLotDetail = Request<LotDetailDto>("get", API_TRACEABILITY_LOT_URL);
export const ApiGetForwardTrace = Request<ForwardTraceDto>("get", API_TRACEABILITY_FORWARD_URL);
export const ApiGetReverseTrace = Request<ReverseTraceDto>("get", API_TRACEABILITY_REVERSE_URL);
