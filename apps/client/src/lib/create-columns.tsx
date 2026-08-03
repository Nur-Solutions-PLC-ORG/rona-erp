import { Badge } from "@/components/ui/badge";
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
import { cn } from "./utils";

type ExtraColumn<T> = {
  id?: string;
  // accessorKey is used to access the value from the row object, while accessorFn is a function that takes the row object and returns the value. You can use either one, but not both.
  accessorKey?: string;
  accessorFn?: (row: T) => unknown;
  //
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
  customActionsCell?: (row: Row<T>) => React.ReactNode;
  actionsItems?: ActionItem<T>[];
}

export function createColumns<T>({
  includeSelect = false,
  includeActions = false,
  extraColumns = [],
  customActionsCell,
  actionsItems = [],
}: CreateColumnsOptions<T>): ColumnDef<T>[] {
  const columns: ColumnDef<T>[] = [];

  // including selection
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

  // extra columns
  for (const col of extraColumns) {
    const key = col.accessorKey;

    const defaultCell = ({ row }: { row: Row<T> }) => {
      // Resolve value from accessorFn or accessorKey (dot-notation works natively)
      const value = col.accessorFn
        ? col.accessorFn(row.original)
        : key !== undefined
          ? row.getValue(key)
          : undefined;

      const style: React.CSSProperties = {};

      if (col.isRaw) {
        return (
          <Badge
            variant={"secondary"}
            className={cn(
              "bg-taupe-900/5 text-sm!",
              col.isBold && "font-bold!",
              col.isMono && "font-mono!",
            )}
          >
            {String(value)}
          </Badge>
        );
      }

      if (typeof value == "object" && Array.isArray(value)) {
        if (value.length <= 0) {
          return <span className="opacity-50">None</span>;
        }

        return (
          <div className="flex gap-2">
            {value.slice(0, 2).map((item) => (
              <p
                className="bg-black/5 rounded-lg text-sm font-semibold h-5 px-2"
                key={item}
              >
                {item}
              </p>
            ))}
            {value.length > 2 && (
              <span className="text-xl flex items-center leading-5">. . .</span>
            )}
          </div>
        );
      }

      if (!value) {
        style.opacity = "50%";
      }

      if (col.isBold) {
        style.fontWeight = "600";
      }

      if (col.coloring) {
        const color = col.coloring[String(value)] || "#222";

        return (
          <Badge
            style={
              value
                ? {
                    backgroundColor: color + "15",
                    color: color,
                  }
                : {}
            }
            variant={value ? "default" : "secondary"}
            className={cn(
              "text-sm capitalize rounded-lg h-5 brightness-75 font-semibold! relative",
              !value && "text-zinc-400",
              col.isMono && "font-mono!",
            )}
          >
            {!value ? "None" : String(value)}
          </Badge>
        );
      }

      return (
        <div
          style={style}
          className={cn(
            !col.isBold && !col.coloring && "",
            col.highlight && "text-primary underline brightness-50",
          )}
        >
          <span className="z-10">
            {!value ? (
              "None"
            ) : col.isDate ? (
              <span className="flex text-base items-center gap-4">
                {format(new Date(value as string), "dd MMM yyyy")}{" "}
                {col.daysLeft &&
                  (isPast(new Date(value as string)) ? (
                    <Badge
                      variant={"destructive"}
                      className="block brightness-75 rounded-xl"
                    >
                      Expired
                    </Badge>
                  ) : (
                    <>
                      <span className="text-sm! block opacity-80 font-medium">
                        {formatDistanceToNowStrict(new Date(value as string))}{" "}
                        left
                      </span>
                    </>
                  ))}
              </span>
            ) : col.isTime ? (
              <>
                {format(
                  toZonedTime(new Date(value as string), "Etc/GMT"),
                  "h:mm aaa",
                )}
                <span className="text-xs! block opacity-70">
                  {format(new Date(value as string), "dd MMM yyyy")}
                </span>
              </>
            ) : col.isPrice ? (
              `Br ${Number(value).toLocaleString()}`
            ) : col.onRender ? (
              col.onRender(value)
            ) : (
              String(value)
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

  // adding actions
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
              className="w-52"
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
