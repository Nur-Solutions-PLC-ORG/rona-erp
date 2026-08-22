"use client";

import CustomButton from "@/components/custom/custom-button";
import DataHeader from "@/components/custom/data-header";
import { DataTable } from "@/components/custom/data-table";
import { usePagination } from "@/hooks/pagination";
import { useCustomSearchParams } from "@/hooks/search-params";
import { BADGE_COLORS } from "@/lib/colors";
import { createColumns } from "@/lib/create-columns";
import { useAdminOrganizations } from "@/modules/features/admin/organizations/hooks";
import { useAdminEmployees } from "@/modules/features/admin/employees/hooks";
import { useConfirmationModalStore, useModalStore } from "@/store";
import { EmployeeDto, EmployeeListSearchParamsSchema } from "@rona/types/admin";
import { employeeListSearchParamsSchema } from "@rona/validation/admin";
import { FiPlus } from "react-icons/fi";

const Client = () => {
  const customSearchParams =
    useCustomSearchParams<EmployeeListSearchParamsSchema>();
  const { pagination, paginationData } = usePagination();
  const { employees, isLoading, deleteMutation } = useAdminEmployees(
    customSearchParams.requestSearchParams,
    paginationData,
  );
  const { organizationsNameLookup } = useAdminOrganizations();

  const columns = createColumns<EmployeeDto>({
    includeActions: true,
    searchQuery: customSearchParams.searchParams.searchQuery,
    extraColumns: [
      { accessorKey: "eId", header: "Employee ID", isBold: true },
      { accessorKey: "fullName", header: "Name", isBold: true },
      { accessorKey: "email", header: "Email", highlight: true },
      { accessorKey: "phone", header: "Phone" },
      {
        id: "organization",
        header: "Organization",
        accessorFn: (employee) =>
          organizationsNameLookup[employee.organizationId],
      },
      { accessorKey: "gender", header: "Gender" },
      { accessorKey: "birthDate", header: "Birth Date", isDate: true },
      {
        accessorKey: "status",
        header: "Status",
        coloring: { active: BADGE_COLORS.green, inactive: BADGE_COLORS.red },
      },
    ],
    actionsItems: [
      {
        title: "View",
        onClick: (row) => {
          useModalStore
            .getState()
            .openModal("admin-employee", { employee: row.original }, true);
        },
        separator: true,
      },
      {
        title: "Edit",
        onClick: (row) => {
          useModalStore
            .getState()
            .openModal("admin-employee", { employee: row.original });
        },
      },
      {
        title: "Delete",
        onClick: (row) =>
          useConfirmationModalStore.getState().openModal({
            title: "delete employee",
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
      <DataHeader<EmployeeListSearchParamsSchema>
        searchParamsSchema={employeeListSearchParamsSchema}
        {...customSearchParams}
        head={
          <>
            <CustomButton
              primary
              onClick={() =>
                useModalStore.getState().openModal("admin-employee")
              }
              icon={FiPlus}
            >
              Add Employee
            </CustomButton>
          </>
        }
      />
      <DataTable
        columns={columns}
        data={employees}
        loading={isLoading}
        pagination={pagination}
      />
    </>
  );
};

export default Client;
