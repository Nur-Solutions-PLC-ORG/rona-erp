"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineUserPlus,
  HiOutlineUsers,
} from "react-icons/hi2";
import SearchInput from "@/components/custom/search-input";
import {
  DEFAULT_ROLE_DESCRIPTIONS,
  DEFAULT_ROLE_NAMES,
  MEMBERSHIP_STATUS_LIST,
  ROLE_GROUPS,
} from "@rona/config/tenancy";
import {
  memberCreateSchema,
  membershipCreateSchema,
  membershipUpdateSchema,
} from "@rona/validation/tenancy";
import type {
  MemberCreateSchema,
  MembershipCandidateDto,
  MembershipCreateSchema,
  MembershipWithUserDto,
  RoleKey,
} from "@rona/types/tenancy";
import { usePermissions } from "@/modules/workspace/hooks";
import {
  BTN_PRIMARY,
  Card,
  Column,
  DataTable,
  EmptyState,
  PageHeader,
  RowActionsMenu,
  StatusBadge,
} from "@/modules/workspace/components/ui";
import {
  FormModal,
  LabeledInput,
  LabeledSelect,
  ModalActions,
} from "@/modules/workspace/components/form";
import {
  useCreateMember,
  useCreateMembership,
  useDeleteMembership,
  useMembershipCandidates,
  useMemberships,
  useUpdateMembership,
} from "../hooks";

interface CreateForm {
  userId: string;
  roleKeys: RoleKey[];
}

interface NewMemberForm {
  fullName: string;
  email: string;
}

interface EditForm {
  roleKeys: RoleKey[];
  status: string;
}

const ROLE_CHIP =
  "inline-flex items-center rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700";

function RoleChips({ roles }: { roles: RoleKey[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((role) => (
        <span key={role} className={ROLE_CHIP}>
          {DEFAULT_ROLE_NAMES[role] ?? role.replace(/_/g, " ")}
        </span>
      ))}
    </div>
  );
}

