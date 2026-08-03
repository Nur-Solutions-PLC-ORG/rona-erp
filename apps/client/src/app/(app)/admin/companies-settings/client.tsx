"use client";

import CustomButton from "@/components/custom/custom-button";
import DataHeader from "@/components/custom/data-header";
import { DataTable } from "@/components/custom/data-table";
import { usePagination } from "@/hooks/pagination";
import { useCustomSearchParams } from "@/hooks/search-params";
import { createColumns } from "@/lib/create-columns";
import { useAdminCompanies } from "@/modules/features/companies/hooks";
import { useAdminCompanySettings } from "@/modules/features/company-settings/hooks";
import { useConfirmationModalStore, useModalStore } from "@/store";
import {
  CompanySettingsDto,
  CompanySettingsListSearchParamsSchema,
} from "@rona/types/admin";
import { companySettingsListSearchParamsSchema } from "@rona/validation/admin";
import { FiPlus } from "react-icons/fi";

const Client = () => {
  const customSearchParams =
    useCustomSearchParams<CompanySettingsListSearchParamsSchema>();
  const { pagination, paginationData } = usePagination();

  const { companySettings, isLoading, deleteMutation } =
    useAdminCompanySettings(
      customSearchParams.requestSearchParams,
      paginationData,
    );
  const { companiesNameLookup } = useAdminCompanies();

  const columns = createColumns<CompanySettingsDto>({
    includeActions: true,
    extraColumns: [
      {
        id: "company",
        header: "Company",
        isBold: true,
        accessorFn: (settings) => companiesNameLookup[settings.tenantId],
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
              "admin-company-settings",
              { settings: row.original },
              true,
            ),
      },
      {
        title: "Edit",
        onClick: (row) =>
          useModalStore
            .getState()
            .openModal("admin-company-settings", { settings: row.original }),
      },
      {
        title: "Delete",
        onClick: (row) =>
          useConfirmationModalStore.getState().openModal({
            title: "delete company settings",
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
      <DataHeader<CompanySettingsListSearchParamsSchema>
        searchParamsSchema={companySettingsListSearchParamsSchema}
        {...customSearchParams}
        head={
          <CustomButton
            primary
            onClick={() =>
              useModalStore.getState().openModal("admin-company-settings")
            }
            icon={FiPlus}
          >
            Add Settings
          </CustomButton>
        }
      />
      <DataTable
        columns={columns}
        data={companySettings}
        loading={isLoading}
        pagination={pagination}
      />
    </>
  );
};

export default Client;
