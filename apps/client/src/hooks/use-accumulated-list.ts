"use client";

import { useMemo, useState } from "react";
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

const EMPTY_ITEMS: Identifiable[] = [];

function mergePage<T extends Identifiable>(
  prev: T[],
  items: T[],
  page: number,
): T[] {
  if (page <= 1) {
    return Array.from(new Map(items.map((item) => [item.id, item])).values());
  }

  const map = new Map(prev.map((item) => [item.id, item]));
  for (const item of items) {
    map.set(item.id, item);
  }
  return Array.from(map.values());
}

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
  const [appliedFilterKey, setAppliedFilterKey] = useState(serverFilterKey);
  const [appliedItems, setAppliedItems] = useState(items);
  const [appliedPage, setAppliedPage] = useState(pagination.page);
  const [wasLoading, setWasLoading] = useState(!!isLoading);
  // Stabilize `data?.data ?? []` so a fresh empty array each render cannot loop.
  const resolvedItems = (
    items.length === 0 ? EMPTY_ITEMS : items
  ) as T[];

  if (serverFilterKey !== appliedFilterKey) {
    setAppliedFilterKey(serverFilterKey);
    setCache([]);
    setAppliedItems(resolvedItems);
    setAppliedPage(pagination.page);
    setWasLoading(!!isLoading);
    if (pagination.page !== 1) {
      pagination.setPage(1);
    }
  } else if (
    !isLoading &&
    (resolvedItems !== appliedItems ||
      pagination.page !== appliedPage ||
      wasLoading)
  ) {
    setAppliedItems(resolvedItems);
    setAppliedPage(pagination.page);
    setWasLoading(false);
    setCache((prev) => mergePage(prev, resolvedItems, pagination.page));
  } else if (!!isLoading !== wasLoading) {
    setWasLoading(!!isLoading);
  }

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
