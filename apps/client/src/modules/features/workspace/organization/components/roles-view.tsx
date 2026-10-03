"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { HiOutlineKey, HiOutlinePencilSquare, HiOutlineShieldCheck } from "react-icons/hi2";
import { PERMISSION_LIST } from "@rona/config/tenancy";
import type { Permission, RoleDto } from "@rona/types/tenancy";
import { usePermissions } from "@/modules/workspace/hooks";
import {
  Card,
  Column,
  DataTable,
  EmptyState,
  PageHeader,
  RowActionsMenu,
} from "@/modules/workspace/components/ui";
import { FormModal, ModalActions } from "@/modules/workspace/components/form";
import { useRoles, useUpdateRole } from "../hooks";
import SearchInput from "@/components/custom/search-input";

function groupPermissions(): Map<string, Permission[]> {
  const groups = new Map<string, Permission[]>();
  for (const permission of PERMISSION_LIST) {
    const domain = permission.split(".")[0];
    const bucket = groups.get(domain) ?? [];
    bucket.push(permission);
    groups.set(domain, bucket);
  }
  return groups;
}

const PermissionChecklist = ({
  selected,
  onToggle,
}: {
  selected: Permission[];
  onToggle: (permission: Permission) => void;
}) => {
  const groups = useMemo(() => groupPermissions(), []);

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
      {Array.from(groups.entries()).map(([domain, permissions]) => (
        <div key={domain}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
            {domain}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
            {permissions.map((permission) => (
              <label
                key={permission}
                className="flex items-center gap-2 text-xs font-medium text-zinc-700 px-2 py-1 rounded-lg hover:bg-zinc-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(permission)}
                  onChange={() => onToggle(permission)}
                  className="w-3.5 h-3.5 rounded accent-zinc-900"
                />
                {permission}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default function RolesView() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("role.read");
  const canUpdate = hasPermission("role.update");

  const [editing, setEditing] = useState<RoleDto | null>(null);
  const [selected, setSelected] = useState<Permission[]>([]);
  const [search, setSearch] = useState("");

  const { roles, isLoading } = useRoles();
  const updateRole = useUpdateRole();

  const filteredRoles = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return roles;
    return roles.filter((role) =>
      [role.key, role.name, ...role.permissions]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term)),
    );
  }, [roles, search]);

  if (!canRead) {
    return (
      <EmptyState
        icon={<HiOutlineKey className="w-6 h-6" />}
        title="Roles unavailable"
        description="You do not have permission to view organization roles. Contact an administrator."
      />
    );
  }

  const togglePermission = (permission: Permission) =>
    setSelected((previous) =>
      previous.includes(permission)
        ? previous.filter((item) => item !== permission)
        : [...previous, permission],
    );

  const submitUpdate = () => {
    if (!editing) return;

    if (selected.length < 1) {
      toast.error("Select at least one permission for this role.");
      return;
    }

    updateRole.mutate(
      { id: editing.id, permissions: selected },
      { onSuccess: () => setEditing(null) },
    );
  };

  const columns: Column<RoleDto>[] = [
    {
      key: "name",
      header: "Role",
      render: (row) => (
        <div>
          <p className="font-medium text-zinc-800">{row.name}</p>
          <p className="font-mono text-[10px] text-zinc-400">{row.key}</p>
        </div>
      ),
    },
    {
      key: "system",
      header: "Type",
      render: (row) =>
        row.isSystem ? (
          <span className="inline-flex items-center rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
            SYSTEM
          </span>
        ) : (
          <span className="inline-flex items-center rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700">
            CUSTOM
          </span>
        ),
    },
    {
      key: "permissions",
      header: "Permissions",
      render: (row) => (
        <span className="font-mono text-zinc-600">{row.permissions.length}</span>
      ),
    },
    ...(canUpdate
      ? [
          {
            key: "actions",
            header: "Actions",
            render: (row: RoleDto) => {
              const locked = row.key === "OWNER" && row.isSystem;
              return locked ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                  <HiOutlineShieldCheck className="h-3 w-3" />
                  Protected
                </span>
              ) : (
                <RowActionsMenu
                  label="Role actions"
                  items={[
                    {
                      label: "Edit",
                      icon: <HiOutlinePencilSquare className="h-3.5 w-3.5" />,
                      onClick: () => {
                        setEditing(row);
                        setSelected(row.permissions);
                      },
                    },
                  ]}
                />
              );
            },
          } satisfies Column<RoleDto>,
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<HiOutlineKey className="w-5 h-5" />}
        title="Roles"
        description="Organization roles and their permissions"
      />

      <Card className="p-3">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search role key, name or permission…"
          />
          <p className="text-xs text-zinc-500">
            Roles are organization-scoped. The OWNER system role is protected and cannot
            be modified.
          </p>
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={filteredRoles}
        isLoading={isLoading}
        emptyMessage="No roles found."
      />

      {editing && (
        <FormModal
          open
          onClose={() => setEditing(null)}
          title={`Edit Permissions — ${editing.name}`}
          icon={<HiOutlinePencilSquare className="w-4 h-4" />}
          maxWidth="max-w-2xl"
        >
          <PermissionChecklist
            selected={selected}
            onToggle={togglePermission}
          />
          <ModalActions
            onCancel={() => setEditing(null)}
            onSubmit={submitUpdate}
            submitLabel="Save Permissions"
            isPending={updateRole.isPending}
          />
        </FormModal>
      )}
    </div>
  );
}
