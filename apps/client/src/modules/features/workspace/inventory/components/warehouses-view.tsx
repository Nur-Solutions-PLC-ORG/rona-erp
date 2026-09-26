"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  HiOutlineMapPin,
  HiOutlinePencilSquare,
  HiOutlinePlus,
  HiOutlineBuildingOffice2,
} from "react-icons/hi2";
import {
  warehouseCreateSchema,
  warehouseLocationCreateSchema,
  warehouseUpdateSchema,
} from "@rona/validation/inventory";
import type { WarehouseDto, WarehouseLocationDto } from "@rona/types/inventory";
import { usePermissions } from "@/modules/workspace/hooks";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  Card,
  Column,
  DataTable,
  EmptyState,
  Pagination,
  PageHeader,
  RowActionsMenu,
  StatusBadge,
} from "@/modules/workspace/components/ui";
import {
  FormModal,
  LabeledInput,
  LabeledTextarea,
  ModalActions,
} from "@/modules/workspace/components/form";
import {
  useCreateWarehouse,
  useCreateWarehouseLocation,
  useUpdateWarehouse,
  useWarehouseLocations,
  useWarehouses,
} from "../hooks";
import SearchInput from "@/components/custom/search-input";

const EMPTY_CREATE_FORM = { code: "", name: "", address: "" };
const EMPTY_EDIT_FORM = { name: "", address: "", isActive: true };
const EMPTY_LOCATION_FORM = { code: "", name: "" };

