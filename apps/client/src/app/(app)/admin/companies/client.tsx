"use client";

import DataHeader from "@/components/custom/data-header";
import CustomButton from "@/components/custom/custom-button";
import { DataTable } from "@/components/custom/data-table";
import { usePagination } from "@/hooks/pagination";
import { useCustomSearchParams } from "@/hooks/search-params";
import { BADGE_COLORS } from "@/lib/colors";
import { createColumns } from "@/lib/create-columns";
import { useAdminCompanies } from "@/modules/features/platform/companies/hooks";
import { useConfirmationModalStore, useModalStore } from "@/store";
import { CompanyDto, CompanyListSearchParamsSchema } from "@rona/types/admin";
import { companyListSearchParamsSchema } from "@rona/validation/admin";
import { FiPlus } from "react-icons/fi";

const Client = () => {
  const customSearchParams =
    useCustomSearchParams<CompanyListSearchParamsSchema>();
  const { pagination, paginationData } = usePagination();
  const { companies, isLoading, deleteMutation } = useAdminCompanies(
    customSearchParams.requestSearchParams,
    paginationData,
  );

  const columns = createColumns<CompanyDto>({
    includeActions: true,
    searchQuery: customSearchParams.searchParams.searchQuery,
    extraColumns: [
      { accessorKey: "name", header: "Company", isBold: true },
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
            .openModal("admin-company", { company: row.original }, true),
      },
      {
        title: "Edit",
        onClick: (row) =>
          useModalStore
            .getState()
            .openModal("admin-company", { company: row.original }),
      },
      {
        title: "Delete",
        onClick: (row) =>
          useConfirmationModalStore.getState().openModal({
            title: "delete company",
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
      <DataHeader<CompanyListSearchParamsSchema>
        searchParamsSchema={companyListSearchParamsSchema}
        head={
          <CustomButton
            primary
            onClick={() => useModalStore.getState().openModal("admin-company")}
            icon={FiPlus}
          >
            Add Company
          </CustomButton>
        }
        {...customSearchParams}
      />
      <DataTable
        columns={columns}
        data={companies}
        loading={isLoading}
        pagination={pagination}
      />
    </>
  );
};

export default Client;