function RoleChecklist({
  selected,
  onToggle,
}: {
  selected: RoleKey[];
  onToggle: (role: RoleKey) => void;
}) {
  return (
    <div className="space-y-3">
      {ROLE_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            {group.label}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {group.roles.map((role) => (
              <label
                key={role}
                className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(role)}
                  onChange={() => onToggle(role)}
                  className="mt-0.5 w-3.5 h-3.5 rounded accent-zinc-900"
                />
                <span className="min-w-0">
                  <span className="block">{DEFAULT_ROLE_NAMES[role]}</span>
                  <span className="block text-[10px] font-normal text-zinc-400">
                    {DEFAULT_ROLE_DESCRIPTIONS[role]}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MembersView() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("membership.read");
  const canCreate = hasPermission("membership.create");
  const canUpdate = hasPermission("membership.update");
  const canDelete = hasPermission("membership.delete");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<MembershipWithUserDto | null>(null);
  const [createForm, setCreateForm] = useState<CreateForm>({ userId: "", roleKeys: [] });
  const [newMemberForm, setNewMemberForm] = useState<NewMemberForm>({
    fullName: "",
    email: "",
  });
  const [createMode, setCreateMode] = useState<"existing" | "new">("existing");
  const [editForm, setEditForm] = useState<EditForm>({ roleKeys: [], status: "" });
  const [search, setSearch] = useState("");
  const [candidateSearch, setCandidateSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<{
    fullName: string;
    email: string | null;
  } | null>(null);

  const { memberships, isLoading } = useMemberships();
  const createMembership = useCreateMembership();
  const createMember = useCreateMember();
  const updateMembership = useUpdateMembership();
  const deleteMembership = useDeleteMembership();
  const { candidates } = useMembershipCandidates(candidateSearch);

  const selectCandidate = (candidate: MembershipCandidateDto) => {
    setCreateForm((previous) => ({ ...previous, userId: candidate.id }));
    setSelectedUser({ fullName: candidate.fullName, email: candidate.email });
    setCandidateSearch("");
  };

  const clearSelectedUser = () => {
    setSelectedUser(null);
    setCreateForm((previous) => ({ ...previous, userId: "" }));
  };

  const resetCreate = () => {
    setIsCreateOpen(false);
    setCreateForm({ userId: "", roleKeys: [] });
    setNewMemberForm({ fullName: "", email: "" });
    setCreateMode("existing");
    setCandidateSearch("");
    setSelectedUser(null);
  };

  const filteredMemberships = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return memberships;
    return memberships.filter((membership) =>
      [
        membership.user.fullName,
        membership.user.email,
        membership.status,
        ...membership.roles,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term)),
    );
  }, [memberships, search]);

  if (!canRead) {
    return (
      <EmptyState
        icon={<HiOutlineUsers className="w-6 h-6" />}
        title="Members unavailable"
        description="You do not have permission to view organization members. Contact an administrator."
      />
    );
  }

  const toggleRole = (role: RoleKey) =>
    setCreateForm((previous) => ({
      ...previous,
      roleKeys: previous.roleKeys.includes(role)
        ? previous.roleKeys.filter((key) => key !== role)
        : [...previous.roleKeys, role],
    }));

  const toggleEditRole = (role: RoleKey) =>
    setEditForm((previous) => ({
      ...previous,
      roleKeys: previous.roleKeys.includes(role)
        ? previous.roleKeys.filter((key) => key !== role)
        : [...previous.roleKeys, role],
    }));

  const submitCreate = () => {
    if (createMode === "new") {
      const parsed = memberCreateSchema.safeParse({
        ...newMemberForm,
        roleKeys: createForm.roleKeys,
      });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? "Invalid member details");
        return;
      }
      createMember.mutate(parsed.data as MemberCreateSchema, {
        onSuccess: resetCreate,
      });
      return;
    }

    if (!createForm.userId || !selectedUser) {
      toast.error("Search and select a user to add.");
      return;
    }

    const parsed = membershipCreateSchema.safeParse(createForm);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid member details");
      return;
    }

    createMembership.mutate(parsed.data as MembershipCreateSchema, {
      onSuccess: resetCreate,
    });
  };

  const submitUpdate = () => {
    if (!editing) return;

    const parsed = membershipUpdateSchema.safeParse({
      roleKeys: editForm.roleKeys.length > 0 ? editForm.roleKeys : undefined,
      status: editForm.status || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid member update");
      return;
    }

    updateMembership.mutate(
      { id: editing.id, ...parsed.data },
      {
        onSuccess: () => setEditing(null),
      },
    );
  };

  const columns: Column<MembershipWithUserDto>[] = [
    {
      key: "user",
      header: "Member",
      render: (row) => (
        <div>
          <p className="font-medium text-zinc-800">{row.user.fullName}</p>
          <p className="text-zinc-400">{row.user.email}</p>
        </div>
      ),
    },
    {
      key: "roles",
      header: "Roles",
      render: (row) => <RoleChips roles={row.roles} />,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "joined",
      header: "Joined",
      render: (row) => (
        <span className="font-mono text-zinc-600">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    ...(canUpdate || canDelete
      ? [
          {
            key: "actions",
            header: "Actions",
            render: (row: MembershipWithUserDto) => (
              <RowActionsMenu
                label="Member actions"
                items={[
                  ...(canUpdate
                    ? [
                        {
                          label: "Edit",
                          icon: <HiOutlinePencilSquare className="h-3.5 w-3.5" />,
                          onClick: () => {
                            setEditing(row);
                            setEditForm({
                              roleKeys: row.roles,
                              status: row.status,
                            });
                          },
                        },
                      ]
                    : []),
                  ...(canDelete
                    ? [
                        {
                          label: "Remove",
                          icon: <HiOutlineTrash className="h-3.5 w-3.5" />,
                          onClick: () => deleteMembership.mutate(row.id),
                          destructive: true,
                        },
                      ]
                    : []),
                ]}
              />
            ),
          } satisfies Column<MembershipWithUserDto>,
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<HiOutlineUsers className="w-5 h-5" />}
        title="Members"
        description="People and roles within the current organization"
        actions={
          canCreate ? (
            <button
              type="button"
              className={BTN_PRIMARY}
              onClick={() => setIsCreateOpen(true)}
            >
              <HiOutlineUserPlus className="w-4 h-4" />
              Add Member
            </button>
          ) : undefined
        }
      />

      <Card className="p-3">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, status or role…"
          />
          <p className="text-xs text-zinc-500">
            Add a platform user or create a new one. The backend creates an
            active membership and assigns the selected roles; the last active
            owner is always protected.
          </p>
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={filteredMemberships}
        isLoading={isLoading}
        emptyMessage="No members found."
        emptyDescription="Add a member — create a new account or invite an existing user — to grant access to this organization."
        emptyAction={
          canCreate ? (
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
              onClick={() => setIsCreateOpen(true)}
            >
              <HiOutlineUserPlus className="h-4 w-4" />
              Add Member
            </button>
          ) : undefined
        }
      />

      <FormModal
        open={isCreateOpen}
        onClose={resetCreate}
        title="Add Member"
        icon={<HiOutlineUserPlus className="w-4 h-4" />}
        maxWidth="max-w-xl"
      >
        <div className="space-y-3">
          <div className="flex rounded-lg bg-zinc-100 p-0.5">
            <button
              type="button"
              onClick={() => setCreateMode("existing")}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                createMode === "existing"
                  ? "bg-card text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              Existing user
            </button>
            <button
              type="button"
              onClick={() => setCreateMode("new")}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                createMode === "new"
                  ? "bg-card text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              New user
            </button>
          </div>
          {createMode === "existing" ? (
            <div>
              <p className="mb-1.5 text-xs font-medium text-zinc-700">Member</p>
              <SearchInput
                value={candidateSearch}
                onChange={(event) => {
                  setCandidateSearch(event.target.value);
                  setSelectedUser(null);
                }}
                placeholder="Search by name or email…"
              />
              {selectedUser ? (
                <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-800">
                      {selectedUser.fullName}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {selectedUser.email ?? "No email"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelectedUser}
                    className="shrink-0 text-xs font-medium text-rose-600 hover:text-rose-700"
                  >
                    Clear
                  </button>
                </div>
              ) : candidates.length > 0 ? (
                <ul className="mt-2 max-h-44 divide-y overflow-y-auto rounded-lg border border-zinc-200 bg-card">
                  {candidates.map((candidate) => (
                    <li key={candidate.id}>
                      <button
                        type="button"
                        onClick={() => selectCandidate(candidate)}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-zinc-50"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-zinc-800">
                            {candidate.fullName}
                          </span>
                          <span className="block truncate text-xs text-zinc-500">
                            {candidate.email ?? candidate.id}
                          </span>
                        </span>
                        <HiOutlineUserPlus className="h-4 w-4 shrink-0 text-zinc-400" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : candidateSearch.trim().length > 0 ? (
                <p className="mt-2 text-xs text-zinc-500">
                  No platform users match. Switch to &quot;New user&quot; to
                  create the account right here.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3">
              <LabeledInput
                label="Full name"
                id="member-name"
                value={newMemberForm.fullName}
                onChange={(event) =>
                  setNewMemberForm((previous) => ({
                    ...previous,
                    fullName: event.target.value,
                  }))
                }
                placeholder="Jane Doe"
              />
              <LabeledInput
                label="Email"
                id="member-email"
                type="email"
                value={newMemberForm.email}
                onChange={(event) =>
                  setNewMemberForm((previous) => ({
                    ...previous,
                    email: event.target.value,
                  }))
                }
                placeholder="you@company.com"
              />
              <p className="text-[10px] leading-relaxed text-zinc-400">
                A new account is created and added to this organization. A
                temporary password is sent to the email (and Telegram if bound).
              </p>
            </div>
          )}
          <div>
            <p className="mb-1.5 text-xs font-medium text-zinc-700">Roles</p>
            <RoleChecklist selected={createForm.roleKeys} onToggle={toggleRole} />
          </div>
        </div>
        <ModalActions
          onCancel={resetCreate}
          onSubmit={submitCreate}
          submitLabel="Add Member"
          isPending={createMembership.isPending || createMember.isPending}
        />
      </FormModal>

      {editing && (
        <FormModal
          open
          onClose={() => setEditing(null)}
          title={`Edit ${editing.user.fullName}`}
          icon={<HiOutlinePencilSquare className="w-4 h-4" />}
          maxWidth="max-w-xl"
        >
          <div className="space-y-3">
            <div>
              <p className="mb-1.5 text-xs font-medium text-zinc-700">Roles</p>
              <RoleChecklist selected={editForm.roleKeys} onToggle={toggleEditRole} />
            </div>
            <LabeledSelect
              label="Status"
              id="member-status"
              value={editForm.status}
              onChange={(event) =>
                setEditForm((previous) => ({ ...previous, status: event.target.value }))
              }
            >
              <option value="">Unchanged</option>
              {MEMBERSHIP_STATUS_LIST.map((status) => (
                <option key={status} value={status}>
                  {status.toUpperCase()}
                </option>
              ))}
            </LabeledSelect>
          </div>
          <ModalActions
            onCancel={() => setEditing(null)}
            onSubmit={submitUpdate}
            submitLabel="Save Changes"
            isPending={updateMembership.isPending}
          />
        </FormModal>
      )}
    </div>
  );
}
