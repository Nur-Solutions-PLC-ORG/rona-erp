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

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];

  loading?: boolean;

  pagination?: Pagination;
  responseMeta?: ResponseMeta;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading,
  responseMeta,
  pagination,
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const hasNextPage =
    responseMeta &&
    pagination &&
    responseMeta.totalPages &&
    pagination.page < responseMeta.totalPages;

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
    <div className="px-5 flex pb-6">
      <div className="flex flex-1 bg-white md:rounded-md shadow flex-col">
        <div
          style={
            {
              "--border": "#ddd",
            } as React.CSSProperties
          }
          className="flex w-full flex-col"
        >
          {/* Table */}
          <ScrollArea className="max-w-screen">
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
                              : "",
                          "opacity-75",
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
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={table.getAllColumns().length}
                      className="h-10 opacity-25 animate-pulse px-6"
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
                                : "",
                            "h-10",
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
                      className="h-10 opacity-75 px-6 opacity-50"
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
          <div className="flex px mt-auto h-16 border-t border-border/25">
            <div className="flex items-center gap-6">
              <div className="border pl-2 h-9 rounded-md gap-2 flex">
                <p className="my-auto text-sm opacity-75">Per Page</p>
                <Dropdown
                  className="min-w-0 w-20! max-w-20!"
                  options={PAGE_SIZE_OPTIONS}
                  placeholder="Size"
                  value={pagination.limit?.toString() || ""}
                  onChange={(e) => pagination.setLimit(Number(e))}
                />
              </div>
              <div className="border pl-2 h-9 rounded-md gap-2 flex">
                <p className="my-auto text-sm opacity-75">Page</p>
                <div className="flex border rounded-md h-9">
                  <FiChevronLeft
                    onClick={() => {
                      if (pagination.page && pagination.page - 1 > 0) {
                        pagination.setPage(pagination.page - 1);
                      }
                    }}
                    className={cn(
                      "h-full px-2 w-9 rounded-md hover:bg-secondary/5 active:bg-secondary/10 duration-200 transition-all cursor-pointer",
                      // disable
                      pagination.page == 1 && "opacity-50",
                    )}
                  />

                  <span
                    className={cn(
                      "h-full px-4 font-medium border-x text-base flex items-center",
                      !pagination.page && "opacity-50",
                    )}
                  >
                    {pagination.page || "Page"}
                  </span>

                  <FiChevronRight
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
                      "h-full px-2 w-9 rounded-md hover:bg-secondary/5 active:bg-secondary/10 duration-200 transition-all cursor-pointer",
                      // disable
                      !hasNextPage && "opacity-50",
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
