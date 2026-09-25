"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  HiOutlineArchiveBox,
  HiOutlineCube,
  HiOutlinePencilSquare,
  HiOutlinePlus,
} from "react-icons/hi2";
import { ITEM_TYPE_LIST } from "@rona/config/inventory";
import {
  itemCreateSchema,
  itemUpdateSchema,
  unitOfMeasureCreateSchema,
} from "@rona/validation/inventory";
import type { ItemDto, UnitOfMeasureDto } from "@rona/types/inventory";
import { usePermissions } from "@/modules/workspace/hooks";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  Card,
  Column,
  DataTable,
  EmptyState,
  FilterSelect,
  humanize,
  Pagination,
  PageHeader,
  RowActionsMenu,
  StatusBadge,
} from "@/modules/workspace/components/ui";
import {
  FormModal,
  LabeledInput,
  LabeledSelect,
  LabeledTextarea,
  ModalActions,
} from "@/modules/workspace/components/form";
import SearchInput from "@/components/custom/search-input";
import {
  useArchiveItem,
  useCreateItem,
  useCreateUnitOfMeasure,
  useItems,
  useUnitsOfMeasure,
  useUpdateItem,
} from "../hooks";

const fmtQty = (value: string | null): string =>
  value === null ? "—" : Number(value).toString();

const EMPTY_ITEM_FORM = {
  code: "",
  name: "",
  description: "",
  type: "",
  unitOfMeasureId: "",
  reorderPoint: "",
  reorderQuantity: "",
  barcode: "",
};

const EMPTY_UOM_FORM = { code: "", name: "" };

