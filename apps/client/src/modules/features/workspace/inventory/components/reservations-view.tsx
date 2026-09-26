"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  HiOutlineBookmarkSquare,
  HiOutlineFingerPrint,
  HiOutlinePlus,
} from "react-icons/hi2";
import { reservationCreateSchema } from "@rona/validation/inventory";
import {
  ALLOCATION_STRATEGY_LIST,
  RESERVATION_STATUS_LIST,
} from "@rona/config/inventory";
import { usePermissions } from "@/modules/workspace/hooks";
import {
  BTN_PRIMARY,
  Card,
  Column,
  DataTable,
  EmptyState,
  FilterSelect,
  Pagination,
  PageHeader,
  StatusBadge,
} from "@/modules/workspace/components/ui";
import {
  FormModal,
  LabeledInput,
  LabeledSelect,
  LabeledTextarea,
  ModalActions,
} from "@/modules/workspace/components/form";
import type { ReservationDto } from "@rona/types/inventory";
import SearchInput from "@/components/custom/search-input";
import {
  useConsumeReservation,
  useCreateReservation,
  useItemOptions,
  useReleaseReservation,
  useReservations,
  useWarehouseOptions,
} from "../hooks";

const EMPTY_CREATE_FORM = {
  itemId: "",
  warehouseId: "",
  quantity: "",
  strategy: "",
  reference: "",
  notes: "",
};

export default function ReservationsView() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("inventory.reservation.read");
  const canCreate = hasPermission("inventory.reservation.create");
  const canRelease = hasPermission("inventory.reservation.release");
  const canConsume = hasPermission("inventory.reservation.consume");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [itemId, setItemId] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ ...EMPTY_CREATE_FORM });

  const { reservations, meta, isLoading } = useReservations(page, {
    status: status || undefined,
    itemId: itemId || undefined,
    searchQuery: search || undefined,
  });
  const { items, labelFor: itemLabelFor, nameFor: itemNameFor } = useItemOptions();
  const { warehouses, labelFor: warehouseLabelFor } = useWarehouseOptions();
  const createReservation = useCreateReservation();
  const releaseReservation = useReleaseReservation();
  const consumeReservation = useConsumeReservation();

  if (!canRead) {
    return (
      <EmptyState
        icon={<HiOutlineFingerPrint className="w-6 h-6" />}
        title="Reservations unavailable"
        description="You do not have permission to view reservations. Contact an administrator."
      />
    );
  }

  const submitCreate = () => {
    const parsed = reservationCreateSchema.safeParse({
      itemId: createForm.itemId,
      warehouseId: createForm.warehouseId,
      quantity: createForm.quantity,
      strategy: createForm.strategy || undefined,
      reference: createForm.reference || undefined,
      notes: createForm.notes || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please review the form.");
      return;
    }
    createReservation.mutate(parsed.data, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setCreateForm({ ...EMPTY_CREATE_FORM });
      },
    });
  };

  const columns: Column<ReservationDto>[] = [
    {
      key: "itemId",
      header: "Item",
      render: (row) => row.itemName ?? itemNameFor.get(row.itemId) ?? "—",
    },
    {
      key: "warehouseId",
      header: "Warehouse",
      render: (row) =>
        row.warehouseName ?? warehouseLabelFor.get(row.warehouseId) ?? "—",
    },
    {
      key: "quantity",
      header: "Quantity",
      className: "font-mono text-xs tabular-nums text-right",
      render: (row) => Number(row.quantity).toString(),
    },
    {
      key: "allocatedLots",
      header: "Allocated",
      className: "text-xs",
      render: (row) => `${row.allocatedLots?.length ?? 0} lot(s)`,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "reference",
      header: "Reference",
      className: "text-xs",
      render: (row) => row.reference ?? "—",
    },
    {
      key: "createdAt",
      header: "Created",
      className: "text-xs text-zinc-500",
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    ...(canRelease || canConsume
      ? [
          {
            key: "actions",
            header: "Actions",
            render: (row: ReservationDto) =>
              row.status === "ACTIVE" ? (
                <div className="flex items-center gap-3">
                  {canConsume && (
                    <button
                      type="button"
                      className="text-xs font-medium text-zinc-900 hover:underline"
                      onClick={() => consumeReservation.mutate(row.id)}
                    >
                      Consume
                    </button>
                  )}
                  {canRelease && (
                    <button
                      type="button"
                      className="text-xs font-medium text-rose-600 hover:underline"
                      onClick={() => releaseReservation.mutate(row.id)}
                    >
                      Release
                    </button>
                  )}
                </div>
              ) : (
                <span className="text-xs text-zinc-400">—</span>
              ),
          } satisfies Column<ReservationDto>,
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<HiOutlineBookmarkSquare className="h-5 w-5" />}
        title="Reservations"
        description="Reserve stock for upcoming production or orders before it is issued."
        actions={
          canCreate ? (
            <button
              type="button"
              className={BTN_PRIMARY}
              onClick={() => setIsCreateOpen(true)}
            >
              <HiOutlinePlus className="h-4 w-4" />
              New Reservation
            </button>
          ) : undefined
        }
      />

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <SearchInput
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search reference or item…"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-zinc-600">Status</span>
            <FilterSelect
              className="w-full"
              value={status}
              onChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
              options={RESERVATION_STATUS_LIST.map((reservationStatus) => ({
                label:
                  reservationStatus.charAt(0) +
                  reservationStatus.slice(1).toLowerCase(),
                value: reservationStatus,
              }))}
              placeholder="All statuses"
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
        rows={reservations}
        isLoading={isLoading}
        emptyMessage="No reservations yet. Reserve stock to hold it for planned use."
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

      {isCreateOpen && (
        <FormModal
          open
          onClose={() => setIsCreateOpen(false)}
          title="New Reservation"
          icon={<HiOutlineBookmarkSquare className="h-4 w-4" />}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <LabeledSelect
              label="Item"
              id="res-item"
              value={createForm.itemId}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, itemId: e.target.value }))
              }
            >
              <option value="">Select an item…</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {itemLabelFor.get(item.id)}
                </option>
              ))}
            </LabeledSelect>
            <LabeledSelect
              label="Warehouse"
              id="res-warehouse"
              value={createForm.warehouseId}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  warehouseId: e.target.value,
                }))
              }
            >
              <option value="">Select a warehouse…</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {warehouseLabelFor.get(w.id)}
                </option>
              ))}
            </LabeledSelect>
            <LabeledInput
              label="Quantity"
              id="res-quantity"
              value={createForm.quantity}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  quantity: e.target.value,
                }))
              }
              placeholder="e.g. 10.5"
            />
            <LabeledSelect
              label="Allocation strategy (optional)"
              id="res-strategy"
              value={createForm.strategy}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  strategy: e.target.value,
                }))
              }
            >
              <option value="">Default (FIFO)</option>
              {ALLOCATION_STRATEGY_LIST.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </LabeledSelect>
            <LabeledInput
              label="Reference (optional)"
              id="res-reference"
              value={createForm.reference}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  reference: e.target.value,
                }))
              }
              placeholder="e.g. SO-2026-031"
            />
            <LabeledTextarea
              label="Notes (optional)"
              id="res-notes"
              value={createForm.notes}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={2}
              placeholder="Why this stock is being held"
              className="sm:col-span-2"
            />
          </div>
          <ModalActions
            onCancel={() => setIsCreateOpen(false)}
            onSubmit={submitCreate}
            submitLabel="Create"
            isPending={createReservation.isPending}
          />
        </FormModal>
      )}
    </div>
  );
}
