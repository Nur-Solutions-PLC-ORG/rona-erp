"use client";

import { useState } from "react";
import { HiOutlineBanknotes, HiOutlinePencilSquare, HiOutlinePlus, HiOutlineTrash } from "react-icons/hi2";
import {
  BTN_PRIMARY,
  DataTable,
  humanize,
  PageHeader,
  type Column,
} from "@/modules/workspace/components/ui";
import {
  AreaChart,
  ChartCard,
  ChartStatStrip,
  DonutChart,
  toCategoryPoints,
  toMonthlySeries,
} from "@/modules/workspace/components/charts";
import type { PaymentDto } from "@rona/types/finance";
import { usePermissions } from "@/modules/workspace/hooks";
import { useDeletePayment, usePayments } from "@/modules/features/workspace/finance/hooks";
import { EditPaymentModal, RecordPaymentModal } from "@/modules/features/workspace/finance/record-modals";

function formatMoney(value: string) {
  const amount = Number(value);
  if (Number.isNaN(amount)) return value;
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function FinancePaymentsPage() {
  const { payments, isLoading } = usePayments();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission("finance.payment.create");
  const canEdit = hasPermission("finance.payment.create");
  const canDelete = hasPermission("finance.payment.create");
  const deletePayment = useDeletePayment();

  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentDto | null>(null);

  const columns: Column<PaymentDto>[] = [
    {
      key: "reference",
      header: "Reference",
      render: (row) => (
        <span className="tabular text-xs font-medium text-zinc-900">
          {row.reference}
        </span>
      ),
    },
    {
      key: "method",
      header: "Method",
      render: (row) => <span className="text-zinc-700">{humanize(row.method)}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      className: "text-right",
      render: (row) => (
        <span className="money text-xs font-semibold text-zinc-900">
          {formatMoney(row.amount)}
        </span>
      ),
    },
    {
      key: "paidAt",
      header: "Paid At",
      render: (row) => (
        <span className="tabular text-xs text-zinc-600">
          {new Date(row.paidAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "id",
      header: "",
      className: "w-20 text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          {canEdit && (
            <button
              type="button"
              className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              title="Edit payment"
              onClick={() => setEditingPayment(row)}
            >
              <HiOutlinePencilSquare className="h-4 w-4" />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600"
              title="Delete payment"
              onClick={() => {
                if (!window.confirm("Delete this payment? The linked invoice will be recalculated.")) return;
                deletePayment.mutate(row.id);
              }}
            >
              <HiOutlineTrash className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const totalCollected = payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );

  const methodPoints = toCategoryPoints(
    payments,
    (payment) => humanize(payment.method),
    (payment) => Number(payment.amount),
  );

  const collectedSeries = toMonthlySeries(
    payments,
    6,
    (payment) => payment.paidAt,
    (payment) => Number(payment.amount),
    {
      key: "collected",
      label: "Collected amount",
      color: "#059669",
    },
  );

  const largestPayment = payments.reduce(
    (max, payment) => Math.max(max, Number(payment.amount)),
    0,
  );

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<HiOutlineBanknotes className="h-4 w-4" />}
        title="Payments"
        description="Payments recorded against customer invoices."
        actions={
          canCreate ? (
            <button
              type="button"
              className={BTN_PRIMARY}
              onClick={() => setIsRecordOpen(true)}
            >
              <HiOutlinePlus className="h-4 w-4" />
              Record payment
            </button>
          ) : undefined
        }
      />

      <RecordPaymentModal open={isRecordOpen} onClose={() => setIsRecordOpen(false)} />
      <EditPaymentModal
        open={editingPayment !== null}
        payment={editingPayment}
        onClose={() => setEditingPayment(null)}
      />

      <ChartStatStrip
        stats={[
          { label: "Total collected", value: formatMoney(String(totalCollected)), tone: "emerald" },
          { label: "Payments recorded", value: String(payments.length) },
          { label: "Largest payment", value: formatMoney(String(largestPayment)) },
          {
            label: "Average payment",
            value: formatMoney(
              String(payments.length > 0 ? totalCollected / payments.length : 0),
            ),
          },
        ]}
      />

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard
            title="Collected amount by month"
            description="Cash collected from invoices, last 6 months."
            isLoading={isLoading}
            isEmpty={payments.length === 0}
            emptyMessage="No payments yet"
          >
            <AreaChart
              series={collectedSeries}
              valueFormat={(value) => formatMoney(String(value))}
            />
          </ChartCard>
        </div>

        <ChartCard
          title="Collection by method"
          description="Share of BANK / CASH / CREDIT_NOTE collections."
          isLoading={isLoading}
          isEmpty={payments.length === 0}
          emptyMessage="No payments yet"
        >
          <DonutChart
            points={methodPoints}
            centerLabel="Collected"
            centerValue={formatMoney(String(totalCollected))}
          />
        </ChartCard>
      </div>

      <DataTable
        columns={columns}
        rows={payments}
        isLoading={isLoading}
        emptyMessage="No payments yet"
        emptyDescription="Payments you record will appear here."
      />
    </div>
  );
}
