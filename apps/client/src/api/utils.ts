import type { ApiResponse } from "@rona/types/api";
import { apiClient } from ".";

export function Request<T>(
  type: "get" | "post" | "put",
  route: string,
): () => Promise<ApiResponse<T>> {
  switch (type) {
    default:
      return async function () {
        const response = await apiClient.get<ApiResponse<T>>(route);
        const responseData = response.data;
        return responseData;
      };
    // case "get":
    // case "post":
    //   return;
    // case "put":
    //   return;
  }
}

// export function useApiQuery<T>(key: readonly unknown[], url: string) {
//   return useQuery({
//     queryKey: key,
//     queryFn: Request<T>("get", url),
//   });
// }