export default function ItemsView() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("inventory.item.read");
  const canCreate = hasPermission("inventory.item.create");
  const canUpdate = hasPermission("inventory.item.update");
  const canArchive = hasPermission("inventory.item.archive");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUomOpen, setIsUomOpen] = useState(false);
  const [editing, setEditing] = useState<ItemDto | null>(null);
  const [itemForm, setItemForm] = useState({ ...EMPTY_ITEM_FORM });
  const [uomForm, setUomForm] = useState({ ...EMPTY_UOM_FORM });

  const { items, meta, isLoading } = useItems(page, {
    type: typeFilter || undefined,
    includeArchived,
    searchQuery: search || undefined,
  });
  const { units } = useUnitsOfMeasure();
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const archiveItem = useArchiveItem();
  const createUnitOfMeasure = useCreateUnitOfMeasure();

  if (!canRead) {
    return (
      <EmptyState
        icon={<HiOutlineCube className="w-6 h-6" />}
        title="Items unavailable"
        description="You do not have permission to view inventory items. Contact an administrator."
      />
    );
  }

  const uomLabelFor = (id: string): string =>
    units.find((unit) => unit.id === id)?.code ?? "—";

  const updateItemForm = (key: keyof typeof EMPTY_ITEM_FORM, value: string) =>
    setItemForm((previous) => ({ ...previous, [key]: value }));

  const openCreate = () => {
    setItemForm({ ...EMPTY_ITEM_FORM });
    setIsCreateOpen(true);
  };

  const openEdit = (item: ItemDto) => {
    setItemForm({
      code: item.code,
      name: item.name,
      description: item.description ?? "",
      type: item.type,
      unitOfMeasureId: item.unitOfMeasureId,
      reorderPoint: item.reorderPoint ?? "",
      reorderQuantity: item.reorderQuantity ?? "",
      barcode: item.barcode ?? "",
    });
    setEditing(item);
  };

  const submitCreate = () => {
    const parsed = itemCreateSchema.safeParse({
      code: itemForm.code,
      name: itemForm.name,
      description: itemForm.description || undefined,
      type: itemForm.type,
      unitOfMeasureId: itemForm.unitOfMeasureId,
      reorderPoint: itemForm.reorderPoint || undefined,
      reorderQuantity: itemForm.reorderQuantity || undefined,
      barcode: itemForm.barcode || undefined,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid item details");
      return;
    }

    createItem.mutate(parsed.data, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setItemForm({ ...EMPTY_ITEM_FORM });
      },
    });
  };

  const submitUpdate = () => {
    if (!editing) return;

    const parsed = itemUpdateSchema.safeParse({
      code: itemForm.code,
      name: itemForm.name,
      description: itemForm.description || undefined,
      type: itemForm.type,
      unitOfMeasureId: itemForm.unitOfMeasureId,
      reorderPoint: itemForm.reorderPoint || undefined,
      reorderQuantity: itemForm.reorderQuantity || undefined,
      barcode: itemForm.barcode || undefined,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid item details");
      return;
    }

    updateItem.mutate(
      { id: editing.id, ...parsed.data },
      {
        onSuccess: () => {
          setEditing(null);
          setItemForm({ ...EMPTY_ITEM_FORM });
        },
      },
    );
  };

  const submitUom = () => {
    const parsed = unitOfMeasureCreateSchema.safeParse({
      code: uomForm.code,
      name: uomForm.name,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid unit details");
      return;
    }

    createUnitOfMeasure.mutate(parsed.data, {
      onSuccess: () => {
        setIsUomOpen(false);
        setUomForm({ ...EMPTY_UOM_FORM });
      },
    });
  };

  const columns: Column<ItemDto>[] = [
    {
      key: "code",
      header: "Code",
      render: (row) => (
        <span className="font-mono text-slate-600">{row.code}</span>
      ),
    },
    {
      key: "name",
      header: "Name",
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.name}</p>
          {row.barcode ? (
            <p className="text-slate-400 font-mono">{row.barcode}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (row) => (
        <span className="text-slate-600">{humanize(row.type)}</span>
      ),
    },
    {
      key: "uom",
      header: "Unit",
      render: (row) => uomLabelFor(row.unitOfMeasureId),
    },
    {
      key: "reorder",
      header: "Reorder",
      render: (row) => (
        <span className="font-mono text-slate-600">
          {fmtQty(row.reorderPoint)} / {fmtQty(row.reorderQuantity)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) =>
        row.isArchived ? (
          <StatusBadge status="archived" />
        ) : (
          <StatusBadge status="active" />
        ),
    },
    ...(canUpdate || canArchive
      ? [
          {
            key: "actions",
            header: "Actions",
            render: (row: ItemDto) => (
              <RowActionsMenu
                label="Item actions"
                items={[
                  ...(canUpdate
                    ? [
                        {
                          label: "Edit",
                          icon: <HiOutlinePencilSquare className="h-3.5 w-3.5" />,
                          onClick: () => openEdit(row),
                        },
                      ]
                    : []),
                  ...(canArchive && !row.isArchived
                    ? [
                        {
                          label: "Archive",
                          icon: <HiOutlineArchiveBox className="h-3.5 w-3.5" />,
                          onClick: () => archiveItem.mutate(row.id),
                          destructive: true,
                        },
                      ]
                    : []),
                ]}
              />
            ),
          } satisfies Column<ItemDto>,
        ]
      : []),
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<HiOutlineCube className="w-5 h-5" />}
        title="Items"
        description="Master catalog of materials, components and finished goods"
        actions={
          <div className="flex items-center gap-2">
            {canCreate ? (
              <button type="button" className={BTN_SECONDARY} onClick={() => setIsUomOpen(true)}>
                <HiOutlinePlus className="w-4 h-4" />
                Unit
              </button>
            ) : null}
            {canCreate ? (
              <button type="button" className={BTN_PRIMARY} onClick={openCreate}>
                <HiOutlinePlus className="w-4 h-4" />
                New Item
              </button>
            ) : null}
          </div>
        }
      />

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search code or name…"
          />
          <FilterSelect
            value={typeFilter}
            onChange={(value) => {
              setTypeFilter(value);
              setPage(1);
            }}
            options={ITEM_TYPE_LIST.map((type) => ({
              label: humanize(type),
              value: type,
            }))}
            placeholder="All Types"
          />
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600 pl-1">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(event) => {
                setIncludeArchived(event.target.checked);
                setPage(1);
              }}
              className="w-3.5 h-3.5 rounded accent-zinc-900"
            />
            Include archived
          </label>
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={items}
        isLoading={isLoading}
        emptyMessage="No items found."
        emptyDescription="Create an item to start tracking materials, components and finished goods."
        emptyAction={
          canCreate ? (
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition hover:bg-primary/90"
              onClick={openCreate}
            >
              <HiOutlinePlus className="h-4 w-4" />
              New Item
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
        title="New Item"
        icon={<HiOutlineCube className="w-4 h-4" />}
      >
        <div className="space-y-3">
          <LabeledInput
            label="Code"
            id="item-code"
            value={itemForm.code}
            onChange={(event) => updateItemForm("code", event.target.value)}
            placeholder="e.g. RM-STEEL-001"
          />
          <LabeledInput
            label="Name"
            id="item-name"
            value={itemForm.name}
            onChange={(event) => updateItemForm("name", event.target.value)}
            placeholder="e.g. Steel Sheet 2mm"
          />
          <LabeledSelect
            label="Type"
            id="item-type"
            value={itemForm.type}
            onChange={(event) => updateItemForm("type", event.target.value)}
          >
            <option value="">Select type…</option>
            {ITEM_TYPE_LIST.map((type) => (
              <option key={type} value={type}>
                {humanizeType(type)}
              </option>
            ))}
          </LabeledSelect>
          <LabeledSelect
            label="Unit of Measure"
            id="item-uom"
            value={itemForm.unitOfMeasureId}
            onChange={(event) =>
              updateItemForm("unitOfMeasureId", event.target.value)
            }
          >
            <option value="">Select unit…</option>
            {units.map((unit: UnitOfMeasureDto) => (
              <option key={unit.id} value={unit.id}>
                {unit.code} — {unit.name}
              </option>
            ))}
          </LabeledSelect>
          <div className="grid grid-cols-2 gap-3">
            <LabeledInput
              label="Reorder Point"
              id="item-reorder-point"
              value={itemForm.reorderPoint}
              onChange={(event) =>
                updateItemForm("reorderPoint", event.target.value)
              }
              placeholder="e.g. 100"
            />
            <LabeledInput
              label="Reorder Qty"
              id="item-reorder-qty"
              value={itemForm.reorderQuantity}
              onChange={(event) =>
                updateItemForm("reorderQuantity", event.target.value)
              }
              placeholder="e.g. 500"
            />
          </div>
          <LabeledInput
            label="Barcode (optional)"
            id="item-barcode"
            value={itemForm.barcode}
            onChange={(event) => updateItemForm("barcode", event.target.value)}
            placeholder="e.g. 5901234123457"
          />
          <LabeledTextarea
            label="Description (optional)"
            id="item-description"
            value={itemForm.description}
            onChange={(event) =>
              updateItemForm("description", event.target.value)
            }
            placeholder="What this item is used for"
          />
        </div>
        <ModalActions
          onCancel={() => setIsCreateOpen(false)}
          onSubmit={submitCreate}
          submitLabel="Create Item"
          isPending={createItem.isPending}
        />
      </FormModal>

      <FormModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Edit Item"
        icon={<HiOutlinePencilSquare className="w-4 h-4" />}
      >
        <div className="space-y-3">
          <LabeledInput
            label="Code"
            id="edit-item-code"
            value={itemForm.code}
            onChange={(event) => updateItemForm("code", event.target.value)}
          />
          <LabeledInput
            label="Name"
            id="edit-item-name"
            value={itemForm.name}
            onChange={(event) => updateItemForm("name", event.target.value)}
          />
          <LabeledSelect
            label="Type"
            id="edit-item-type"
            value={itemForm.type}
            onChange={(event) => updateItemForm("type", event.target.value)}
          >
            {ITEM_TYPE_LIST.map((type) => (
              <option key={type} value={type}>
                {humanizeType(type)}
              </option>
            ))}
          </LabeledSelect>
          <LabeledSelect
            label="Unit of Measure"
            id="edit-item-uom"
            value={itemForm.unitOfMeasureId}
            onChange={(event) =>
              updateItemForm("unitOfMeasureId", event.target.value)
            }
          >
            {units.map((unit: UnitOfMeasureDto) => (
              <option key={unit.id} value={unit.id}>
                {unit.code} — {unit.name}
              </option>
            ))}
          </LabeledSelect>
          <div className="grid grid-cols-2 gap-3">
            <LabeledInput
              label="Reorder Point"
              id="edit-item-reorder-point"
              value={itemForm.reorderPoint}
              onChange={(event) =>
                updateItemForm("reorderPoint", event.target.value)
              }
            />
            <LabeledInput
              label="Reorder Qty"
              id="edit-item-reorder-qty"
              value={itemForm.reorderQuantity}
              onChange={(event) =>
                updateItemForm("reorderQuantity", event.target.value)
              }
            />
          </div>
          <LabeledInput
            label="Barcode (optional)"
            id="edit-item-barcode"
            value={itemForm.barcode}
            onChange={(event) => updateItemForm("barcode", event.target.value)}
          />
          <LabeledTextarea
            label="Description (optional)"
            id="edit-item-description"
            value={itemForm.description}
            onChange={(event) =>
              updateItemForm("description", event.target.value)
            }
          />
        </div>
        <ModalActions
          onCancel={() => setEditing(null)}
          onSubmit={submitUpdate}
          submitLabel="Save Changes"
          isPending={updateItem.isPending}
        />
      </FormModal>

      <FormModal
        open={isUomOpen}
        onClose={() => setIsUomOpen(false)}
        title="Add Unit of Measure"
        icon={<HiOutlineArchiveBox className="w-4 h-4" />}
      >
        <div className="space-y-3">
          <LabeledInput
            label="Code"
            id="uom-code"
            value={uomForm.code}
            onChange={(event) =>
              setUomForm((previous) => ({
                ...previous,
                code: event.target.value,
              }))
            }
            placeholder="e.g. KG"
          />
          <LabeledInput
            label="Name"
            id="uom-name"
            value={uomForm.name}
            onChange={(event) =>
              setUomForm((previous) => ({
                ...previous,
                name: event.target.value,
              }))
            }
            placeholder="e.g. Kilogram"
          />
        </div>
        <ModalActions
          onCancel={() => setIsUomOpen(false)}
          onSubmit={submitUom}
          submitLabel="Add Unit"
          isPending={createUnitOfMeasure.isPending}
        />
      </FormModal>
    </div>
  );
}

function humanizeType(type: string): string {
  return type
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
