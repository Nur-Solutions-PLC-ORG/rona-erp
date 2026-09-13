import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnDef, Row } from "@tanstack/react-table";
import { format, formatDistanceToNowStrict, isPast } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { IoIosMore } from "react-icons/io";
import { cn, slugToString } from "./utils";

type ExtraColumn<T> = {
  id?: string;
  accessorKey?: string;
  accessorFn?: (row: T) => unknown;
  header?: string | ((props: unknown) => React.ReactNode);
  cell?: (props: { row: Row<T> }) => React.ReactNode;
  enableSorting?: boolean;
  enableHiding?: boolean;
  coloring?: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRender?: (value: any) => string | React.ReactNode;
  isDate?: boolean;
  isTime?: boolean;
  isPrice?: boolean;
  isBold?: boolean;
  isRaw?: boolean;
  isMono?: boolean;
  daysLeft?: boolean;
  highlight?: boolean;
};

type ActionItem<T> = {
  title: string;
  onTitle?: (row: Row<T>) => string;
  onClick: (row: Row<T>) => void;
  disabled?: boolean;
  separator?: boolean;
};

interface CreateColumnsOptions<T> {
  includeSelect?: boolean;
  includeActions?: boolean;
  extraColumns?: ExtraColumn<T>[];
  searchQuery?: string;
  customActionsCell?: (row: Row<T>) => React.ReactNode;
  actionsItems?: ActionItem<T>[];
}

function highlightSearchMatch(
  value: string,
  searchQuery?: string,
): React.ReactNode {
  const query = searchQuery?.trim();

  if (!query) return value;

  const normalizedValue = value.toLocaleLowerCase();
  const normalizedQuery = query.toLocaleLowerCase();
  const segments: React.ReactNode[] = [];
  let startIndex = 0;
  let matchIndex = normalizedValue.indexOf(normalizedQuery);

  while (matchIndex !== -1) {
    if (matchIndex > startIndex) {
      segments.push(value.slice(startIndex, matchIndex));
    }

    segments.push(
      <mark
        key={`${matchIndex}-${matchIndex + query.length}`}
        className="bg-yellow-200 text-inherit"
      >
        {value.slice(matchIndex, matchIndex + query.length)}
      </mark>,
    );

    startIndex = matchIndex + query.length;
    matchIndex = normalizedValue.indexOf(normalizedQuery, startIndex);
  }

  return segments.length > 0 ? (
    <>
      {segments}
      {value.slice(startIndex)}
    </>
  ) : (
    value
  );
}

