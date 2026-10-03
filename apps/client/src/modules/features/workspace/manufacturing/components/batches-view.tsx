"use client";

import { useState } from "react";
import {
  HiOutlineCube,
  HiOutlineFingerPrint,
  HiOutlinePlay,
} from "react-icons/hi2";
import { PRODUCTION_BATCH_STATUS_LIST } from "@rona/config/manufacturing";
import type { ProductionBatchDto } from "@rona/types/manufacturing";
import { usePermissions } from "@/modules/workspace/hooks";
import {
  Card,
  DataTable,
  EmptyState,
  FilterSelect,
  PageHeader,
  Pagination,
  StatusBadge,
  type Column,
} from "@/modules/workspace/components/ui";
import { useActiveOrderOptions, useBatches } from "../hooks";
import { BatchOperationsModal } from "./batch-operations";
import SearchInput from "@/components/custom/search-input";

export default function BatchesView() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("manufacturing.production.read");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [productionOrderId, setProductionOrderId] = useState("");
  const [status, setStatus] = useState("");
  const [operationsFor, setOperationsFor] = useState<ProductionBatchDto | null>(
    null,
  );

  const { batches, meta, isLoading } = useBatches(page, {
    productionOrderId: productionOrderId || undefined,
    status: status || undefined,
    searchQuery: search || undefined,
  });
  const { orders, labelFor: orderLabelFor } = useActiveOrderOptions();

  const columns: Column<ProductionBatchDto>[] = [
    {
      key: "batchNumber",
      header: "Batch #",
      render: (batch) => (
        <span className="font-mono font-semibold text-zinc-800">
          {batch.batchNumber}
        </span>
      ),
    },
    {
      key: "order",
      header: "Production Order",
      render: (batch) => (
        <span className="text-zinc-700">
          {orderLabelFor.get(batch.productionOrderId) ??
            batch.productionOrderId}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (batch) => <StatusBadge status={batch.status} />,
    },
    {
      key: "scrap",
      header: "Scrap Qty",
      render: (batch) => (
        <span className="font-mono text-zinc-600">{batch.scrapQuantity}</span>
      ),
    },
    {
      key: "started",
      header: "Started",
      render: (batch) => (
        <span className="text-zinc-500 font-mono">
          {new Date(batch.startedAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: "completed",
      header: "Completed",
      render: (batch) => (
        <span className="text-zinc-500 font-mono">
          {batch.completedAt
            ? new Date(batch.completedAt).toLocaleString()
            : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (batch) => (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setOperationsFor(batch)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-zinc-100 text-zinc-600 text-xs font-medium transition"
          >
            <HiOutlinePlay className="w-3.5 h-3.5" />
            {batch.status === "IN_PROGRESS" ? "Execute" : "Details"}
          </button>
        </div>
      ),
    },
  ];

  if (!canRead) {
    return (
      <EmptyState
        icon={<HiOutlineFingerPrint className="w-6 h-6" />}
        title="Access restricted"
        description="You do not have permission to view production batches."
      />
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<HiOutlineCube className="w-5 h-5" />}
        title="Production Batches"
        description="Execute batches — consume materials, record output and complete production runs."
      />

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search batch or order number…"
          />
          <FilterSelect
            value={productionOrderId}
            onChange={(value) => {
              setProductionOrderId(value);
              setPage(1);
            }}
            options={orders.map((order) => ({
              label: orderLabelFor.get(order.id) ?? "",
              value: order.id,
            }))}
            placeholder="All orders"
          />
          <FilterSelect
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            options={PRODUCTION_BATCH_STATUS_LIST.map((value) => ({
              label: value,
              value,
            }))}
            placeholder="All statuses"
          />
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={batches}
        isLoading={isLoading}
        emptyMessage="No production batches found."
        footer={
          meta && meta.totalPages > 1 ? (
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              onPageChange={setPage}
            />
          ) : null
        }
      />

      {operationsFor ? (
        <BatchOperationsModal
          batch={operationsFor}
          onClose={() => setOperationsFor(null)}
        />
      ) : null}
    </div>
  );
}
