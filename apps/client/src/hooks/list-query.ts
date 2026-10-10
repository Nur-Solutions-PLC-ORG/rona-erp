import { PaginationData } from "./pagination";

export function buildListQueryKey(
  base: string,
  searchParams: object,
  pagination?: PaginationData,
) {
  return [base, searchParams, pagination?.page, pagination?.limit] as const;
}
