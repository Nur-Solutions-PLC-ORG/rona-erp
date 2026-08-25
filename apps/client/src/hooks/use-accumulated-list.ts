"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pagination } from "./pagination";
import { ResponseMeta } from "@rona/types/api";

type Identifiable = { id: string };

type Options<T extends Identifiable> = {
  items: T[];
  meta?: ResponseMeta | undefined;
  pagination: Pagination;
  /** Server-side filters key (excludes page). When this changes, cache resets. */
  serverFilterKey: string;
  /** Instant client-side filter over the accumulated cache */
  localSearch: string;
  getSearchableText: (item: T) => string;
  isLoading?: boolean;
};

export function useAccumulatedList<T extends Identifiable>({
  items,
  meta,
  pagination,
  serverFilterKey,
  localSearch,
  getSearchableText,
  isLoading,
}: Options<T>) {
  const [cache, setCache] = useState<T[]>([]);
  const prevFilterKey = useRef(serverFilterKey);

  useEffect(() => {
    if (prevFilterKey.current !== serverFilterKey) {
      prevFilterKey.current = serverFilterKey;
      setCache([]);
      if (pagination.page !== 1) {
        pagination.setPage(1);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverFilterKey]);

  useEffect(() => {
    if (isLoading) return;

    setCache((prev) => {
      if (pagination.page <= 1) {
        const map = new Map(items.map((item) => [item.id, item]));
        return Array.from(map.values());
      }

      const map = new Map(prev.map((item) => [item.id, item]));
      for (const item of items) {
        map.set(item.id, item);
      }
      return Array.from(map.values());
    });
  }, [items, isLoading, pagination.page]);

  const displayedItems = useMemo(() => {
    const query = localSearch.trim().toLowerCase();
    if (!query) return cache;

    return cache.filter((item) =>
      getSearchableText(item).toLowerCase().includes(query),
    );
  }, [cache, localSearch, getSearchableText]);

  const hasMore =
    !!meta && meta.totalPages > 0 && pagination.page < meta.totalPages;

  const loadMore = () => {
    if (!hasMore || isLoading) return;
    pagination.setPage(pagination.page + 1);
  };

  const searchServer = (searchQuery: string) => {
    // Caller updates server search params; we reset page here
    pagination.setPage(1);
    setCache([]);
    return searchQuery;
  };

  return {
    items: displayedItems,
    cachedCount: cache.length,
    hasMore,
    loadMore,
    searchServer,
    isFilteringLocally: localSearch.trim().length > 0,
  };
}
