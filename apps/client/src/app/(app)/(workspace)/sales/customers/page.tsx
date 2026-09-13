"use client";

import { HiOutlineUserGroup } from "react-icons/hi2";
import {
  DataTable,
  humanize,
  PageHeader,
  StatusBadge,
  type Column,
} from "@/modules/workspace/components/ui";
import {
  BarList,
  ChartCard,
  ChartStatStrip,
  DonutChart,
  toCategoryPoints,
} from "@/modules/workspace/components/charts";
import type { CustomerDto } from "@rona/types/sales";
import { useSalesCustomers } from "@/modules/features/workspace/sales/hooks";

export default function SalesCustomersPage() {
  const { customers, isLoading } = useSalesCustomers();

  const columns: Column<CustomerDto>[] = [
    {
      key: "name",
      header: "Name",
      render: (row) => <span className="font-medium text-zinc-900">{row.name}</span>,
    },
    {
      key: "phone",
      header: "Phone",
      render: (row) => <span className="text-zinc-600">{row.phone}</span>,
    },
    {
      key: "email",
      header: "Email",
      render: (row) => <span className="text-zinc-600">{row.email ?? "â€”"}</span>,
    },
    {
      key: "vatNumber",
      header: "VAT No.",
      render: (row) => (
        <span className="font-mono text-zinc-600">{row.vatNumber ?? "â€”"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const activeCount = customers.filter(
    (customer) => customer.status === "ACTIVE",
  ).length;

  const statusPoints = toCategoryPoints(
    customers,
    (customer) => humanize(customer.status),
    () => 1,
  );

  const withEmail = customers.filter((customer) => customer.email).length;
  const withVat = customers.filter((customer) => customer.vatNumber).length;

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<HiOutlineUserGroup className="h-4 w-4" />}
        title="Customers"
        description="Customer accounts, contacts, and addresses."
      />

      <ChartStatStrip
        stats={[
          { label: "Total customers", value: String(customers.length) },
          { label: "Active", value: String(activeCount), tone: "emerald" },
          {
            label: "With email on file",
            value: String(withEmail),
          },
          { label: "With VAT number", value: String(withVat) },
        ]}
      />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <ChartCard
          title="Customers by status"
          description="Active vs inactive customer accounts."
          isLoading={isLoading}
          isEmpty={customers.length === 0}
          emptyMessage="No customers yet"
        >
          <DonutChart
            points={statusPoints}
            centerLabel="Customers"
            centerValue={String(customers.length)}
            valueFormat={(value) => String(value)}
          />
        </ChartCard>

        <ChartCard
          title="CRM data completeness"
          description="How many accounts have an email or VAT number recorded."
          isLoading={isLoading}
          isEmpty={customers.length === 0}
          emptyMessage="No customers yet"
        >
          <BarList
            points={[
              { label: "Email on file", value: withEmail },
              { label: "VAT number on file", value: withVat },
              { label: "Missing email", value: customers.length - withEmail },
              { label: "Missing VAT number", value: customers.length - withVat },
            ]}
            valueFormat={(value) => String(value)}
          />
        </ChartCard>
      </div>

      <DataTable
        columns={columns}
        rows={customers}
        isLoading={isLoading}
        emptyMessage="No customers yet"
        emptyDescription="Customers you register will appear here."
      />
    </div>
  );
}
