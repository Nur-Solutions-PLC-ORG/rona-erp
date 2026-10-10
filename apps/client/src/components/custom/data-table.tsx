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
import { HiOutlineTableCells } from "react-icons/hi2";
import { RiLoader5Fill } from "react-icons/ri";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import Dropdown from "./dropdown";
import { Skeleton } from "./skeleton";
import { Pagination } from "@/hooks/pagination";
import { ResponseMeta } from "@rona/types/api";

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
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const hasNextPage =
    responseMeta &&
    pagination &&
    responseMeta.totalPages > 0 &&
    pagination.page < responseMeta.totalPages;

  const totalItems = responseMeta?.totalItems ?? 0;

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

  const cellPadding = (cellIdx: number, arr: unknown[]) =>
    cn(
      cellIdx === 0
        ? "pl-4"
        : cellIdx === arr.length - 1
          ? "pr-4"
          : "px-4",
    );

  return (
    <div className="flex-1 flex">
      <div className="flex flex-1 bg-card rounded-lg border border-zinc-200 overflow-hidden flex-col">
        <div className="flex w-full flex-col">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader className="bg-zinc-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    className="hover:bg-zinc-50 border-zinc-200"
                    key={headerGroup.id}
                  >
                    {headerGroup.headers.map((header, cellIdx, arr) => (
                      <TableHead
                        className={cn(
                          cellPadding(cellIdx, arr),
                          "py-2 text-xs font-semibold uppercase tracking-wider text-zinc-500",
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
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`} className="border-zinc-100">
                      <TableCell
                        colSpan={table.getAllColumns().length}
                        className="px-4 py-1.5"
                      >
                        <Skeleton className="my-0.5 h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-zinc-100 hover:bg-zinc-100"
                    >
                      {row.getVisibleCells().map((cell, cellIdx, arr) => (
                        <TableCell
                          className={cn(
                            cellPadding(cellIdx, arr),
                            "py-2 text-xs text-zinc-700",
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
                  <TableRow className="border-zinc-100">
                    <TableCell
                      colSpan={table.getAllColumns().length}
                      className="px-4 py-10"
                    >
                      <div className="flex flex-col items-center justify-center gap-2 text-center">
                        <HiOutlineTableCells className="h-7 w-7 text-zinc-200" />
                        <p className="text-sm font-medium text-zinc-600">
                          No results found.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        {pagination && (
          <div className="flex px-4 py-2.5 mt-auto border-t border-zinc-100 bg-zinc-50/50">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <p className="text-xs text-zinc-500">Show</p>
                <Dropdown
                  className="min-w-0 w-20! max-w-20! h-7! bg-card!"
                  options={PAGE_SIZE_OPTIONS}
                  placeholder="Size"
                  value={pagination.limit?.toString() || ""}
                  onChange={(e) => pagination.setLimit(Number(e))}
                />
                <p className="text-xs text-zinc-500">
                  {loadMore ? (
                    <>
                      {loadMore.isFilteringLocally
                        ? `${data.length} match${data.length === 1 ? "" : "es"} in `
                        : ""}
                      <span className="font-medium text-zinc-700">
                        {loadMore.cachedCount}
                      </span>{" "}
                      loaded of{" "}
                    </>
                  ) : (
                    "of "
                  )}
                  <span className="font-medium text-zinc-700">
                    {totalItems}
                  </span>{" "}
                  item{totalItems > 1 ? "s" : ""}
                </p>
              </div>

              {loadMore ? (
                <button
                  type="button"
                  disabled={!loadMore.hasMore || loading}
                  onClick={loadMore.onLoadMore}
                  className="ml-auto flex items-center justify-center gap-1.5 px-3 rounded-md bg-card hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition border border-zinc-200 disabled:opacity-50 disabled:pointer-events-none h-7"
                >
                  {loading ? (
                    <RiLoader5Fill className="size-3.5 animate-spin" />
                  ) : null}
                  {loadMore.hasMore ? "Load more" : "All loaded"}
                </button>
              ) : (
              <div className="flex items-center gap-2 ml-auto">
                <p className="text-xs text-zinc-500">Page</p>
                <div className="flex rounded-lg border border-zinc-200 bg-card overflow-hidden h-7">
                  <button
                    type="button"
                    aria-label="Previous page"
                    onClick={() => {
                      if (pagination.page && pagination.page - 1 > 0) {
                        pagination.setPage(pagination.page - 1);
                      }
                    }}
                    className={cn(
                      "w-8 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 active:bg-zinc-100 transition-all cursor-pointer disabled:cursor-default",
                      pagination.page == 1 && "opacity-25",
                    )}
                    disabled={pagination.page == 1}
                  >
                    <FiChevronLeft className="size-3.5" />
                  </button>

                  <span className="min-w-9 px-2 border-x border-zinc-200 text-xs font-semibold text-zinc-700 flex items-center justify-center">
                    {pagination.page || "-"}
                  </span>

                  <button
                    type="button"
                    aria-label="Next page"
                    onClick={() => {
                      if (pagination.page) {
                        if (hasNextPage) {
                          pagination.setPage(pagination.page + 1);
                        }
                      } else {
                        pagination.setPage(1);
                      }
                    }}
                    className={cn(
                      "w-8 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 active:bg-zinc-100 transition-all cursor-pointer disabled:cursor-default",
                      !hasNextPage && "opacity-25",
                    )}
                    disabled={!hasNextPage}
                  >
                    <FiChevronRight className="size-3.5" />
                  </button>
                </div>
              </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
