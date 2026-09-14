"use client";

import { useState } from "react";
import { HiOutlineFingerPrint, HiOutlinePlus, HiOutlineUserGroup } from "react-icons/hi2";
import { toast } from "sonner";
import { customerCreateSchema } from "@rona/validation/sales";
import { usePermissions } from "@/modules/workspace/hooks";
import {
  BTN_PRIMARY,
  DataTable,
  humanize,
  EmptyState,
  PageHeader,
  StatusBadge,
  type Column,
} from "@/modules/workspace/components/ui";
import {
  FormModal,
  LabeledInput,
  ModalActions,
} from "@/modules/workspace/components/form";
import {
  BarList,
  ChartCard,
  ChartStatStrip,
  DonutChart,
  toCategoryPoints,
} from "@/modules/workspace/components/charts";
import type { CustomerDto } from "@rona/types/sales";
import {
  useCreateCustomer,
  useSalesCustomers,
} from "@/modules/features/workspace/sales/hooks";

function CreateCustomerModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [vatNumber, setVatNumber] = useState("");

  const { mutate, isPending } = useCreateCustomer();

  const reset = () => {
    setName("");
    setPhone("");
    setEmail("");
    setVatNumber("");
  };

  const submit = () => {
    const parsed = customerCreateSchema.safeParse({
      name,
      phone,
      email: email || undefined,
      vatNumber: vatNumber || undefined,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid customer data");
      return;
    }

    mutate(parsed.data, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="New Customer"
      icon={<HiOutlineUserGroup className="w-4 h-4" />}
    >
      <LabeledInput
        label="Name"
        id="customer-name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="e.g. Acme Trading PLC"
      />
      <LabeledInput
        label="Phone"
        id="customer-phone"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        placeholder="e.g. +251911234567"
      />
      <LabeledInput
        label="Email (optional)"
        id="customer-email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="e.g. orders@acme.com"
      />
      <LabeledInput
        label="VAT number (optional)"
        id="customer-vat"
        value={vatNumber}
        onChange={(event) => setVatNumber(event.target.value)}
        placeholder="e.g. 0012345678"
      />
      <ModalActions
        onCancel={onClose}
        onSubmit={submit}
        submitLabel="Create Customer"
        isPending={isPending}
      />
    </FormModal>
  );
}

export default function SalesCustomersPage() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("sales.customer.read");
  const canCreate = hasPermission("sales.customer.create");

  const { customers, isLoading } = useSalesCustomers();
  const [createOpen, setCreateOpen] = useState(false);

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
      render: (row) => <span className="text-zinc-600">{row.email ?? "—"}</span>,
    },
    {
      key: "vatNumber",
      header: "VAT No.",
      render: (row) => (
        <span className="font-mono text-zinc-600">{row.vatNumber ?? "—"}</span>
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

  if (!canRead) {
    return (
      <EmptyState
        icon={<HiOutlineFingerPrint className="w-6 h-6" />}
        title="Access restricted"
        description="You do not have permission to view customers."
      />
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<HiOutlineUserGroup className="h-4 w-4" />}
        title="Customers"
        description="Customer accounts, contacts, and addresses."
        actions={
          canCreate ? (
            <button type="button" className={BTN_PRIMARY} onClick={() => setCreateOpen(true)}>
              <HiOutlinePlus className="w-4 h-4" />
              New Customer
            </button>
          ) : undefined
        }
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
        emptyAction={
          canCreate ? (
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800"
              onClick={() => setCreateOpen(true)}
            >
              <HiOutlinePlus className="h-4 w-4" />
              New Customer
            </button>
          ) : undefined
        }
      />

      <CreateCustomerModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
