"use client";

import DataHeader from "@/components/custom/data-header";
import CustomButton from "@/components/custom/custom-button";
import { DataTable } from "@/components/custom/data-table";
import { usePagination } from "@/hooks/pagination";
import { useCustomSearchParams } from "@/hooks/search-params";
import { BADGE_COLORS } from "@/lib/colors";
import { createColumns } from "@/lib/create-columns";
import { useAdminOrganizations } from "@/modules/features/admin/organizations/hooks";
import { useConfirmationModalStore, useModalStore } from "@/store";
import {
  OrganizationDto,
  OrganizationListSearchParamsSchema,
} from "@rona/types/admin";
import { organizationListSearchParamsSchema } from "@rona/validation/admin";
import { FiPlus } from "react-icons/fi";

const Client = () => {
  const customSearchParams =
    useCustomSearchParams<OrganizationListSearchParamsSchema>();
  const { pagination, paginationData } = usePagination();
  const { organizations, isLoading, deleteMutation } = useAdminOrganizations(
    customSearchParams.requestSearchParams,
    paginationData,
  );

  const columns = createColumns<OrganizationDto>({
    includeActions: true,
    searchQuery: customSearchParams.searchParams.searchQuery,
    extraColumns: [
      { accessorKey: "name", header: "Organization", isBold: true },
      { accessorKey: "slug", header: "Slug", highlight: true },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "phone", header: "Phone" },
      { accessorKey: "country", header: "Country" },
      {
        accessorKey: "status",
        header: "Status",
        coloring: { active: BADGE_COLORS.green, inactive: BADGE_COLORS.red },
      },
    ],
    actionsItems: [
      {
        title: "View",
        separator: true,
        onClick: (row) =>
          useModalStore
            .getState()
            .openModal(
              "admin-organization",
              { organization: row.original },
              true,
            ),
      },
      {
        title: "Edit",
        onClick: (row) =>
          useModalStore
            .getState()
            .openModal("admin-organization", { organization: row.original }),
      },
      {
        title: "Delete",
        onClick: (row) =>
          useConfirmationModalStore.getState().openModal({
            title: "delete organization",
            variant: "destructive",
            onClick: async () => {
              await deleteMutation.mutateAsync({
                slugReplacement: { id: row.original.id },
              });
            },
          }),
      },
    ],
  });

  return (
    <>
      <DataHeader<OrganizationListSearchParamsSchema>
        searchParamsSchema={organizationListSearchParamsSchema}
        head={
          <CustomButton
            primary
            onClick={() =>
              useModalStore.getState().openModal("admin-organization")
            }
            icon={FiPlus}
          >
            Add Organization
          </CustomButton>
        }
        {...customSearchParams}
      />
      <DataTable
        columns={columns}
        data={organizations}
        loading={isLoading}
        pagination={pagination}
      />
    </>
  );
};

export default Client;
