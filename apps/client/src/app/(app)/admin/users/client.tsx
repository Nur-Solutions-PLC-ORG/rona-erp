"use client";

import DataHeader from "@/components/custom/data-header";
import { DataTable } from "@/components/custom/data-table";
import { useAccumulatedList } from "@/hooks/use-accumulated-list";
import { useListPage } from "@/hooks/list-page";
import { createColumns } from "@/lib/create-columns";
import { slugToString } from "@/lib/utils";
import { useAdminOrganizations } from "@/modules/features/admin/organizations/hooks";
import { useAdminUsers } from "@/modules/features/admin/users/hooks";
import { useConfirmationModalStore, useModalStore } from "@/store";
import { UserListSearchParamsSchema, UserDto } from "@rona/types/admin";
import { userListSearchParamsSchema } from "@rona/validation/admin";
import { useCallback, useState } from "react";
import { HiOutlinePlus, HiOutlineUserGroup } from "react-icons/hi2";
import {
  BTN_PRIMARY,
  PageHeader,
  StatusBadge,
} from "@/modules/workspace/components/ui";

const Client = () => {
  const {
    pagination,
    paginationData,
    searchParams,
    requestSearchParams,
    updateParams,
    clearParams,
    removeParams,
  } = useListPage<UserListSearchParamsSchema>();
  const [localSearch, setLocalSearch] = useState("");

  const { users, deleteMutation, resetPasswordMutation, isLoading, meta } =
    useAdminUsers(requestSearchParams, paginationData);

  const { organizationsNameLookup, organizationsFilter } =
    useAdminOrganizations();

  const getSearchableText = useCallback(
    (user: UserDto) =>
      [
        user.fullName,
        user.email,
        user.status,
        user.role.position,
        user.role.modules.join(" "),
        organizationsNameLookup[user.organizationId || ""] || "",
      ].join(" "),
    [organizationsNameLookup],
  );

  const list = useAccumulatedList({
    items: users,
    meta,
    pagination,
    serverFilterKey: JSON.stringify({
      ...requestSearchParams,
      limit: paginationData.limit,
    }),
    localSearch,
    getSearchableText,
    isLoading,
  });

  const columns = createColumns<UserDto>({
    includeActions: true,
    searchQuery: localSearch || searchParams.searchQuery,
    extraColumns: [
      {
        accessorKey: "fullName",
        header: "Name",
        isBold: true,
      },
      { accessorKey: "email", header: "Email", highlight: true },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge status={row.getValue("status") as string} />
        ),
      },
      {
        id: "organization",
        header: "Organization",
        accessorFn: (user) =>
          organizationsNameLookup[user.organizationId || ""],
      },
      {
        accessorKey: "role.position",
        header: "Role",
        cell: ({ row }) => {
          const value = row.getValue("role.position") as string;
          return (
            <span className="text-zinc-900 text-xs font-medium">
              {slugToString(value)}
            </span>
          );
        },
      },
      {
        id: "modules",
        header: "Modules",
        accessorFn: (user) =>
          user.role.modules.map((item) => slugToString(item)),
      },
    ],
    actionsItems: [
      {
        title: "View",
        onClick: (row) => {
          useModalStore
            .getState()
            .openModal("admin-user", { user: row.original }, true);
        },
        separator: true,
      },
      {
        title: "Edit",
        onClick: (row) => {
          useModalStore
            .getState()
            .openModal("admin-user", { user: row.original });
        },
      },
      {
        title: "Delete",
        onClick: (row) => {
          useConfirmationModalStore.getState().openModal({
            title: `delete user`,
            onClick: async () => {
              await deleteMutation.mutateAsync({
                slugReplacement: { id: row.original["id"] },
              });
            },
            variant: "destructive",
          });
        },
      },
      {
        title: "Reset password",
        onClick: (row) => {
          useConfirmationModalStore.getState().openModal({
            title: `reset ${row.original.fullName}'s password`,
            description:
              "a new one-time password will be sent to their email",
            onClick: async () => {
              const result = await resetPasswordMutation.mutateAsync({
                slugReplacement: { id: row.original.id },
              });
              if (result.success && result.data) {
                useModalStore.getState().openModal("admin-user-credentials", {
                  credentials: result.data,
                  title: "Password reset successfully",
                });
              }
            },
          });
        },
      },
    ],
  });

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<HiOutlineUserGroup className="w-5 h-5" />}
        title="Users"
        description="Manage platform users and their access"
        actions={
          <button
            type="button"
            className={BTN_PRIMARY}
            onClick={() => useModalStore.getState().openModal("admin-user")}
          >
            <HiOutlinePlus className="w-4 h-4" />
            Add User
          </button>
        }
      />
      <DataHeader<UserListSearchParamsSchema>
        searchParamsSchema={userListSearchParamsSchema}
        head={null}
        searchParams={searchParams}
        updateParams={updateParams}
        clearParams={() => {
          setLocalSearch("");
          clearParams();
        }}
        removeParams={removeParams}
        localSearch={localSearch}
        onLocalSearchChange={setLocalSearch}
        onSearchServer={(value) => {
          setLocalSearch(value);
          if (value) {
            updateParams({ searchQuery: value });
          } else {
            removeParams(["searchQuery"]);
          }
          pagination.setPage(1);
        }}
        replacements={{ orgId: organizationsFilter }}
      />
      <DataTable
        columns={columns}
        data={list.items}
        loading={isLoading}
        pagination={pagination}
        responseMeta={meta}
        loadMore={{
          hasMore: list.hasMore,
          onLoadMore: list.loadMore,
          cachedCount: list.cachedCount,
          isFilteringLocally: list.isFilteringLocally,
        }}
      />
    </div>
  );
};

export default Client;
