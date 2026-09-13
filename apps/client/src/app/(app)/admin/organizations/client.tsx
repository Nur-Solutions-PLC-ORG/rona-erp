"use client";

import DataHeader from "@/components/custom/data-header";
import { DataTable } from "@/components/custom/data-table";
import { usePagination } from "@/hooks/pagination";
import { useCustomSearchParams } from "@/hooks/search-params";
import { createColumns } from "@/lib/create-columns";
import { useAdminOrganizations } from "@/modules/features/admin/organizations/hooks";
import { useConfirmationModalStore, useModalStore } from "@/store";
import {
  OrganizationDto,
  OrganizationListSearchParamsSchema,
} from "@rona/types/admin";
import { organizationListSearchParamsSchema } from "@rona/validation/admin";
import { HiOutlineBuildingOffice2, HiOutlinePlus } from "react-icons/hi2";
import {
  BTN_PRIMARY,
  PageHeader,
  StatusBadge,
} from "@/modules/workspace/components/ui";

const Client = () => {
  const customSearchParams =
    useCustomSearchParams<OrganizationListSearchParamsSchema>();
  const { pagination, paginationData } = usePagination();
  const { organizations, isLoading, deleteMutation, meta } =
    useAdminOrganizations(
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
        cell: ({ row }) => (
          <StatusBadge status={row.getValue("status") as string} />
        ),
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
    <div className="space-y-4">
      <PageHeader
        icon={<HiOutlineBuildingOffice2 className="w-5 h-5" />}
        title="Organizations"
        description="Manage all organizations on the platform"
        actions={
          <button
            type="button"
            className={BTN_PRIMARY}
            onClick={() =>
              useModalStore.getState().openModal("admin-organization")
            }
          >
            <HiOutlinePlus className="w-4 h-4" />
            Add Organization
          </button>
        }
      />
      <DataHeader<OrganizationListSearchParamsSchema>
        searchParamsSchema={organizationListSearchParamsSchema}
        head={null}
        {...customSearchParams}
      />
      <DataTable
        columns={columns}
        data={organizations}
        loading={isLoading}
        pagination={pagination}
        responseMeta={meta}
      />
    </div>
  );
};

export default Client;
