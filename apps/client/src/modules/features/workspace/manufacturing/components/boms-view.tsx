"use client";

import { useState } from "react";
import {
  HiOutlineClock,
  HiOutlineFingerPrint,
  HiOutlinePlus,
  HiOutlineSquares2X2,
} from "react-icons/hi2";
import { toast } from "sonner";
import { bomCreateSchema } from "@rona/validation/manufacturing";
import { usePermissions } from "@/modules/workspace/hooks";
import { useItemOptions } from "../../inventory/hooks";
import {
  BTN_PRIMARY,
  Card,
  DataTable,
  EmptyState,
  FilterSelect,
  PageHeader,
  Pagination,
  type Column,
} from "@/modules/workspace/components/ui";
import {
  FormModal,
  LabeledInput,
  LabeledSelect,
  LabeledTextarea,
  ModalActions,
} from "@/modules/workspace/components/form";
import { useBoms, useCreateBom } from "../hooks";
import type { BomDto } from "@rona/types/manufacturing";
import {
  BomLinesEditor,
  EMPTY_BOM_LINE,
  type LineDraft,
} from "./bom-lines-editor";
import { BomVersionsModal } from "./bom-versions";

export default function BomsView() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("manufacturing.bom.read");
  const canCreate = hasPermission("manufacturing.bom.create");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [itemId, setItemId] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [versionsFor, setVersionsFor] = useState<BomDto | null>(null);

  const { boms, meta, isLoading } = useBoms(page, {
    searchQuery: search || undefined,
    itemId: itemId || undefined,
  });
  const { items, nameFor: itemNameFor } = useItemOptions();

  const itemOptions = items.map((item) => ({
    id: item.id,
    label: `${item.code} — ${item.name}`,
  }));

  const columns: Column<BomDto>[] = [
    {
      key: "code",
      header: "Code",
      render: (bom) => (
        <span className="font-mono font-semibold text-zinc-800">{bom.code}</span>
      ),
    },
    {
      key: "name",
      header: "Name",
      render: (bom) => <span className="text-zinc-700">{bom.name}</span>,
    },
    {
      key: "item",
      header: "Finished Good",
      render: (bom) => (
        <span className="text-zinc-700">
          {itemNameFor.get(bom.itemId) ?? bom.itemId}
        </span>
      ),
    },
    {
      key: "created",
      header: "Created",
      render: (bom) => (
        <span className="text-zinc-500 font-mono">
          {new Date(bom.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (bom) => (
        <button
          type="button"
          onClick={() => setVersionsFor(bom)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 text-xs font-medium transition"
        >
          <HiOutlineClock className="w-3.5 h-3.5" />
          Versions
        </button>
      ),
    },
  ];

  if (!canRead) {
    return (
      <EmptyState
        icon={<HiOutlineFingerPrint className="w-6 h-6" />}
        title="Access restricted"
        description="You do not have permission to view bills of materials."
      />
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<HiOutlineSquares2X2 className="w-5 h-5" />}
        title="Bills of Materials"
        description="Recipe definitions for finished goods, versioned and approved before production."
        actions={
          canCreate ? (
            <button type="button" className={BTN_PRIMARY} onClick={() => setCreateOpen(true)}>
              <HiOutlinePlus className="w-4 h-4" />
              New BOM
            </button>
          ) : undefined
        }
      />

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search BOM code or name..."
            className="w-64 px-3 py-1.5 rounded-lg bg-zinc-50 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:bg-white transition text-xs"
          />
          <FilterSelect
            value={itemId}
            onChange={(value) => {
              setItemId(value);
              setPage(1);
            }}
            options={items.map((item) => ({
              label: `${item.code} — ${item.name}`,
              value: item.id,
            }))}
            placeholder="All items"
          />
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={boms}
        isLoading={isLoading}
        emptyMessage="No bills of materials found."
        emptyDescription="Create a BOM to define how finished goods are assembled."
        emptyAction={
          canCreate ? (
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800"
              onClick={() => setCreateOpen(true)}
            >
              <HiOutlinePlus className="h-4 w-4" />
              New BOM
            </button>
          ) : undefined
        }
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

      <CreateBomModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        itemOptions={itemOptions}
      />

      <BomVersionsModal bom={versionsFor} onClose={() => setVersionsFor(null)} />
    </div>
  );
}

function CreateBomModal({
  open,
  onClose,
  itemOptions,
}: {
  open: boolean;
  onClose: () => void;
  itemOptions: { id: string; label: string }[];
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [itemId, setItemId] = useState("");
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([{ ...EMPTY_BOM_LINE }]);

  const { mutate, isPending } = useCreateBom();

  const reset = () => {
    setCode("");
    setName("");
    setItemId("");
    setDescription("");
    setLines([{ ...EMPTY_BOM_LINE }]);
  };

  const submit = () => {
    const parsed = bomCreateSchema.safeParse({
      code,
      name,
      itemId,
      description: description || undefined,
      lines: lines.map((line) => ({
        componentItemId: line.componentItemId,
        quantityPerUnit: line.quantityPerUnit,
        notes: line.notes || undefined,
      })),
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid BOM data");
      return;
    }

    mutate(
      { body: parsed.data },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      },
    );
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="New Bill of Materials"
      icon={<HiOutlineSquares2X2 className="w-4 h-4" />}
      maxWidth="max-w-2xl"
    >
      <div className="grid grid-cols-2 gap-3">
        <LabeledInput
          label="Code"
          id="bom-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="e.g. DESK-STD"
        />
        <LabeledInput
          label="Name"
          id="bom-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Standard Desk"
        />
      </div>
      <LabeledSelect
        label="Finished Good Item"
        id="bom-item"
        value={itemId}
        onChange={(event) => setItemId(event.target.value)}
      >
        <option value="">Select item...</option>
        {itemOptions.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </LabeledSelect>
      <LabeledTextarea
        label="Description (optional)"
        id="bom-description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Notes about this BOM..."
      />

      <BomLinesEditor
        lines={lines}
        onChange={setLines}
        itemOptions={itemOptions}
      />

      <ModalActions
        onCancel={onClose}
        onSubmit={submit}
        submitLabel="Create BOM"
        isPending={isPending}
      />
    </FormModal>
  );
}
