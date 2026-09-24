"use client";

import { useState } from "react";
import {
  HiOutlineCheck,
  HiOutlineFingerPrint,
  HiOutlinePlus,
  HiOutlineShoppingCart,
  HiOutlineTruck,
  HiOutlineXMark,
} from "react-icons/hi2";
import { toast } from "sonner";
import {
  DEFAULT_VAT_PERCENT,
  PAYMENT_TERMS_LIST,
} from "@rona/config/sales";
import { salesOrderCreateSchema } from "@rona/validation/sales";
import { usePermissions } from "@/modules/workspace/hooks";
import { useItemOptions, useWarehouseOptions } from "@/modules/features/workspace/inventory/hooks";
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
  AreaChart,
  BarList,
  ChartCard,
  ChartStatStrip,
  toCategoryPoints,
  toMonthlySeries,
} from "@/modules/workspace/components/charts";
import {
  FormModal,
  LabeledInput,
  LabeledSelect,
  ModalActions,
  ModalSection,
} from "@/modules/workspace/components/form";
import type { SalesOrderDto } from "@rona/types/sales";
import {
  useCancelSalesOrder,
  useConfirmSalesOrder,
  useCreateSalesOrder,
  useFulfillSalesOrder,
  useSalesAvailability,
  useSalesCustomers,
  useSalesOrders,
} from "@/modules/features/workspace/sales/hooks";