export default function WarehousesView() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("inventory.warehouse.read");
  const canCreate = hasPermission("inventory.warehouse.create");
  const canUpdate = hasPermission("inventory.warehouse.update");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ ...EMPTY_CREATE_FORM });
  const [editing, setEditing] = useState<WarehouseDto | null>(null);
  const [editForm, setEditForm] = useState({ ...EMPTY_EDIT_FORM });
  const [locationsFor, setLocationsFor] = useState<WarehouseDto | null>(null);
  const [locationForm, setLocationForm] = useState({ ...EMPTY_LOCATION_FORM });

  const { warehouses, meta, isLoading } = useWarehouses(
    page,
    includeInactive,
    search || undefined,
  );
  const createWarehouse = useCreateWarehouse();
  const updateWarehouse = useUpdateWarehouse();
  const createLocation = useCreateWarehouseLocation();
  const {
    locations,
    isLoading: locationsLoading,
  } = useWarehouseLocations(locationsFor?.id);

  if (!canRead) {
    return (
      <EmptyState
        icon={<HiOutlineBuildingOffice2 className="w-6 h-6" />}
        title="Warehouses unavailable"
        description="You do not have permission to view warehouses. Contact an administrator."
      />
    );
  }

  const submitCreate = () => {
    const parsed = warehouseCreateSchema.safeParse({
      code: createForm.code,
      name: createForm.name,
      address: createForm.address || undefined,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid warehouse details");
      return;
    }

    createWarehouse.mutate(parsed.data, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setCreateForm({ ...EMPTY_CREATE_FORM });
      },
    });
  };

  const submitUpdate = () => {
    if (!editing) return;

    const parsed = warehouseUpdateSchema.safeParse({
      name: editForm.name,
      address: editForm.address || undefined,
      isActive: editForm.isActive,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid warehouse details");
      return;
    }

    updateWarehouse.mutate(
      { id: editing.id, ...parsed.data },
      {
        onSuccess: () => {
          setEditing(null);
          setEditForm({ ...EMPTY_EDIT_FORM });
        },
      },
    );
  };

  const submitLocation = () => {
    if (!locationsFor) return;

    const parsed = warehouseLocationCreateSchema.safeParse({
      warehouseId: locationsFor.id,
      code: locationForm.code,
      name: locationForm.name,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid location details");
      return;
    }

    createLocation.mutate(parsed.data, {
      onSuccess: () => setLocationForm({ ...EMPTY_LOCATION_FORM }),
    });
  };

  const columns: Column<WarehouseDto>[] = [
    {
      key: "code",
      header: "Code",
      render: (row) => (
        <span className="font-mono text-zinc-600">{row.code}</span>
      ),
    },
    {
      key: "name",
      header: "Name",
      render: (row) => (
        <p className="font-medium text-zinc-800">{row.name}</p>
      ),
    },
    {
      key: "address",
      header: "Address",
      render: (row) => (
        <span className="text-zinc-600">{row.address ?? "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) =>
        row.isActive ? (
          <StatusBadge status="active" />
        ) : (
          <StatusBadge status="inactive" />
        ),
    },
    ...(canUpdate
      ? [
          {
            key: "actions",
            header: "Actions",
            render: (row: WarehouseDto) => (
              <RowActionsMenu
                label="Warehouse actions"
                items={[
                  {
                    label: "Locations",
                    icon: <HiOutlineMapPin className="h-3.5 w-3.5" />,
                    onClick: () => setLocationsFor(row),
                  },
                  {
                    label: "Edit",
                    icon: <HiOutlinePencilSquare className="h-3.5 w-3.5" />,
                    onClick: () => {
                      setEditForm({
                        name: row.name,
                        address: row.address ?? "",
                        isActive: row.isActive,
                      });
                      setEditing(row);
                    },
                  },
                ]}
              />
            ),
          } satisfies Column<WarehouseDto>,
        ]
      : []),
  ];

  const locationColumns: Column<WarehouseLocationDto>[] = [
    {
      key: "code",
      header: "Code",
      render: (row) => (
        <span className="font-mono text-zinc-600">{row.code}</span>
      ),
    },
    {
      key: "name",
      header: "Name",
      render: (row) => row.name,
    },
    {
      key: "status",
      header: "Status",
      render: (row) =>
        row.isActive ? (
          <StatusBadge status="active" />
        ) : (
          <StatusBadge status="inactive" />
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<HiOutlineBuildingOffice2 className="w-5 h-5" />}
        title="Warehouses"
        description="Storage sites and their bin locations"
        actions={
          canCreate ? (
            <button
              type="button"
              className={BTN_PRIMARY}
              onClick={() => setIsCreateOpen(true)}
            >
              <HiOutlinePlus className="w-4 h-4" />
              New Warehouse
            </button>
          ) : undefined
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
            placeholder="Search name or code…"
          />
          <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 pl-1">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(event) => {
              setIncludeInactive(event.target.checked);
              setPage(1);
            }}
            className="w-3.5 h-3.5 rounded accent-zinc-900"
          />
          Include inactive
        </label>
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={warehouses}
        isLoading={isLoading}
        emptyMessage="No warehouses found."
        emptyDescription="Create a warehouse to organize storage sites and their bin locations."
        emptyAction={
          canCreate ? (
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
              onClick={() => setIsCreateOpen(true)}
            >
              <HiOutlinePlus className="h-4 w-4" />
              New Warehouse
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
        title="New Warehouse"
        icon={<HiOutlineBuildingOffice2 className="w-4 h-4" />}
      >
        <div className="space-y-3">
          <LabeledInput
            label="Code"
            id="warehouse-code"
            value={createForm.code}
            onChange={(event) =>
              setCreateForm((previous) => ({
                ...previous,
                code: event.target.value,
              }))
            }
            placeholder="e.g. WH-MAIN"
          />
          <LabeledInput
            label="Name"
            id="warehouse-name"
            value={createForm.name}
            onChange={(event) =>
              setCreateForm((previous) => ({
                ...previous,
                name: event.target.value,
              }))
            }
            placeholder="e.g. Main Warehouse"
          />
          <LabeledTextarea
            label="Address (optional)"
            id="warehouse-address"
            value={createForm.address}
            onChange={(event) =>
              setCreateForm((previous) => ({
                ...previous,
                address: event.target.value,
              }))
            }
            placeholder="Street, city, country"
          />
        </div>
        <ModalActions
          onCancel={() => setIsCreateOpen(false)}
          onSubmit={submitCreate}
          submitLabel="Create Warehouse"
          isPending={createWarehouse.isPending}
        />
      </FormModal>

      <FormModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Edit Warehouse"
        icon={<HiOutlinePencilSquare className="w-4 h-4" />}
      >
        <div className="space-y-3">
          <LabeledInput
            label="Name"
            id="edit-warehouse-name"
            value={editForm.name}
            onChange={(event) =>
              setEditForm((previous) => ({
                ...previous,
                name: event.target.value,
              }))
            }
          />
          <LabeledTextarea
            label="Address (optional)"
            id="edit-warehouse-address"
            value={editForm.address}
            onChange={(event) =>
              setEditForm((previous) => ({
                ...previous,
                address: event.target.value,
              }))
            }
          />
          <label className="flex items-center gap-2 text-xs font-medium text-zinc-600">
            <input
              type="checkbox"
              checked={editForm.isActive}
              onChange={(event) =>
                setEditForm((previous) => ({
                  ...previous,
                  isActive: event.target.checked,
                }))
              }
              className="w-3.5 h-3.5 rounded accent-zinc-900"
            />
            Active
          </label>
        </div>
        <ModalActions
          onCancel={() => setEditing(null)}
          onSubmit={submitUpdate}
          submitLabel="Save Changes"
          isPending={updateWarehouse.isPending}
        />
      </FormModal>

      <FormModal
        open={locationsFor !== null}
        onClose={() => {
          setLocationsFor(null);
          setLocationForm({ ...EMPTY_LOCATION_FORM });
        }}
        title={`Locations — ${locationsFor?.name ?? ""}`}
        icon={<HiOutlineMapPin className="w-4 h-4" />}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <DataTable
            columns={locationColumns}
            rows={locations}
            isLoading={locationsLoading}
            emptyMessage="No locations in this warehouse yet."
          />
          {canCreate ? (
            <div className="space-y-3 border-t border-zinc-100 pt-3">
              <p className="text-xs font-semibold text-zinc-700">
                Add Location
              </p>
              <div className="grid grid-cols-2 gap-3">
                <LabeledInput
                  label="Code"
                  id="location-code"
                  value={locationForm.code}
                  onChange={(event) =>
                    setLocationForm((previous) => ({
                      ...previous,
                      code: event.target.value,
                    }))
                  }
                  placeholder="e.g. A-01"
                />
                <LabeledInput
                  label="Name"
                  id="location-name"
                  value={locationForm.name}
                  onChange={(event) =>
                    setLocationForm((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                  placeholder="e.g. Rack A Shelf 1"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className={BTN_SECONDARY}
                  onClick={submitLocation}
                  disabled={createLocation.isPending}
                >
                  <HiOutlinePlus className="w-4 h-4" />
                  {createLocation.isPending ? "Adding..." : "Add Location"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </FormModal>
    </div>
  );
}