export function createColumns<T>({
  includeSelect = false,
  includeActions = false,
  extraColumns = [],
  searchQuery,
  customActionsCell,
  actionsItems = [],
}: CreateColumnsOptions<T>): ColumnDef<T>[] {
  const columns: ColumnDef<T>[] = [];

  const None = <span className="text-xs text-zinc-400">None</span>;

  if (includeSelect) {
    columns.push({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    });
  }

  for (const col of extraColumns) {
    const key = col.accessorKey;

    const defaultCell = ({ row }: { row: Row<T> }) => {
      const value = col.accessorFn
        ? col.accessorFn(row.original)
        : key !== undefined
          ? row.getValue(key)
          : undefined;

      const style: React.CSSProperties = {};

      if (col.isRaw) {
        return (
          <span
            className={cn(
              "text-xs font-medium text-zinc-600",
              col.isBold && "font-semibold!",
              col.isMono && "font-mono!",
            )}
          >
            {highlightSearchMatch(String(value), searchQuery)}
          </span>
        );
      }

      if (typeof value == "object" && Array.isArray(value)) {
        if (value.length <= 0) {
          return None;
        }

        return (
          <div className="flex gap-1.5">
            {value.slice(0, 2).map((item) => (
              <p
                className="bg-zinc-100 text-zinc-600 rounded-md text-xs font-medium h-5 px-2 flex items-center"
                key={item}
              >
                {highlightSearchMatch(String(item), searchQuery)}
              </p>
            ))}
            {value.length > 2 && (
              <span className="text-xs text-zinc-400 flex items-center leading-5">
                +{value.length - 2}
              </span>
            )}
          </div>
        );
      }

      if (col.isBold) {
        style.fontWeight = "600";
      }

      if (!String(value || "")) {
        return None;
      }

      if (col.coloring) {
        const color = col.coloring[String(value)] || "#52525b";

        return (
          <span
            style={{ color }}
            className={cn(
              "text-xs font-semibold uppercase tracking-wide",
              col.isMono && "font-mono!",
            )}
          >
            {highlightSearchMatch(
              col.onRender ? slugToString(String(value)) : String(value),
              searchQuery,
            )}
          </span>
        );
      }

      return (
        <div
          style={style}
          className={cn(
            !col.isBold && !col.coloring && "",
            col.highlight && "text-zinc-900 font-medium underline",
          )}
        >
          <span className="z-10">
            {col.isDate ? (
              <span className="flex text-xs items-center gap-2">
                {highlightSearchMatch(
                  format(new Date(value as string), "dd MMM yyyy"),
                  searchQuery,
                )}{" "}
                {col.daysLeft &&
                  (isPast(new Date(value as string)) ? (
                    <span className="text-[11px]! block font-semibold text-red-600">
                      Expired
                    </span>
                  ) : (
                    <>
                      <span className="text-[10px]! block text-zinc-400 font-medium">
                        {formatDistanceToNowStrict(new Date(value as string))}{" "}
                        left
                      </span>
                    </>
                  ))}
              </span>
            ) : col.isTime ? (
              <>
                {highlightSearchMatch(
                  format(
                    toZonedTime(new Date(value as string), "Etc/GMT"),
                    "h:mm aaa",
                  ),
                  searchQuery,
                )}
                <span className="text-[10px]! block text-zinc-400">
                  {highlightSearchMatch(
                    format(new Date(value as string), "dd MMM yyyy"),
                    searchQuery,
                  )}
                </span>
              </>
            ) : col.isPrice ? (
              highlightSearchMatch(
                `Br ${Number(value).toLocaleString()}`,
                searchQuery,
              )
            ) : col.onRender ? (
              (() => {
                const renderedValue = col.onRender(value);
                return typeof renderedValue === "string" ||
                  typeof renderedValue === "number"
                  ? highlightSearchMatch(String(renderedValue), searchQuery)
                  : renderedValue;
              })()
            ) : (
              highlightSearchMatch(String(value), searchQuery)
            )}
          </span>
        </div>
      );
    };

    columns.push({
      id: col.id ?? key ?? `col-${columns.length}`,
      ...(col.accessorFn
        ? { accessorFn: col.accessorFn }
        : key !== undefined
          ? { accessorKey: key }
          : {}),
      header: col.header,
      cell: col.cell ?? defaultCell,
      enableSorting: col.enableSorting,
      enableHiding: col.enableHiding,
    } as ColumnDef<T>);
  }

  if (includeActions) {
    columns.push({
      id: "actions",
      enableHiding: false,
      cell: ({ row }) =>
        customActionsCell ? (
          customActionsCell(row)
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size={"icon-xs"}>
                <span className="sr-only">Open menu</span>
                <IoIosMore className="size-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              alignOffset={12}
              align="center"
              className="w-52 mx-2"
            >
              {actionsItems.map((item, index) => {
                const dropDownItem = (
                  <DropdownMenuItem
                    key={index}
                    disabled={item.disabled}
                    onClick={() => item.onClick(row)}
                    className={cn(
                      (item.title.toLowerCase().includes("delete") ||
                        item.title.toLowerCase().includes("remove")) &&
                        "text-destructive hover:text-destructive!",
                    )}
                  >
                    {item.onTitle ? item.onTitle(row) : item.title}
                  </DropdownMenuItem>
                );
                return item.separator ? (
                  <DropdownMenuGroup key={index}>
                    {dropDownItem}
                    <DropdownMenuSeparator />
                  </DropdownMenuGroup>
                ) : (
                  dropDownItem
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
    });
  }

  return columns;
}
