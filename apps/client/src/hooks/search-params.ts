import { RequestSearchParams } from "@/api";
import { useState } from "react";

export function useCustomSearchParams<T>() {
  const [searchParams, setSearchParams] = useState<T>({} as T);

  const updateParams = (value: Partial<T>) => {
    setSearchParams((prev) => ({ ...prev, ...value }));
  };

  const removeParams = (keys: (keyof T)[]) => {
    setSearchParams((prev) => {
      const newParams = { ...prev };

      for (const key of keys) {
        delete newParams[key];
      }

      return newParams;
    });
  };

  const clearParams = () => {
    setSearchParams({} as T);
  };

  return {
    searchParams,
    requestSearchParams: searchParams as unknown as RequestSearchParams,
    updateParams,
    clearParams,
    removeParams,
  };
}

export type UseCustomSearchParamsReturn<T> = ReturnType<
  typeof useCustomSearchParams<T>
>;
