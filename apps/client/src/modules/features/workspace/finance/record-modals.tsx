"use client";

import { useMemo, useState, type FormEvent } from "react";
import { HiOutlineBanknotes, HiOutlineChartPie, HiOutlineDocumentText } from "react-icons/hi2";
import {
  FormModal,
  LabeledInput,
  LabeledSelect,
  ModalActions,
} from "@/modules/workspace/components/form";
import { usePermissions } from "@/modules/workspace/hooks";
import type { CostCreateInput, InvoiceCreateInput } from "@rona/types/finance";
import { useSalesOrders } from "@/modules/features/workspace/sales/hooks";
import {
  useCreateCost,
  useCreateInvoice,
  useCreatePayment,
  useInvoices,
} from "./hooks";

const COST_TYPES = [
  { label: "Raw material", value: "RAW_MATERIAL" },
  { label: "Electricity", value: "ELECTRICITY" },
  { label: "Water", value: "WATER" },
  { label: "Labor", value: "LABOR" },
  { label: "Packaging", value: "PACKAGING" },
  { label: "Fuel", value: "FUEL" },
  { label: "Maintenance", value: "MAINTENANCE" },
  { label: "Depreciation", value: "DEPRECIATION" },
];

const EMPTY_COST = {
  type: "RAW_MATERIAL",
  description: "",
  amount: "",
  costDate: "",
  costCenterId: undefined,
};

type CostForm = typeof EMPTY_COST;

export function RecordCostModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState<CostForm>(EMPTY_COST);
  const createCost = useCreateCost();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.description.trim() || !form.amount || !form.costDate) return;
    const payload: CostCreateInput = {
      type: form.type as CostCreateInput["type"],
      description: form.description.trim(),
      amount: Number(form.amount).toFixed(2),
      costDate: new Date(form.costDate),
    };
    createCost.mutate(payload, {
      onSuccess: () => {
        setForm(EMPTY_COST);
        onClose();
      },
    });
  };

  const onSubmitCost = () => submit({ preventDefault: () => {} } as FormEvent);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Record a cost"
      icon={<HiOutlineChartPie className="h-4 w-4" />}
    >
      <form onSubmit={submit} className="space-y-3">
        <LabeledSelect
          label="Type"
          id="cost-type"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          required
        >
          {COST_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </LabeledSelect>
        <LabeledInput
          label="Description"
          id="cost-description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="e.g. Steel sheets for batch #12"
          required
          maxLength={2000}
        />
        <div className="grid grid-cols-2 gap-3">
          <LabeledInput
            label="Amount"
            id="cost-amount"
            type="number"
            step="0.01"
            min="0"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0.00"
            className="tabular"
            required
          />
          <LabeledInput
            label="Date"
            id="cost-date"
            type="date"
            value={form.costDate}
            onChange={(e) => setForm({ ...form, costDate: e.target.value })}
            required
          />
        </div>
        <ModalActions
          onCancel={onClose}
          onSubmit={onSubmitCost}
          submitLabel="Record cost"
          isPending={createCost.isPending}
        />
      </form>
    </FormModal>
  );
}

const PAYMENT_TERMS = [
  { label: "Immediate", value: "IMMEDIATE" },
  { label: "Net 7", value: "NET_7" },
  { label: "Net 15", value: "NET_15" },
  { label: "Net 30", value: "NET_30" },
  { label: "Net 60", value: "NET_60" },
  { label: "End of month", value: "END_OF_MONTH" },
];

const EMPTY_INVOICE = {
  salesOrderId: "",
  issueDate: "",
  dueDate: "",
  paymentTerms: "",
  notes: "",
};

type InvoiceForm = typeof EMPTY_INVOICE;

