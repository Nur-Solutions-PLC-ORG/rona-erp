import { PAGE_LIMIT_MINIMUM } from "@rona/config";
import { useState } from "react";

export type PaginationData = {
  page: number;
  limit: number;
};

export type Pagination = PaginationData & {
  setPage: (value: number) => void;
  setLimit: (value: number) => void;
};

export const usePagination = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(PAGE_LIMIT_MINIMUM);

  const paginationData: PaginationData = {
    page,
    limit,
  };

  return {
    pagination: {
      ...paginationData,
      setPage,
      setLimit,
    } as Pagination,
    paginationData,
  };
};
