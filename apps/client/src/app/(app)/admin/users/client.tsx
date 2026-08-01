"use client";

import CustomButton from "@/components/custom/custom-button";
import DataHeader from "@/components/custom/data-header";
import { DataTable } from "@/components/custom/data-table";
import { usePagination } from "@/hooks/pagination";
import { useCustomSearchParams } from "@/hooks/search-params";
import { BADGE_COLORS } from "@/lib/colors";
import { createColumns } from "@/lib/table";
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
  const columns = createColumns<UserDto>({
    includeActions: true,
    extraColumns: [
      {
        accessorKey: "fullName",
        header: "Name",
        isBold: true,
      },
      { accessorKey: "email", header: "Email", highlight: true },
      // {
      //   accessorKey: "orgIds",
      //   header: "Organization",
      //   cell: ({ row }) => {
      //     const org =
      //       ((row.original.orgIds || []).length > 0 &&
      //         organizations.find(
      //           (item) => item.id == ((row.original.orgIds || [])[0] as string),
      //         )) ||
      //       undefined;
      //     return (
      //       <>
      //         {org ? (
      //           <p className="text-sm font-semibold">{org.name}</p>
      //         ) : (
      //           <p className="text-sm  opacity-50">None</p>
      //         )}
      //       </>
      //     );
      //   },
      // },
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
        accessorFn: (user) => user.role.modules,
      },
      {
        accessorKey: "status",
        header: "Status",
        coloring: {
          inactive: BADGE_COLORS.red,
          active: BADGE_COLORS.green,
        },
      },
    ],
    actionsItems: [
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
