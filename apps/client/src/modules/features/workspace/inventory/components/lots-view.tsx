"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HiOutlineFingerPrint, HiOutlinePencilSquare, HiOutlinePlus } from "react-icons/hi2";
import { lotCreateSchema, lotQualityStatusUpdateSchema } from "@rona/validation/inventory";
import type { LotDto } from "@rona/types/inventory";
import { QUALITY_STATUS_LIST } from "@rona/config/inventory";
import { usePermissions } from "@/modules/workspace/hooks";
import {
  BTN_PRIMARY,
  Card,
  Column,
  DataTable,
  EmptyState,
  Pagination,
  PageHeader,
  StatusBadge,
  humanize,
} from "@/modules/workspace/components/ui";
import {
  FormModal,
  LabeledInput,
  LabeledSelect,
  ModalActions,
} from "@/modules/workspace/components/form";
import {
  useCreateLot,
  useItemOptions,
  useLots,
  useUpdateLotQualityStatus,
} from "../hooks";
import SearchInput from "@/components/custom/search-input";

const EMPTY_CREATE_FORM = {
  itemId: "",
  lotNumber: "",
  supplier: "",
  receiptDate: "",
  manufactureDate: "",
  expiryDate: "",
  qualityStatus: "",
};

const EMPTY_STATUS_FORM = { qualityStatus: "" };

