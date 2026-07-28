import type { ApiResponse } from "@rona/types/api";
import { apiClient } from ".";

export function Request<T>(
  type: "get",
  route: string,
): () => Promise<ApiResponse<T>>;

export function Request<T>(
  type: "post",
  route: string,
): () => Promise<ApiResponse<T>>;

export function Request<T, TBody>(
  type: "post",
  route: string,
): (data: TBody) => Promise<ApiResponse<T>>;

export function Request<T, TBody>(type: "get" | "post", route: string) {
  switch (type) {
    case "post":
      return async (data: TBody): Promise<ApiResponse<T>> => {
        const { data: responseData } = await apiClient.post<ApiResponse<T>>(
          route,
          data,
        );

        return responseData;
      };

    case "get":
    default:
      return async (): Promise<ApiResponse<T>> => {
        const { data: responseData } =
          await apiClient.get<ApiResponse<T>>(route);

        return responseData;
      };
  }
}

export function TryCatchNullWrap<T>(func: () => Promise<ApiResponse<T>>) {
  return async function () {
    try {
      const funcRes = await func();
      return funcRes;
    } catch {
      return null;
    }
  };
}
