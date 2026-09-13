"use client";

import { useState } from "react";
import {
  HiOutlineDocumentText,
  HiOutlinePlus,
} from "react-icons/hi2";
import {
  BTN_PRIMARY,
  DataTable,
  PageHeader,
  RowActionsMenu,
  StatusBadge,
  type Column,
} from "@/modules/workspace/components/ui";
import {
  AreaChart,
  BarList,
  ChartCard,
  ChartStatStrip,
  humanize,
  toMonthlySeries,
} from "@/modules/workspace/components/charts";
import type { InvoiceDto } from "@rona/types/finance";
import { usePermissions } from "@/modules/workspace/hooks";
import {
  useInvoices,
  useIssueInvoice,
  useVoidInvoice,
} from "@/modules/features/workspace/finance/hooks";
import { CreateInvoiceModal } from "@/modules/features/workspace/finance/record-modals";

function formatMoney(value: string) {
  const amount = Number(value);
  if (Number.isNaN(amount)) return value;
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function isOverdue(invoice: InvoiceDto) {
  return (
    invoice.status !== "PAID" &&
    invoice.status !== "VOID" &&
    invoice.dueDate !== null &&
    new Date(invoice.dueDate).getTime() < Date.now()
  );
}

export default function FinanceInvoicesPage() {
  const { invoices, isLoading } = useInvoices();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission("finance.invoice.create");
  const canIssue = hasPermission("finance.invoice.issue");
  const canVoid = hasPermission("finance.invoice.void");
  const issueInvoice = useIssueInvoice();
  const voidInvoice = useVoidInvoice();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const columns: Column<InvoiceDto>[] = [
    {
      key: "invoiceNumber",
      header: "Invoice #",
      render: (row) => (
        <span className="font-mono text-xs font-medium text-zinc-900">
          {row.invoiceNumber ?? "â€”"}
        </span>
      ),
    },
    {
      key: "customerName",
      header: "Customer",
      render: (row) => <span className="text-zinc-700">{row.customerName ?? "â€”"}</span>,
    },
    {
      key: "dueDate",
      header: "Due Date",
      render: (row) => (
        <span className="font-mono text-xs text-zinc-600">
          {row.dueDate ? new Date(row.dueDate).toLocaleDateString() : "â€”"}
        </span>
      ),
    },
    {
      key: "total",
      header: "Total",
      className: "text-right",
      render: (row) => (
        <span className="font-mono text-xs tabular-nums text-zinc-900">
          {formatMoney(row.total)}
        </span>
      ),
    },
    {
      key: "remainingBalance",
      header: "Balance",
      className: "text-right",
      render: (row) => (
        <span className="font-mono text-xs tabular-nums text-zinc-600">
          {formatMoney(row.remainingBalance)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    ...(canIssue || canVoid
      ? [
          {
            key: "actions",
            header: "Actions",
            render: (row: InvoiceDto) => (
              <RowActionsMenu
                label="Invoice actions"
                items={[
                  ...(canIssue && row.status === "DRAFT"
                    ? [
                        {
                          label: "Issue invoice",
                          onClick: () => issueInvoice.mutate(row.id),
                        },
                      ]
                    : []),
                  ...(canVoid && row.status !== "VOID" && row.status !== "PAID"
                    ? [
                        {
                          label: "Void invoice",
                          onClick: () => voidInvoice.mutate(row.id),
                          destructive: true,
                        },
                      ]
                    : []),
                ]}
              />
            ),
          } satisfies Column<InvoiceDto>,
        ]
      : []),
  ];

  const totals = invoices.reduce(
    (acc, invoice) => {
      if (invoice.status === "VOID") return acc;
      acc.total += Number(invoice.total);
      acc.outstanding += Number(invoice.remainingBalance);
      acc.paid += Number(invoice.paidTotal);
      if (isOverdue(invoice)) acc.overdueCount += 1;
      return acc;
    },
    { total: 0, outstanding: 0, paid: 0, overdueCount: 0 },
  );

  const invoicedSeries = toMonthlySeries(
    invoices,
    6,
    (invoice) => invoice.issueDate ?? invoice.createdAt,
    (invoice) => (invoice.status === "VOID" ? 0 : Number(invoice.total)),
    {
      key: "invoiced",
      label: "Invoiced amount",
      color: "#18181b",
    },
  );

  const statusPoints = Object.entries(
    invoices.reduce<Record<string, number>>((counts, invoice) => {
      counts[invoice.status] = (counts[invoice.status] ?? 0) + 1;
      return counts;
    }, {}),
  )
    .map(([label, value]) => ({ label: humanize(label), value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<HiOutlineDocumentText className="h-4 w-4" />}
        title="Invoices"
        description="Customer invoices with VAT and payment tracking."
        actions={
          canCreate ? (
            <button
              type="button"
              className={BTN_PRIMARY}
              onClick={() => setIsCreateOpen(true)}
            >
              <HiOutlinePlus className="h-4 w-4" />
              Create Invoice
            </button>
          ) : undefined
        }
      />

      <CreateInvoiceModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      <ChartStatStrip
        stats={[
          { label: "Total invoiced", value: formatMoney(String(totals.total)) },
          { label: "Collected", value: formatMoney(String(totals.paid)), tone: "emerald" },
          { label: "Outstanding", value: formatMoney(String(totals.outstanding)), tone: "amber" },
          { label: "Overdue invoices", value: String(totals.overdueCount), tone: "rose" },
        ]}
      />

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard
            title="Invoiced amount by month"
            description="Total value of non-void invoices, last 6 months."
            isLoading={isLoading}
            isEmpty={invoices.length === 0}
            emptyMessage="No invoices yet"
          >
            <AreaChart
              series={invoicedSeries}
              valueFormat={(value) => formatMoney(String(value))}
            />
          </ChartCard>
        </div>

        <ChartCard
          title="Invoices by status"
          description="Distribution across the invoice lifecycle."
          isLoading={isLoading}
          isEmpty={invoices.length === 0}
          emptyMessage="No invoices yet"
        >
          <BarList points={statusPoints} valueFormat={(value) => String(value)} />
        </ChartCard>
      </div>

      <DataTable
        columns={columns}
        rows={invoices}
        isLoading={isLoading}
        emptyMessage="No invoices yet"
        emptyDescription="Invoices you generate will appear here."
      />
    </div>
  );
}
