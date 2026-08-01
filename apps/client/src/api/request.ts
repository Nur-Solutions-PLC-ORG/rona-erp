import type { ApiResponse } from "@rona/types/api";
import {
  buildRoute,
  RequestSearchParams,
  RequestSlugReplacement,
} from "./utils";
import { apiClient } from ".";

type Method = "get" | "post" | "put" | "patch" | "delete";

export interface RequestInput<TBody = never> {
  body?: TBody;
  searchParams?: RequestSearchParams;
  slugReplacement?: RequestSlugReplacement;
}

export function Request<T, TBody = never>(method: Method, route: string) {
  return async (input?: RequestInput<TBody>): Promise<ApiResponse<T>> => {
    const url = buildRoute(route, { slugReplacement: input?.slugReplacement });

    const config = {
      params: input?.searchParams,
    };

    const response =
      method === "get" || method === "delete"
        ? await apiClient[method]<ApiResponse<T>>(url, config)
        : await apiClient[method]<ApiResponse<T>>(url, input?.body, config);

    return response.data;
  };
}
