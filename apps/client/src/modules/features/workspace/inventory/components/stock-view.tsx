"use client";

import { useState } from "react";
import {
  HiOutlineAdjustmentsHorizontal,
  HiOutlineArchiveBox,
  HiOutlineArrowDownTray,
  HiOutlineArrowUpTray,
  HiOutlineArrowUturnLeft,
  HiOutlineArrowsRightLeft,
  HiOutlineFingerPrint,
} from "react-icons/hi2";
import { usePermissions } from "@/modules/workspace/hooks";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  Card,
  Column,
  DataTable,
  EmptyState,
  FilterSelect,
  Pagination,
  PageHeader,
} from "@/modules/workspace/components/ui";
import type { StockBalanceDto } from "@rona/types/inventory";
import SearchInput from "@/components/custom/search-input";
import {
  useItemOptions,
  useStockBalances,
  useWarehouseOptions,
} from "../hooks";
import {
  StockOperations,
  type StockOperation,
} from "./stock-operations";

export default function StockView() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("inventory.stock.read");
  const canReceive = hasPermission("inventory.stock.receive");
  const canIssue = hasPermission("inventory.stock.issue");
  const canTransfer = hasPermission("inventory.stock.transfer");
  const canAdjust = hasPermission("inventory.stock.adjust");
  const canReturn = hasPermission("inventory.stock.return");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [itemId, setItemId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [operation, setOperation] = useState<StockOperation | null>(null);

  const { balances, meta, isLoading } = useStockBalances(page, {
    itemId: itemId || undefined,
    warehouseId: warehouseId || undefined,
    searchQuery: search || undefined,
  });
  const { items, labelFor: itemLabelFor, nameFor: itemNameFor } = useItemOptions();
  const { warehouses, labelFor: warehouseLabelFor } = useWarehouseOptions();

  if (!canRead) {
    return (
      <EmptyState
        icon={<HiOutlineFingerPrint className="w-6 h-6" />}
        title="Stock unavailable"
        description="You do not have permission to view stock balances. Contact an administrator."
      />
    );
  }

  const columns: Column<StockBalanceDto>[] = [
    {
      key: "itemId",
      header: "Item",
      render: (row) => row.itemName ?? itemNameFor.get(row.itemId) ?? "—",
    },
    {
      key: "lotId",
      header: "Lot",
      className: "font-mono text-xs",
      render: (row) => row.lotNumber || "—",
    },
    {
      key: "locationId",
      header: "Location",
      className: "font-mono text-xs",
      render: (row) => row.locationName || "—",
    },
    {
      key: "quantity",
      header: "Quantity",
      className: "font-mono text-xs tabular-nums text-right",
      render: (row) => Number(row.quantity).toString(),
    },
    {
      key: "reservedQuantity",
      header: "Reserved",
      className: "font-mono text-xs tabular-nums text-right",
      render: (row) => Number(row.reservedQuantity).toString(),
    },
    {
      key: "updatedAt",
      header: "Updated",
      className: "text-xs text-zinc-500",
      render: (row) => new Date(row.updatedAt).toLocaleString(),
    },
  ];

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      {canReceive && (
        <button
          type="button"
          className={BTN_PRIMARY}
          onClick={() => setOperation("receive")}
        >
          <HiOutlineArrowDownTray className="h-4 w-4" />
          Receive
        </button>
      )}
      {canIssue && (
        <button
          type="button"
          className={BTN_SECONDARY}
          onClick={() => setOperation("issue")}
        >
          <HiOutlineArrowUpTray className="h-4 w-4" />
          Issue
        </button>
      )}
      {canTransfer && (
        <button
          type="button"
          className={BTN_SECONDARY}
          onClick={() => setOperation("transfer")}
        >
          <HiOutlineArrowsRightLeft className="h-4 w-4" />
          Transfer
        </button>
      )}
      {canAdjust && (
        <button
          type="button"
          className={BTN_SECONDARY}
          onClick={() => setOperation("adjust")}
        >
          <HiOutlineAdjustmentsHorizontal className="h-4 w-4" />
          Adjust
        </button>
      )}
      {canReturn && (
        <button
          type="button"
          className={BTN_SECONDARY}
          onClick={() => setOperation("return")}
        >
          <HiOutlineArrowUturnLeft className="h-4 w-4" />
          Return
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<HiOutlineArchiveBox className="h-5 w-5" />}
        title="Stock"
        description="On-hand balances per item, lot, and location across your warehouses."
        actions={actions}
      />

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <SearchInput
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search item code, name or lot…"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-zinc-600">Item</span>
            <FilterSelect
              className="w-full"
              value={itemId}
              onChange={(value) => {
                setItemId(value);
                setPage(1);
              }}
              options={items.map((item) => ({
                label: itemLabelFor.get(item.id) ?? "",
                value: item.id,
              }))}
              placeholder="All items"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-zinc-600">Warehouse</span>
            <FilterSelect
              className="w-full"
              value={warehouseId}
              onChange={(value) => {
                setWarehouseId(value);
                setPage(1);
              }}
              options={warehouses.map((w) => ({
                label: warehouseLabelFor.get(w.id) ?? "",
                value: w.id,
              }))}
              placeholder="All warehouses"
            />
          </label>
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={balances}
        isLoading={isLoading}
        emptyMessage="No stock on hand yet. Receive stock to get started."
        footer={
          meta && meta.totalPages > 1 ? (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              onPageChange={setPage}
            />
          ) : undefined
        }
      />

      {operation && (
        <StockOperations
          operation={operation}
          onClose={() => setOperation(null)}
        />
      )}
    </div>
  );
}
