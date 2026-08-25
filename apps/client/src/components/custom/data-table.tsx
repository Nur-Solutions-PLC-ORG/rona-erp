import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { PAGE_SIZE_OPTIONS } from "@rona/config";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { RiLoader5Fill } from "react-icons/ri";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import Dropdown from "./dropdown";
import { Pagination } from "@/hooks/pagination";
import { ResponseMeta } from "@rona/types/api";
import { Button } from "../ui/button";
import { useSidebarStore } from "@/store";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];

  loading?: boolean;

  pagination?: Pagination;
  responseMeta?: ResponseMeta;

  /** Accumulated list mode: show Load more instead of page arrows */
  loadMore?: {
    hasMore: boolean;
    onLoadMore: () => void;
    cachedCount: number;
    isFilteringLocally?: boolean;
  };
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading,
  responseMeta,
  pagination,
  loadMore,
}: DataTableProps<TData, TValue>) {
  const collapsed = useSidebarStore((s) => s.collapsed);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const hasNextPage =
    responseMeta &&
    pagination &&
    responseMeta.totalPages > 0 &&
    pagination.page < responseMeta.totalPages;

  const hasPrevPage = pagination && pagination.page > 1;

  const totalPages = responseMeta?.totalPages ?? 1;
  const totalItems = responseMeta?.totalItems ?? 0;
  const currentPage = pagination?.page ?? 1;
  const pageSize = responseMeta?.limit ?? pagination?.limit ?? 0;
  const rangeStart =
    totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd =
    totalItems === 0 ? 0 : Math.min(currentPage * pageSize, totalItems);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    state: {
      columnFilters,
      globalFilter,
    },
  });

  return (
    <div className="px-5 flex-1 flex pb-6 min-w-0">
      <div className="flex flex-1 bg-white rounded-lg shadow flex-col min-w-0">
        <div
          style={
            {
              "--border": "#ddd",
            } as React.CSSProperties
          }
          className="flex w-full flex-col"
        >
          <ScrollArea
            className={cn(
              "max-w-[calc(100vw-2.5rem)]",
              collapsed
                ? "md:max-w-[calc(100vw-6.75rem)]"
                : "md:max-w-[calc(100vw-17.5rem)]",
            )}
          >
            <Table>
              <TableHeader className="border-b-2! border-black/5!">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow className="h-10" key={headerGroup.id}>
                    {headerGroup.headers.map((header, cellIdx, arr) => (
                      <TableHead
                        className={cn(
                          cellIdx === 0
                            ? "pl-6"
                            : cellIdx === arr.length - 1
                              ? "pr-6"
                              : "px-6",
                          "opacity-50",
                        )}
                        key={header.id}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading && data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={table.getAllColumns().length}
                      className="h-14 opacity-25 animate-pulse px-6"
                    >
                      <RiLoader5Fill className="size-5 animate-spin inline mr-2" />
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell, cellIdx, arr) => (
                        <TableCell
                          className={cn(
                            cellIdx === 0
                              ? "pl-6"
                              : cellIdx === arr.length - 1
                                ? "pr-6"
                                : "px-6",
                            "h-14",
                          )}
                          key={cell.id}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={table.getAllColumns().length}
                      className="h-14 px-6 opacity-50"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
        {pagination && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 mt-auto min-h-16 py-3 border-t border-border/25">
            <div className="flex items-center gap-6 flex-wrap">
              <div className="pl-2 h-9 rounded-md gap-2 flex items-center">
                <p className="my-auto text-sm opacity-75">Per Page</p>
                <Dropdown
                  className="min-w-0 w-20! max-w-20! h-8"
                  options={PAGE_SIZE_OPTIONS}
                  placeholder="Size"
                  value={pagination.limit?.toString() || ""}
                  onChange={(e) => pagination.setLimit(Number(e))}
                />
              </div>

              {loadMore ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!loadMore.hasMore || loading}
                  onClick={loadMore.onLoadMore}
                  className="gap-2"
                >
                  {loading ? (
                    <RiLoader5Fill className="size-4 animate-spin" />
                  ) : null}
                  {loadMore.hasMore ? "Load more" : "All loaded"}
                </Button>
              ) : (
                <div className="pl-2 h-9 rounded-md gap-2 flex items-center">
                  <p className="my-auto text-sm opacity-75">Page</p>
                  <div className="flex border rounded-md h-8">
                    <FiChevronLeft
                      onClick={() => {
                        if (hasPrevPage) {
                          pagination.setPage(pagination.page - 1);
                        }
                      }}
                      className={cn(
                        "h-full px-2 w-8 rounded-md hover:bg-secondary/5 active:bg-secondary/10 duration-200 transition-all cursor-pointer",
                        !hasPrevPage && "opacity-25 pointer-events-none",
                      )}
                    />

                    <span
                      className={cn(
                        "h-full px-3 font-medium border-x text-base flex items-center",
                        !pagination.page && "opacity-50",
                      )}
                    >
                      {pagination.page || "Page"}
                    </span>

                    <FiChevronRight
                      onClick={() => {
                        if (hasNextPage) {
                          pagination.setPage(pagination.page + 1);
                        }
                      }}
                      className={cn(
                        "h-full px-2 w-8 rounded-md hover:bg-secondary/5 active:bg-secondary/10 duration-200 transition-all cursor-pointer",
                        !hasNextPage && "opacity-25 pointer-events-none",
                      )}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="text-sm opacity-75 text-right">
              {loadMore ? (
                <>
                  <p>
                    {loadMore.isFilteringLocally
                      ? `${data.length} match${data.length === 1 ? "" : "es"} in ${loadMore.cachedCount} loaded`
                      : `${loadMore.cachedCount} loaded`}
                    {totalItems > 0 ? ` · ${totalItems} total` : ""}
                  </p>
                  <p>
                    Page {currentPage} of {totalPages}
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Page {currentPage} of {totalPages}
                  </p>
                  <p>
                    {totalItems === 0
                      ? "0 items"
                      : `Showing ${rangeStart}–${rangeEnd} of ${totalItems}`}
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
