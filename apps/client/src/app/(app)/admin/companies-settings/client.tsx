"use client";

import DataHeader from "@/components/custom/data-header";
import { DataTable } from "@/components/custom/data-table";
import { usePagination } from "@/hooks/pagination";
import { useCustomSearchParams } from "@/hooks/search-params";
import { createColumns } from "@/lib/create-columns";
import { useAdminCompanies } from "@/modules/features/companies/hooks";
import { useAdminCompanySettings } from "@/modules/features/company-settings/hooks";
import { useConfirmationModalStore } from "@/store";
import {
  CompanySettingsDto,
  CompanySettingsListSearchParamsSchema,
} from "@rona/types/admin";

const Client = () => {
  const customSearchParams =
    useCustomSearchParams<CompanySettingsListSearchParamsSchema>();
  const { pagination, paginationData } = usePagination();
  const { companySettings, isLoading, deleteMutation } =
    useAdminCompanySettings(
      customSearchParams.requestSearchParams,
      paginationData,
    );
  const { companies } = useAdminCompanies({}, undefined);

  const columns = createColumns<CompanySettingsDto>({
    includeActions: true,
    extraColumns: [
      {
        id: "company",
        header: "Company",
        isBold: true,
        accessorFn: (settings) =>
          companies.find((company) => company.id === settings.tenantId)?.name,
      },
      { accessorKey: "currency", header: "Currency" },
    ],
    actionsItems: [
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
        {...customSearchParams}
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
