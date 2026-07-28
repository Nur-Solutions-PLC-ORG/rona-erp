import type { ApiResponse } from "@rona/types/api";
import { useMutation } from "@tanstack/react-query";
import { AxiosError, HttpStatusCode } from "axios";

export function useCreateMutation<TData, TVariables = void>(
  func: (variables: TVariables) => Promise<ApiResponse<TData>>,
  onSuccess?: (data: ApiResponse<TData>, variables: TVariables) => void,
  onError?: (error: ApiResponse<void>, variables: TVariables) => void,
) {
  return useMutation<
    ApiResponse<TData>,
    AxiosError<ApiResponse<void>>,
    TVariables
  >({
    mutationFn: func,
    onSuccess: onSuccess
      ? (data, tVars) => {
          if (!data.success) {
            if (onError) {
              onError(data as ApiResponse<void>, tVars);
            }
            return;
          }

          onSuccess(data, tVars);
        }
      : undefined,
    onError: onError
      ? (error, tVars) => {
          const apiError = error.response?.data;
          if (apiError) {
            onError(apiError, tVars);
          } else {
            onError(
              {
                success: false,
                statusCode: HttpStatusCode.InternalServerError,
                message: "Error occurred during fetch, Please try again!",
              },
              tVars,
            );
          }
        }
      : undefined,
  });
}
