import { PAGE_LIMIT_MAXIMUM, PAGE_LIMIT_MINIMUM, SEARCH_QUERY_MAX_LENGTH, } from "@rona/config";
import z from "zod";
export const paginationSearchParamsSchema = z.object({
    page: z.number().int().positive().optional(),
    limit: z
        .number()
        .int()
        .positive()
        .max(PAGE_LIMIT_MAXIMUM)
        .min(PAGE_LIMIT_MINIMUM)
        .optional(),
    searchQuery: z.string().trim().max(SEARCH_QUERY_MAX_LENGTH).optional(),
});
