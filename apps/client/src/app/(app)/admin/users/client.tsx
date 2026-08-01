"use client";

import CustomButton from "@/components/custom/custom-button";
import DataHeader from "@/components/custom/data-header";
import { DataTable } from "@/components/custom/data-table";
import { usePagination } from "@/hooks/pagination";
import { useCustomSearchParams } from "@/hooks/search-params";
import { BADGE_COLORS } from "@/lib/colors";
import { createColumns } from "@/lib/create-columns";
import { slugToString } from "@/lib/utils";
import { useCompanies } from "@/modules/features/companies/hooks";
import { useAdminUsers } from "@/modules/features/users/hooks";
import { useConfirmationModalStore, useModalStore } from "@/store";
import { UserListSearchParamsSchema } from "@rona/types/admin";
import { UserDto } from "@rona/types/auth";
import { userListSearchParamsSchema } from "@rona/validation/admin";
import { FiPlus } from "react-icons/fi";

const Client = () => {
  const customSearchParams =
    useCustomSearchParams<UserListSearchParamsSchema>();

  const { paginationData } = usePagination();
  const { users, deleteMutation } = useAdminUsers(
    customSearchParams.requestSearchParams,
    paginationData,
  );

  const { companies } = useCompanies();

  const columns = createColumns<UserDto>({
    includeActions: true,
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
        id: "company",
        header: "Company",
        accessorFn: (user) => {
          const company = companies.find((item) => item.id == user.tenantId);

          return company?.name;
        },
      },
      {
        accessorKey: "role.position",
        header: "Role",
        coloring: {
          admin: BADGE_COLORS.red,
          owner: BADGE_COLORS.green,
          manager: BADGE_COLORS.yellow,
          staff: BADGE_COLORS.purple,
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
                slugReplacement: {
                  id: row.original["id"],
                },
              });
            },
            variant: "destructive",
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
      />
      <DataTable columns={columns} data={users} />
    </>
  );
};

export default Client;
