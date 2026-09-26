import {
  PAGE_LIMIT_MAXIMUM,
  PAGE_LIMIT_MINIMUM,
  SEARCH_QUERY_MAX_LENGTH,
} from "@rona/config";
import z from "zod";

export const paginationSearchParamsSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .transform((value) =>
      Math.min(Math.max(value, PAGE_LIMIT_MINIMUM), PAGE_LIMIT_MAXIMUM),
    )
    .optional(),
  searchQuery: z.string().trim().max(SEARCH_QUERY_MAX_LENGTH).optional(),
});