export default function LotsView() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("inventory.lot.read");
  const canCreate = hasPermission("inventory.lot.create");
  const canUpdate = hasPermission("inventory.lot.update");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [itemId, setItemId] = useState("");
  const [qualityStatus, setQualityStatus] = useState("");
  const [excludeExpired, setExcludeExpired] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ ...EMPTY_CREATE_FORM });
  const [statusFor, setStatusFor] = useState<LotDto | null>(null);
  const [statusForm, setStatusForm] = useState({ ...EMPTY_STATUS_FORM });

  const { lots, meta, isLoading } = useLots(page, {
    itemId: itemId || undefined,
    qualityStatus: qualityStatus || undefined,
    excludeExpired,
    searchQuery: search || undefined,
  });
  const { items, labelFor: itemLabelFor, nameFor: itemNameFor } = useItemOptions();
  const createLot = useCreateLot();
  const updateStatus = useUpdateLotQualityStatus();

  if (!canRead) {
    return (
      <EmptyState
        icon={<HiOutlineFingerPrint className="w-6 h-6" />}
        title="Lots unavailable"
        description="You do not have permission to view lots. Contact an administrator."
      />
    );
  }

  const submitCreate = () => {
    const parsed = lotCreateSchema.safeParse({
      itemId: createForm.itemId,
      lotNumber: createForm.lotNumber,
      supplier: createForm.supplier || undefined,
      receiptDate: createForm.receiptDate || undefined,
      manufactureDate: createForm.manufactureDate || undefined,
      expiryDate: createForm.expiryDate || undefined,
      qualityStatus: createForm.qualityStatus || undefined,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid lot details");
      return;
    }

    createLot.mutate(parsed.data, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setCreateForm({ ...EMPTY_CREATE_FORM });
      },
    });
  };

  const submitStatus = () => {
    if (!statusFor) return;

    const parsed = lotQualityStatusUpdateSchema.safeParse({
      qualityStatus: statusForm.qualityStatus,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid quality status");
      return;
    }

    updateStatus.mutate(
      { id: statusFor.id, ...parsed.data },
      {
        onSuccess: () => {
          setStatusFor(null);
          setStatusForm({ ...EMPTY_STATUS_FORM });
        },
      },
    );
  };

  const columns: Column<LotDto>[] = [
    {
      key: "lotNumber",
      header: "Lot Number",
      render: (row) => (
        <span className="font-mono text-zinc-600">{row.lotNumber}</span>
      ),
    },
    {
      key: "item",
      header: "Item",
      render: (row) => row.itemName ?? itemNameFor.get(row.itemId) ?? "—",
    },
    {
      key: "supplier",
      header: "Supplier",
      render: (row) => row.supplier ?? "—",
    },
    {
      key: "qualityStatus",
      header: "Status",
      render: (row) => <StatusBadge status={row.qualityStatus} />,
    },
    {
      key: "expiryDate",
      header: "Expiry",
      render: (row) =>
        row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : "—",
    },
    {
      key: "receiptDate",
      header: "Received",
      render: (row) =>
        row.receiptDate ? new Date(row.receiptDate).toLocaleDateString() : "—",
    },
    ...(canUpdate
      ? [
          {
            key: "actions",
            header: "Actions",
            render: (row: LotDto) => (
              <button
                type="button"
                onClick={() => {
                  setStatusForm({ qualityStatus: row.qualityStatus });
                  setStatusFor(row);
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
              >
                <HiOutlinePencilSquare className="h-3.5 w-3.5" />
                Status
              </button>
            ),
          } satisfies Column<LotDto>,
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<HiOutlineFingerPrint className="w-5 h-5" />}
        title="Lots"
        description="Supplier batches tracked through inventory and quality"
        actions={
          canCreate ? (
            <button
              type="button"
              className={BTN_PRIMARY}
              onClick={() => setIsCreateOpen(true)}
            >
              <HiOutlinePlus className="w-4 h-4" />
              New Lot
            </button>
          ) : undefined
        }
      />

      <Card className="p-3">
        <div className="flex flex-wrap items-end gap-3">
          <SearchInput
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search lot number or item…"
          />
          <LabeledSelect
            label="Item"
            id="filter-lot-item"
            value={itemId}
            onChange={(event) => {
              setItemId(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All items</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {itemLabelFor.get(item.id)}
              </option>
            ))}
          </LabeledSelect>
          <LabeledSelect
            label="Quality status"
            id="filter-lot-status"
            value={qualityStatus}
            onChange={(event) => {
              setQualityStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {QUALITY_STATUS_LIST.map((status) => (
              <option key={status} value={status}>
                {humanize(status)}
              </option>
            ))}
          </LabeledSelect>
          <label className="flex items-center gap-2 text-xs font-medium text-zinc-600">
            <input
              type="checkbox"
              checked={excludeExpired}
              onChange={(event) => {
                setExcludeExpired(event.target.checked);
                setPage(1);
              }}
              className="w-3.5 h-3.5 rounded accent-zinc-900"
            />
            Exclude expired
          </label>
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={lots}
        isLoading={isLoading}
        emptyMessage="No lots found."
        emptyDescription="Create a lot to track supplier batches through inventory and quality."
        emptyAction={
          canCreate ? (
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800"
              onClick={() => setIsCreateOpen(true)}
            >
              <HiOutlinePlus className="h-4 w-4" />
              New Lot
            </button>
          ) : undefined
        }
        footer={
          meta && meta.totalPages > 1 ? (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              onPageChange={setPage}
            />
          ) : null
        }
      />

      <FormModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Lot"
        icon={<HiOutlineFingerPrint className="w-4 h-4" />}
      >
        <div className="space-y-3">
          <LabeledSelect
            label="Item"
            id="lot-item"
            value={createForm.itemId}
            onChange={(event) =>
              setCreateForm((previous) => ({ ...previous, itemId: event.target.value }))
            }
          >
            <option value="">Select an item…</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {itemLabelFor.get(item.id)}
              </option>
            ))}
          </LabeledSelect>
          <LabeledInput
            label="Lot number"
            id="lot-number"
            value={createForm.lotNumber}
            onChange={(event) =>
              setCreateForm((previous) => ({
                ...previous,
                lotNumber: event.target.value,
              }))
            }
            placeholder="e.g. LOT-2026-001"
          />
          <LabeledInput
            label="Supplier (optional)"
            id="lot-supplier"
            value={createForm.supplier}
            onChange={(event) =>
              setCreateForm((previous) => ({
                ...previous,
                supplier: event.target.value,
              }))
            }
          />
          <div className="grid grid-cols-3 gap-3">
            <LabeledInput
              label="Receipt date"
              id="lot-receipt-date"
              type="date"
              value={createForm.receiptDate}
              onChange={(event) =>
                setCreateForm((previous) => ({
                  ...previous,
                  receiptDate: event.target.value,
                }))
              }
            />
            <LabeledInput
              label="Manufactured"
              id="lot-manufacture-date"
              type="date"
              value={createForm.manufactureDate}
              onChange={(event) =>
                setCreateForm((previous) => ({
                  ...previous,
                  manufactureDate: event.target.value,
                }))
              }
            />
            <LabeledInput
              label="Expiry"
              id="lot-expiry-date"
              type="date"
              value={createForm.expiryDate}
              onChange={(event) =>
                setCreateForm((previous) => ({
                  ...previous,
                  expiryDate: event.target.value,
                }))
              }
            />
          </div>
          <LabeledSelect
            label="Quality status"
            id="lot-quality-status"
            value={createForm.qualityStatus}
            onChange={(event) =>
              setCreateForm((previous) => ({
                ...previous,
                qualityStatus: event.target.value,
              }))
            }
          >
            <option value="">Pending (default)</option>
            {QUALITY_STATUS_LIST.map((status) => (
              <option key={status} value={status}>
                {humanize(status)}
              </option>
            ))}
          </LabeledSelect>
        </div>
        <ModalActions
          onCancel={() => setIsCreateOpen(false)}
          onSubmit={submitCreate}
          submitLabel="Create Lot"
          isPending={createLot.isPending}
        />
      </FormModal>

      <FormModal
        open={statusFor !== null}
        onClose={() => setStatusFor(null)}
        title={`Quality Status — ${statusFor?.lotNumber ?? ""}`}
        icon={<HiOutlinePencilSquare className="w-4 h-4" />}
      >
        <div className="space-y-3">
          <LabeledSelect
            label="Quality status"
            id="update-lot-status"
            value={statusForm.qualityStatus}
            onChange={(event) =>
              setStatusForm((previous) => ({
                ...previous,
                qualityStatus: event.target.value,
              }))
            }
          >
            <option value="">Select a status…</option>
            {QUALITY_STATUS_LIST.map((status) => (
              <option key={status} value={status}>
                {humanize(status)}
              </option>
            ))}
          </LabeledSelect>
        </div>
        <ModalActions
          onCancel={() => setStatusFor(null)}
          onSubmit={submitStatus}
          submitLabel="Update Status"
          isPending={updateStatus.isPending}
        />
      </FormModal>
    </div>
  );
}
