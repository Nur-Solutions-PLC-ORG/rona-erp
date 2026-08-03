"use client";

import DataHeader from "@/components/custom/data-header";
import { DataTable } from "@/components/custom/data-table";
import { usePagination } from "@/hooks/pagination";
import { useCustomSearchParams } from "@/hooks/search-params";
import { BADGE_COLORS } from "@/lib/colors";
import { createColumns } from "@/lib/create-columns";
import { useAdminCompanies } from "@/modules/features/companies/hooks";
import { useAdminEmployees } from "@/modules/features/employees/hooks";
import { useConfirmationModalStore } from "@/store";
import { EmployeeDto, EmployeeListSearchParamsSchema } from "@rona/types/admin";
import { employeeListSearchParamsSchema } from "@rona/validation/admin";

const Client = () => {
  const customSearchParams = useCustomSearchParams<EmployeeListSearchParamsSchema>();
  const { pagination, paginationData } = usePagination();
  const { employees, isLoading, deleteMutation } = useAdminEmployees(customSearchParams.requestSearchParams, paginationData);
  const { companies } = useAdminCompanies({}, undefined);

  const columns = createColumns<EmployeeDto>({
    includeActions: true,
    extraColumns: [
      { accessorKey: "eId", header: "Employee ID", isBold: true },
      { accessorKey: "fullName", header: "Name", isBold: true },
      { accessorKey: "email", header: "Email", highlight: true },
      { accessorKey: "phone", header: "Phone" },
      { id: "company", header: "Company", accessorFn: (employee) => companies.find((company) => company.id === employee.tenantId)?.name },
      { accessorKey: "gender", header: "Gender" },
      { accessorKey: "birthDate", header: "Birth Date", isDate: true },
      { accessorKey: "status", header: "Status", coloring: { active: BADGE_COLORS.green, inactive: BADGE_COLORS.red } },
    ],
    actionsItems: [{ title: "Delete", onClick: (row) => useConfirmationModalStore.getState().openModal({ title: "delete employee", variant: "destructive", onClick: async () => { await deleteMutation.mutateAsync({ slugReplacement: { id: row.original.id } }); } }) }],
  });

  return <><DataHeader<EmployeeListSearchParamsSchema> searchParamsSchema={employeeListSearchParamsSchema} {...customSearchParams} /><DataTable columns={columns} data={employees} loading={isLoading} pagination={pagination} /></>;
};

export default Client;
