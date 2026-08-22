"use client";

import CustomButton from "@/components/custom/custom-button";
import DataHeader from "@/components/custom/data-header";
import { DataTable } from "@/components/custom/data-table";
import { usePagination } from "@/hooks/pagination";
import { useCustomSearchParams } from "@/hooks/search-params";
import { createColumns } from "@/lib/create-columns";
import { useAdminOrganizations } from "@/modules/features/admin/organizations/hooks";
import { useAdminOrganizationSettings } from "@/modules/features/admin/organization-settings/hooks";
import { useConfirmationModalStore, useModalStore } from "@/store";
import {
  OrganizationSettingsDto,
  OrganizationSettingsListSearchParamsSchema,
} from "@rona/types/admin";
import { organizationSettingsListSearchParamsSchema } from "@rona/validation/admin";
import { FiPlus } from "react-icons/fi";

const Client = () => {
  const customSearchParams =
    useCustomSearchParams<OrganizationSettingsListSearchParamsSchema>();
  const { pagination, paginationData } = usePagination();

  const { organizationSettings, isLoading, deleteMutation } =
    useAdminOrganizationSettings(
      customSearchParams.requestSearchParams,
      paginationData,
    );
  const { organizationsNameLookup } = useAdminOrganizations();

  const columns = createColumns<OrganizationSettingsDto>({
    includeActions: true,
    searchQuery: customSearchParams.searchParams.searchQuery,
    extraColumns: [
      {
        id: "organization",
        header: "Organization",
        isBold: true,
        accessorFn: (settings) =>
          organizationsNameLookup[settings.organizationId],
      },
      { accessorKey: "currency", header: "Currency" },
    ],
    actionsItems: [
      {
        title: "View",
        separator: true,
        onClick: (row) =>
          useModalStore
            .getState()
            .openModal(
              "admin-organization-settings",
              { settings: row.original },
              true,
            ),
      },
      {
        title: "Edit",
        onClick: (row) =>
          useModalStore.getState().openModal("admin-organization-settings", {
            settings: row.original,
          }),
      },
      {
        title: "Delete",
        onClick: (row) =>
          useConfirmationModalStore.getState().openModal({
            title: "delete organization settings",
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
      <DataHeader<OrganizationSettingsListSearchParamsSchema>
        searchParamsSchema={organizationSettingsListSearchParamsSchema}
        {...customSearchParams}
        head={
          <CustomButton
            primary
            onClick={() =>
              useModalStore.getState().openModal("admin-organization-settings")
            }
            icon={FiPlus}
          >
            Add Settings
          </CustomButton>
        }
      />
      <DataTable
        columns={columns}
        data={organizationSettings}
        loading={isLoading}
        pagination={pagination}
      />
    </>
  );
};

export default Client;
