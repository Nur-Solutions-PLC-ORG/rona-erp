"use client";

import CustomButton from "@/components/custom/custom-button";
import DataHeader from "@/components/custom/data-header";
import { DataTable } from "@/components/custom/data-table";
import { usePagination } from "@/hooks/pagination";
import { useCustomSearchParams } from "@/hooks/search-params";
import { BADGE_COLORS } from "@/lib/colors";
import { createColumns } from "@/lib/create-columns";
import { slugToString } from "@/lib/utils";
import { useAdminOrganizations } from "@/modules/features/admin/organizations/hooks";
import { useAdminUsers } from "@/modules/features/admin/users/hooks";
import { useConfirmationModalStore, useModalStore } from "@/store";
import { UserListSearchParamsSchema } from "@rona/types/admin";
import { UserDto } from "@rona/types/admin";
import { userListSearchParamsSchema } from "@rona/validation/admin";
import { FiPlus } from "react-icons/fi";

const Client = () => {
  const customSearchParams =
    useCustomSearchParams<UserListSearchParamsSchema>();

  const { paginationData, pagination } = usePagination();
  const { users, deleteMutation, resetPasswordMutation, isLoading, meta } =
    useAdminUsers(customSearchParams.requestSearchParams, paginationData);

  const { organizationsNameLookup, organizationsFilter } =
    useAdminOrganizations();

  const columns = createColumns<UserDto>({
    includeActions: true,
    searchQuery: customSearchParams.searchParams.searchQuery,
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
        coloring: {
          inactive: BADGE_COLORS.red,
          active: BADGE_COLORS.green,
        },
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
        coloring: {
          super_admin: BADGE_COLORS.purple,
          admin: BADGE_COLORS.blue,
          owner: BADGE_COLORS.green,
          manager: BADGE_COLORS.yellow,
          staff: BADGE_COLORS.red,
        },
        onRender: (value) => slugToString(value),
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
                slugReplacement: {
                  id: row.original["id"],
                },
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
              "replace the user's current password with a new temporary password",
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
    <>
      <DataHeader<UserListSearchParamsSchema>
        searchParamsSchema={userListSearchParamsSchema}
        head={
          <>
            <CustomButton
              primary
              onClick={() => useModalStore.getState().openModal("admin-user")}
              icon={FiPlus}
            >
              Add User
            </CustomButton>
          </>
        }
        {...customSearchParams}
        replacements={{
          orgId: organizationsFilter,
        }}
      />
      <DataTable
        columns={columns}
        data={users}
        loading={isLoading}
        pagination={pagination}
        responseMeta={meta}
      />
    </>
  );
};

export default Client;
