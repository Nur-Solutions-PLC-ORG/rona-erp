"use client";

import { useState } from "react";
import {
  HiOutlineFingerPrint,
  HiOutlineNewspaper,
} from "react-icons/hi2";
import { MOVEMENT_TYPE_LIST } from "@rona/config/inventory";
import { usePermissions } from "@/modules/workspace/hooks";
import {
  Card,
  Column,
  DataTable,
  EmptyState,
  FilterSelect,
  Pagination,
  PageHeader,
  StatusBadge,
  humanize,
} from "@/modules/workspace/components/ui";
import type { MovementDto } from "@rona/types/inventory";
import SearchInput from "@/components/custom/search-input";
import { useItemOptions, useMovements } from "../hooks";

export default function MovementsView() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("inventory.movement.read");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [itemId, setItemId] = useState("");

  const { movements, meta, isLoading } = useMovements(page, {
    type: type || undefined,
    itemId: itemId || undefined,
    searchQuery: search || undefined,
  });
  const { items, labelFor: itemLabelFor, nameFor: itemNameFor } = useItemOptions();

  if (!canRead) {
    return (
      <EmptyState
        icon={<HiOutlineFingerPrint className="w-6 h-6" />}
        title="Movements unavailable"
        description="You do not have permission to view stock movements. Contact an administrator."
      />
    );
  }

  const columns: Column<MovementDto>[] = [
    {
      key: "createdAt",
      header: "Date",
      className: "text-xs text-zinc-500",
      render: (row) => new Date(row.createdAt).toLocaleString(),
    },
    {
      key: "type",
      header: "Type",
      render: (row) => <StatusBadge status={row.type} />,
    },
    {
      key: "itemId",
      header: "Item",
      render: (row) => row.itemName ?? itemNameFor.get(row.itemId) ?? "—",
    },
    {
      key: "quantity",
      header: "Quantity",
      className: "font-mono text-xs tabular-nums text-right",
      render: (row) => Number(row.quantity).toString(),
    },
    {
      key: "lotId",
      header: "Lot",
      className: "font-mono text-xs",
      render: (row) => row.lotNumber || "—",
    },
    {
      key: "reference",
      header: "Reference",
      className: "text-xs",
      render: (row) => row.reference ?? "—",
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<HiOutlineNewspaper className="h-5 w-5" />}
        title="Movements"
        description="Immutable ledger of every receipt, issue, transfer, return, and adjustment."
      />

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <SearchInput
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search reference, item or lot…"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-zinc-600">Type</span>
            <FilterSelect
              className="w-full"
              value={type}
              onChange={(value) => {
                setType(value);
                setPage(1);
              }}
              options={MOVEMENT_TYPE_LIST.map((movementType) => ({
                label: humanize(movementType),
                value: movementType,
              }))}
              placeholder="All types"
            />
          </label>
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
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={movements}
        isLoading={isLoading}
        emptyMessage="No stock movements recorded yet."
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
    </div>
  );
}
