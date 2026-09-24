"use client";

import { useState } from "react";
import { HiOutlineClipboard, HiOutlineFingerPrint, HiOutlinePlus } from "react-icons/hi2";
import { toast } from "sonner";
import type { InspectionDto } from "@rona/types/quality";
import { inspectionCreateSchema } from "@rona/validation/quality";
import { INSPECTION_STATUS_LIST, INSPECTION_TYPE_LIST } from "@rona/config/quality";
import { usePermissions } from "@/modules/workspace/hooks";
import { useItemOptions } from "../../inventory/hooks";
import { useLotsForItem } from "../../inventory/hooks";
import {
  BTN_PRIMARY,
  Card,
  type Column,
  DataTable,
  EmptyState,
  FilterSelect,
  PageHeader,
  Pagination,
  StatusBadge,
} from "@/modules/workspace/components/ui";
import {
  FormModal,
  LabeledInput,
  LabeledSelect,
  LabeledTextarea,
  ModalActions,
} from "@/modules/workspace/components/form";
import { useCreateInspection, useInspections } from "../hooks";
import { InspectionDetailsModal } from "./inspection-details";
import SearchInput from "@/components/custom/search-input";

export default function InspectionsView() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("quality.inspection.read");
  const canCreate = hasPermission("quality.inspection.create");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const { inspections, meta, isLoading } = useInspections(page, {
    status: statusFilter || undefined,
    type: typeFilter || undefined,
    searchQuery: search || undefined,
  });

  const [showCreate, setShowCreate] = useState(false);
  const [itemId, setItemId] = useState("");
  const [lotId, setLotId] = useState("");
  const [type, setType] = useState("INCOMING");
  const [inspectionNumber, setInspectionNumber] = useState("");
  const [notes, setNotes] = useState("");

  const [detailsFor, setDetailsFor] = useState<InspectionDto | null>(null);

  const { items, labelFor: itemLabelFor } = useItemOptions();
  const { lots } = useLotsForItem(itemId || undefined);
  const create = useCreateInspection();

  const totalPages = meta?.totalPages ?? 1;

  const resetCreate = () => {
    setItemId("");
    setLotId("");
    setType("INCOMING");
    setInspectionNumber("");
    setNotes("");
  };

  const submitCreate = () => {
    const parsed = inspectionCreateSchema.safeParse({
      lotId,
      type,
      inspectionNumber: inspectionNumber || undefined,
      notes: notes || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message);
      return;
    }
    create.mutate(parsed.data, {
      onSuccess: () => {
        resetCreate();
        setShowCreate(false);
      },
    });
  };

  const columns: Column<InspectionDto>[] = [
    {
      key: "inspectionNumber",
      header: "Inspection",
      render: (row) => <span className="font-mono text-xs font-medium">{row.inspectionNumber}</span>,
    },
    {
      key: "type",
      header: "Type",
      render: (row) => (
        <span className="text-xs text-gray-600">{row.type.replace(/_/g, " ")}</span>
      ),
    },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
    {
      key: "createdAt",
      header: "Created",
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      key: "completedAt",
      header: "Completed",
      render: (row) => (row.completedAt ? new Date(row.completedAt).toLocaleDateString() : "—"),
    },
    {
      key: "reviewedAt",
      header: "Reviewed",
      render: (row) => (row.reviewedAt ? new Date(row.reviewedAt).toLocaleDateString() : "—"),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <button
          type="button"
          onClick={() => setDetailsFor(row)}
          className="text-xs font-medium text-purple-600 hover:text-purple-500"
        >
          View
        </button>
      ),
    },
  ];

  if (!canRead) {
    return (
      <EmptyState
        icon={<HiOutlineFingerPrint />}
        title="Access restricted"
        description="You do not have permission to view quality inspections."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<HiOutlineClipboard />}
        title="Quality Inspections"
        description="Create inspections for lots, record test results, and release or reject quarantined stock."
      />

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search number, lot or item…"
          />
          <FilterSelect
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            options={INSPECTION_STATUS_LIST.map((status) => ({
              label: status.replace(/_/g, " "),
              value: status,
            }))}
            placeholder="All statuses"
          />
          <FilterSelect
            value={typeFilter}
            onChange={(value) => {
              setTypeFilter(value);
              setPage(1);
            }}
            options={INSPECTION_TYPE_LIST.map((type) => ({
              label: type.replace(/_/g, " "),
              value: type,
            }))}
            placeholder="All types"
          />
          {canCreate && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className={`${BTN_PRIMARY} ml-auto`}
            >
              <HiOutlinePlus className="h-4 w-4" /> New Inspection
            </button>
          )}
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={inspections}
        isLoading={isLoading}
        emptyMessage="No inspections found. Create one to get started."
      />

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      <FormModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Inspection"
        icon={<HiOutlineClipboard />}
      >
        <div className="space-y-3">
          <LabeledSelect
            label="Item"
            id="inspection-item"
            value={itemId}
            onChange={(e) => {
              setItemId(e.target.value);
              setLotId("");
            }}
          >
            <option value="">Select an item…</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {itemLabelFor.get(item.id)}
              </option>
            ))}
          </LabeledSelect>
          <LabeledSelect
            label="Lot"
            id="inspection-lot"
            value={lotId}
            onChange={(e) => setLotId(e.target.value)}
            disabled={!itemId}
          >
            <option value="">
              {itemId ? "Select a lot…" : "Select an item first"}
            </option>
            {lots.map((lot) => (
              <option key={lot.id} value={lot.id}>
                {lot.lotNumber}
              </option>
            ))}
          </LabeledSelect>
          <LabeledSelect
            label="Type"
            id="inspection-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {INSPECTION_TYPE_LIST.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </LabeledSelect>
          <LabeledInput
            label="Inspection number (optional)"
            id="inspection-number"
            value={inspectionNumber}
            onChange={(e) => setInspectionNumber(e.target.value)}
            placeholder="Auto-generated if left blank"
          />
          <LabeledTextarea
            label="Notes"
            id="inspection-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <ModalActions
            onCancel={() => setShowCreate(false)}
            onSubmit={submitCreate}
            submitLabel="Create inspection"
            isPending={create.isPending}
          />
        </div>
      </FormModal>

      {detailsFor && (
        <InspectionDetailsModal
          inspection={detailsFor}
          open={detailsFor !== null}
          onClose={() => setDetailsFor(null)}
        />
      )}
    </div>
  );
}
