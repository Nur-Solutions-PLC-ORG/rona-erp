import { useEffect, useRef } from "react";
import { usePagination } from "./pagination";
import { useCustomSearchParams } from "./search-params";

export function useListPage<T>() {
  const { paginationData, pagination } = usePagination();
  const searchParamsState = useCustomSearchParams<T>();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    pagination.setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(searchParamsState.requestSearchParams)]);

  return {
    pagination,
    paginationData,
    ...searchParamsState,
  };
}