function formatMoney(value: string) {
  const amount = Number(value);
  if (Number.isNaN(amount)) return value;
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface OrderLineForm {
  itemId: string;
  quantity: string;
  unitPrice: string;
  discountPercent: string;
  vatPercent: string;
}

const emptyLine = (): OrderLineForm => ({
  itemId: "",
  quantity: "",
  unitPrice: "",
  discountPercent: "",
  vatPercent: DEFAULT_VAT_PERCENT,
});

function lineTotals(line: OrderLineForm) {
  const quantity = Number(line.quantity) || 0;
  const unitPrice = Number(line.unitPrice) || 0;
  const discountPercent = Number(line.discountPercent) || 0;
  const vatPercent = Number(line.vatPercent) || 0;

  const gross = quantity * unitPrice;
  const discount = (gross * discountPercent) / 100;
  const net = gross - discount;
  const vat = (net * vatPercent) / 100;
  return { gross, discount, net, vat, total: net + vat };
}

function LineAvailability({
  itemId,
  warehouseId,
  quantity,
}: {
  itemId: string;
  warehouseId: string;
  quantity: string;
}) {
  const { availability, isLoading } = useSalesAvailability(
    itemId || undefined,
    warehouseId || undefined,
  );

  if (!itemId || !warehouseId) return null;

  const totalAvailable = Number(availability?.totalAvailable ?? 0);
  const requested = Number(quantity) || 0;
  const insufficient = !isLoading && requested > totalAvailable;

  return (
    <p
      className={`text-xs font-medium ${
        insufficient ? "text-rose-600" : "text-zinc-500"
      }`}
    >
      {isLoading
        ? "Checking availability..."
        : insufficient
          ? `Insufficient stock — available: ${totalAvailable.toFixed(2)}`
          : `Available: ${totalAvailable.toFixed(2)}`}
    </p>
  );
}

function CreateOrderModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [customerId, setCustomerId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<OrderLineForm[]>([emptyLine()]);

  const { customers } = useSalesCustomers();
  const { warehouses } = useWarehouseOptions();
  const { items, labelFor: itemLabelFor } = useItemOptions();
  const { mutate, isPending } = useCreateSalesOrder();

  const reset = () => {
    setCustomerId("");
    setWarehouseId("");
    setPaymentTerms("");
    setNotes("");
    setLines([emptyLine()]);
  };

  const updateLine = (index: number, patch: Partial<OrderLineForm>) => {
    setLines((current) =>
      current.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    );
  };

  const totals = lines.reduce(
    (acc, line) => {
      const t = lineTotals(line);
      return {
        gross: acc.gross + t.gross,
        discount: acc.discount + t.discount,
        vat: acc.vat + t.vat,
        total: acc.total + t.total,
      };
    },
    { gross: 0, discount: 0, vat: 0, total: 0 },
  );

  const submit = () => {
    const parsed = salesOrderCreateSchema.safeParse({
      customerId,
      warehouseId,
      paymentTerms: paymentTerms || undefined,
      notes: notes || undefined,
      lines: lines.map((line) => ({
        itemId: line.itemId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountPercent: line.discountPercent || undefined,
        vatPercent: line.vatPercent || undefined,
      })),
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid order data");
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
      title="New Sales Order"
      icon={<HiOutlineShoppingCart className="w-4 h-4" />}
      maxWidth="max-w-2xl"
    >
      <ModalSection title="Order details">
        <div className="grid grid-cols-2 gap-3">
          <LabeledSelect
            label="Customer"
            id="so-customer"
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
          >
            <option value="">Select customer...</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </LabeledSelect>
          <LabeledSelect
            label="Warehouse"
            id="so-warehouse"
            value={warehouseId}
            onChange={(event) => setWarehouseId(event.target.value)}
          >
            <option value="">Select warehouse...</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.code} — {warehouse.name}
              </option>
            ))}
          </LabeledSelect>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <LabeledSelect
            label="Payment terms (optional)"
            id="so-terms"
            value={paymentTerms}
            onChange={(event) => setPaymentTerms(event.target.value)}
          >
            <option value="">Select terms...</option>
            {PAYMENT_TERMS_LIST.map((terms) => (
              <option key={terms} value={terms}>
                {humanize(terms)}
              </option>
            ))}
          </LabeledSelect>
          <LabeledInput
            label="Notes (optional)"
            id="so-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Order notes..."
          />
        </div>
      </ModalSection>

      <ModalSection title="Line items">
        <div className="space-y-3">
          {lines.map((line, index) => {
            const t = lineTotals(line);
            return (
              <div
                key={index}
                className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 space-y-2.5"
              >
                <div className="flex items-center gap-2">
                  <LabeledSelect
                    label="Item"
                    id={`so-line-item-${index}`}
                    className="flex-1"
                    value={line.itemId}
                    onChange={(event) =>
                      updateLine(index, { itemId: event.target.value })
                    }
                  >
                    <option value="">Select item...</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {itemLabelFor.get(item.id) ?? item.name}
                      </option>
                    ))}
                  </LabeledSelect>
                  {lines.length > 1 ? (
                    <button
                      type="button"
                      title="Remove line"
                      onClick={() =>
                        setLines((current) =>
                          current.filter((_, i) => i !== index),
                        )
                      }
                      className="mt-5 shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      <HiOutlineXMark className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <LabeledInput
                    label="Quantity"
                    id={`so-line-qty-${index}`}
                    value={line.quantity}
                    onChange={(event) =>
                      updateLine(index, { quantity: event.target.value })
                    }
                    placeholder="e.g. 10"
                  />
                  <LabeledInput
                    label="Unit price"
                    id={`so-line-price-${index}`}
                    value={line.unitPrice}
                    onChange={(event) =>
                      updateLine(index, { unitPrice: event.target.value })
                    }
                    placeholder="e.g. 25.00"
                  />
                  <LabeledInput
                    label="Discount %"
                    id={`so-line-discount-${index}`}
                    value={line.discountPercent}
                    onChange={(event) =>
                      updateLine(index, { discountPercent: event.target.value })
                    }
                    placeholder="0"
                  />
                  <LabeledInput
                    label="VAT %"
                    id={`so-line-vat-${index}`}
                    value={line.vatPercent}
                    onChange={(event) =>
                      updateLine(index, { vatPercent: event.target.value })
                    }
                    placeholder="15"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <LineAvailability
                    itemId={line.itemId}
                    warehouseId={warehouseId}
                    quantity={line.quantity}
                  />
                  {t.gross > 0 ? (
                    <span className="font-mono text-xs tabular-nums text-zinc-700">
                      Line total: {formatMoney(t.total.toFixed(2))}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => setLines((current) => [...current, emptyLine()])}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-700"
          >
            <HiOutlinePlus className="h-4 w-4" />
            Add line
          </button>
        </div>
      </ModalSection>

      <div className="rounded-xl bg-zinc-50 p-3 text-right space-y-1 font-mono text-xs tabular-nums text-zinc-600">
        <p>Subtotal: {formatMoney(totals.gross.toFixed(2))}</p>
        <p>Discount: -{formatMoney(totals.discount.toFixed(2))}</p>
        <p>VAT: +{formatMoney(totals.vat.toFixed(2))}</p>
        <p className="text-sm font-semibold text-zinc-900">
          Total: {formatMoney(totals.total.toFixed(2))}
        </p>
      </div>

      <ModalActions
        onCancel={onClose}
        onSubmit={submit}
        submitLabel="Create Order"
        isPending={isPending}
      />
    </FormModal>
  );
}

export default function SalesOrdersPage() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("sales.order.read");
  const canCreate = hasPermission("sales.order.create");
  const canConfirm = hasPermission("sales.order.confirm");
  const canCancel = hasPermission("sales.order.cancel");

  const { orders, isLoading } = useSalesOrders();
  const [createOpen, setCreateOpen] = useState(false);

  const confirm = useConfirmSalesOrder();
  const fulfill = useFulfillSalesOrder();
  const cancel = useCancelSalesOrder();

  const columns: Column<SalesOrderDto>[] = [
    {
      key: "orderNumber",
      header: "Order #",
      render: (row) => (
        <span className="font-mono text-xs font-medium text-zinc-900">
          {row.orderNumber}
        </span>
      ),
    },
    {
      key: "customerName",
      header: "Customer",
      render: (row) => <span className="text-zinc-700">{row.customerName ?? "—"}</span>,
    },
    {
      key: "orderDate",
      header: "Date",
      render: (row) => (
        <span className="font-mono text-xs text-zinc-600">
          {new Date(row.orderDate).toLocaleDateString()}
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
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "",
      render: (row) => {
        const actions = [];

        if (canConfirm && row.status === "DRAFT") {
          actions.push(
            <button
              key="confirm"
              type="button"
              title="Confirm order (reserves stock)"
              onClick={() => confirm.mutate(row.id)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
            >
              <HiOutlineCheck className="w-4 h-4" />
            </button>,
          );
        }

        if (canConfirm && row.status === "CONFIRMED") {
          actions.push(
            <button
              key="fulfill"
              type="button"
              title="Fulfill order (issues stock)"
              onClick={() => fulfill.mutate(row.id)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
            >
              <HiOutlineTruck className="w-4 h-4" />
            </button>,
          );
        }

        if (canCancel && (row.status === "DRAFT" || row.status === "CONFIRMED")) {
          actions.push(
            <button
              key="cancel"
              type="button"
              title="Cancel order"
              onClick={() => cancel.mutate(row.id)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition"
            >
              <HiOutlineXMark className="w-4 h-4" />
            </button>,
          );
        }

        return <div className="flex items-center justify-end gap-0.5">{actions}</div>;
      },
    },
  ];

  const active = orders.filter(
    (order) => order.status !== "CANCELLED",
  );
  const totalValue = active.reduce((sum, order) => sum + Number(order.total), 0);
  const confirmedValue = orders
    .filter((order) =>
      ["CONFIRMED", "FULFILLING", "FULFILLED"].includes(order.status),
    )
    .reduce((sum, order) => sum + Number(order.total), 0);
  const draftCount = orders.filter((order) => order.status === "DRAFT").length;

  const valueSeries = toMonthlySeries(
    active,
    6,
    (order) => order.orderDate,
    (order) => Number(order.total),
    {
      key: "order-value",
      label: "Order value",
      color: "#18181b",
    },
  );

  const statusPoints = toCategoryPoints(
    orders,
    (order) => humanize(order.status),
    () => 1,
  );

  const topCustomers = toCategoryPoints(
    active,
    (order) => order.customerName ?? "Unknown",
    (order) => Number(order.total),
  );

  if (!canRead) {
    return (
      <EmptyState
        icon={<HiOutlineFingerPrint className="w-6 h-6" />}
        title="Access restricted"
        description="You do not have permission to view sales orders."
      />
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<HiOutlineShoppingCart className="h-4 w-4" />}
        title="Sales Orders"
        description="Sales orders with FIFO batch allocation and reservations."
        actions={
          canCreate ? (
            <button type="button" className={BTN_PRIMARY} onClick={() => setCreateOpen(true)}>
              <HiOutlinePlus className="w-4 h-4" />
              New Order
            </button>
          ) : undefined
        }
      />

      <ChartStatStrip
        stats={[
          { label: "Pipeline value", value: formatMoney(String(totalValue)) },
          { label: "Confirmed value", value: formatMoney(String(confirmedValue)), tone: "emerald" },
          { label: "Draft orders", value: String(draftCount), tone: "amber" },
          { label: "Total orders", value: String(orders.length) },
        ]}
      />

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard
            title="Order value by month"
            description="Value of non-cancelled sales orders, last 6 months."
            isLoading={isLoading}
            isEmpty={orders.length === 0}
            emptyMessage="No sales orders yet"
          >
            <AreaChart
              series={valueSeries}
              valueFormat={(value) => formatMoney(String(value))}
            />
          </ChartCard>
        </div>

        <ChartCard
          title="Orders by status"
          description="Distribution across the order lifecycle."
          isLoading={isLoading}
          isEmpty={orders.length === 0}
          emptyMessage="No sales orders yet"
        >
          <BarList
            points={statusPoints}
            valueFormat={(value) => String(value)}
          />
        </ChartCard>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <ChartCard
          title="Top customers"
          description="Highest order value per customer."
          isLoading={isLoading}
          isEmpty={orders.length === 0}
          emptyMessage="No sales orders yet"
        >
          <BarList
            points={topCustomers}
            valueFormat={(value) => formatMoney(String(value))}
          />
        </ChartCard>

        <ChartCard
          title="Sales by month (order count)"
          description="Number of non-cancelled orders placed, last 6 months."
          isLoading={isLoading}
          isEmpty={orders.length === 0}
          emptyMessage="No sales orders yet"
        >
          <BarList
            points={toMonthlySeries(
              active,
              6,
              (order) => order.orderDate,
              () => 1,
              {
                key: "order-count",
                label: "Orders",
                color: "#18181b",
              },
            ).points}
            valueFormat={(value) => String(value)}
          />
        </ChartCard>
      </div>

      <DataTable
        columns={columns}
        rows={orders}
        isLoading={isLoading}
        emptyMessage="No sales orders yet"
        emptyDescription="Orders you create will appear here."
        emptyAction={
          canCreate ? (
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800"
              onClick={() => setCreateOpen(true)}
            >
              <HiOutlinePlus className="h-4 w-4" />
              New Order
            </button>
          ) : undefined
        }
      />

      <CreateOrderModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
