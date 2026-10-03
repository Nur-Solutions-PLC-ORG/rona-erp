import z from "zod";
import {
  forwardTraceDto,
  lotDetailDto,
  reverseTraceDto,
  traceLotDto,
} from "@rona/validation/traceability";

export type TraceLotDto = z.infer<typeof traceLotDto>;
export type LotDetailDto = z.infer<typeof lotDetailDto>;
export type ForwardTraceDto = z.infer<typeof forwardTraceDto>;
export type ReverseTraceDto = z.infer<typeof reverseTraceDto>;
