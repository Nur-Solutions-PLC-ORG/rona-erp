import type { ApiResponse } from "@rona/types";
import { useMutation } from "@tanstack/react-query";

export function useCreateMutation<T>(
  func: () => Promise<ApiResponse<T>>,
  onSuccess?: (data: ApiResponse<T>) => void,
  onError?: (error: Error) => void,
) {
  return useMutation({
    mutationFn: func,
    onSuccess,
    onError,
  });
}