export function CreateInvoiceModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState<InvoiceForm>(EMPTY_INVOICE);
  const createInvoice = useCreateInvoice();
  const { hasPermission } = usePermissions();

  const canReadOrders = hasPermission("sales.order.read");
  const { orders, isLoading: ordersLoading } = useSalesOrders();

  const billableOrders = useMemo(
    () =>
      orders.filter((order) =>
        ["CONFIRMED", "FULFILLING", "FULFILLED"].includes(order.status),
      ),
    [orders],
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.salesOrderId) return;
    const payload: InvoiceCreateInput = {
      salesOrderId: form.salesOrderId,
      issueDate: form.issueDate ? new Date(form.issueDate) : undefined,
      dueDate: form.dueDate ? new Date(form.dueDate) : undefined,
      paymentTerms:
        (form.paymentTerms as InvoiceCreateInput["paymentTerms"]) || undefined,
      notes: form.notes.trim() || undefined,
    };
    createInvoice.mutate(payload, {
      onSuccess: () => {
        setForm(EMPTY_INVOICE);
        onClose();
      },
    });
  };

  const onSubmitInvoice = () => submit({ preventDefault: () => {} } as FormEvent);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Create an invoice"
      icon={<HiOutlineDocumentText className="h-4 w-4" />}
    >
      <form onSubmit={submit} className="space-y-3">
        <LabeledSelect
          label="Sales order"
          id="invoice-order"
          value={form.salesOrderId}
          onChange={(e) => setForm({ ...form, salesOrderId: e.target.value })}
          disabled={!canReadOrders || ordersLoading}
          required
        >
          {canReadOrders &&
            billableOrders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.orderNumber} — {order.customerName ?? "Customer"}
              </option>
            ))}
        </LabeledSelect>
        <div className="grid grid-cols-2 gap-3">
          <LabeledInput
            label="Issue date"
            id="invoice-issue-date"
            type="date"
            value={form.issueDate}
            onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
          />
          <LabeledInput
            label="Due date"
            id="invoice-due-date"
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
        </div>
        <LabeledSelect
          label="Payment terms"
          id="invoice-terms"
          value={form.paymentTerms}
          onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
        >
          {PAYMENT_TERMS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </LabeledSelect>
        <LabeledInput
          label="Notes (optional)"
          id="invoice-notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="e.g. Billing for March deliveries"
          maxLength={2000}
        />
        <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs leading-relaxed text-zinc-600">
          The invoice starts as a draft with lines, VAT and totals copied from
          the selected sales order. Issue it once you are ready to send it.
        </p>
        <ModalActions
          onCancel={onClose}
          onSubmit={onSubmitInvoice}
          submitLabel="Create invoice"
          isPending={createInvoice.isPending}
        />
      </form>
    </FormModal>
  );
}

const PAYMENT_METHODS = [
  { label: "Bank", value: "BANK" },
  { label: "Cash", value: "CASH" },
  { label: "Credit note", value: "CREDIT_NOTE" },
];

const EMPTY_PAYMENT = {
  invoiceId: "",
  method: "BANK",
  reference: "",
  paidAt: "",
  notes: "",
};

export function RecordPaymentModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState(EMPTY_PAYMENT);
  const createPayment = useCreatePayment();
  const { hasPermission } = usePermissions();

  const canReadInvoices = hasPermission("finance.invoice.read");
  const { invoices, isLoading: invoicesLoading } = useInvoices();

  const payableInvoices = useMemo(
    () => invoices.filter((i) => i.status === "ISSUED" || i.status === "PARTIALLY_PAID"),
    [invoices],
  );

  const selected = payableInvoices.find((i) => i.id === form.invoiceId);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.invoiceId || !form.reference.trim()) return;
    const outstanding = selected
      ? Number(selected.remainingBalance ?? selected.total)
      : 0;
    createPayment.mutate(
      {
        method: form.method as "BANK" | "CASH" | "CREDIT_NOTE",
        reference: form.reference.trim(),
        paidAt: form.paidAt ? new Date(form.paidAt) : undefined,
        notes: form.notes.trim() || undefined,
        allocations: [
          {
            invoiceId: form.invoiceId,
            amount: outstanding.toFixed(2),
          },
        ],
      },
      {
        onSuccess: () => {
          setForm(EMPTY_PAYMENT);
          onClose();
        },
      },
    );
  };

  const onSubmitPayment = () => submit({ preventDefault: () => {} } as FormEvent);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Record a payment"
      icon={<HiOutlineBanknotes className="h-4 w-4" />}
    >
      <form onSubmit={submit} className="space-y-3">
        <LabeledSelect
          label="Invoice"
          id="payment-invoice"
          value={form.invoiceId}
          onChange={(e) => setForm({ ...form, invoiceId: e.target.value })}
          disabled={!canReadInvoices || invoicesLoading}
          required
        >
          {canReadInvoices &&
            payableInvoices.map((i) => (
              <option key={i.id} value={i.id}>
                {i.invoiceNumber ?? i.id.slice(0, 8)} — {i.customerName ?? "Customer"} ({i.status})
              </option>
            ))}
        </LabeledSelect>
        {selected && (
          <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
            Outstanding balance:{" "}
            <span className="money font-semibold text-zinc-900">
              {Number(selected.remainingBalance ?? selected.total).toFixed(2)}
            </span>{" "}
            — the payment will be allocated in full.
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <LabeledSelect
            label="Method"
            id="payment-method"
            value={form.method}
            onChange={(e) => setForm({ ...form, method: e.target.value })}
            required
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </LabeledSelect>
          <LabeledInput
            label="Date"
            id="payment-date"
            type="date"
            value={form.paidAt}
            onChange={(e) => setForm({ ...form, paidAt: e.target.value })}
          />
        </div>
        <LabeledInput
          label="Reference"
          id="payment-reference"
          value={form.reference}
          onChange={(e) => setForm({ ...form, reference: e.target.value })}
          placeholder="e.g. TRF-2026-00412"
          required
          minLength={3}
          maxLength={100}
        />
        <LabeledInput
          label="Notes (optional)"
          id="payment-notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="e.g. Part payment for INV-0042"
          maxLength={2000}
        />
        <ModalActions
          onCancel={onClose}
          onSubmit={onSubmitPayment}
          submitLabel="Record payment"
          isPending={createPayment.isPending}
        />
      </form>
    </FormModal>
  );
}
