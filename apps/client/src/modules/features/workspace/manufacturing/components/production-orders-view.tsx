"use client";

import { useState } from "react";
import {
  HiOutlineCheck,
  HiOutlineCube,
  HiOutlineDocumentText,
  HiOutlineFingerPrint,
  HiOutlinePlay,
  HiOutlinePlus,
  HiOutlineXMark,
} from "react-icons/hi2";
import { toast } from "sonner";
import { PRODUCTION_ORDER_STATUS_LIST } from "@rona/config/manufacturing";
import { productionOrderCreateSchema } from "@rona/validation/manufacturing";
import { usePermissions } from "@/modules/workspace/hooks";
import { useItemOptions, useWarehouseOptions } from "../../inventory/hooks";
import {
  BTN_PRIMARY,
  Card,
  DataTable,
  EmptyState,
  FilterSelect,
  PageHeader,
  Pagination,
  StatusBadge,
  type Column,
} from "@/modules/workspace/components/ui";
import {
  FormModal,
  LabeledInput,
  LabeledSelect,
  LabeledTextarea,
  ModalActions,
} from "@/modules/workspace/components/form";
import {
  useApproveProductionOrder,
  useBomOptions,
  useCancelProductionOrder,
  useCompleteProductionOrder,
  useCreateProductionOrder,
  useProductionOrders,
  useStartProductionOrder,
} from "../hooks";
import type { ProductionOrderDto } from "@rona/types/manufacturing";
import { CreateBatchModal, OrderMaterialsModal } from "./order-details";

export default function ProductionOrdersView() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("manufacturing.production.read");
  const canCreate = hasPermission("manufacturing.production.create");
  const canApprove = hasPermission("manufacturing.production.approve");
  const canExecute = hasPermission("manufacturing.production.execute");

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [itemId, setItemId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [materialsFor, setMaterialsFor] = useState<ProductionOrderDto | null>(null);
  const [batchFor, setBatchFor] = useState<ProductionOrderDto | null>(null);

  const { orders, meta, isLoading } = useProductionOrders(page, {
    status: status || undefined,
    itemId: itemId || undefined,
    warehouseId: warehouseId || undefined,
    searchQuery: search || undefined,
  });
  const { labelFor: itemLabelFor, nameFor: itemNameFor } = useItemOptions();
  const { labelFor: warehouseLabelFor } = useWarehouseOptions();

  const approve = useApproveProductionOrder();
  const start = useStartProductionOrder();
  const complete = useCompleteProductionOrder();
  const cancel = useCancelProductionOrder();

  const columns: Column<ProductionOrderDto>[] = [
    {
      key: "orderNumber",
      header: "Order #",
      render: (order) => (
        <span className="font-mono font-semibold text-zinc-800">
          {order.orderNumber}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (order) => <StatusBadge status={order.status} />,
    },
    {
      key: "item",
      header: "Item",
      render: (order) => (
        <span className="text-zinc-700">
          {order.itemName
            ? order.itemCode
              ? `${order.itemCode} — ${order.itemName}`
              : order.itemName
            : (itemNameFor.get(order.itemId) ?? "Unknown item")}
        </span>
      ),
    },
    {
      key: "warehouse",
      header: "Warehouse",
      render: (order) => (
        <span className="text-zinc-500">
          {order.warehouseName ??
            warehouseLabelFor.get(order.warehouseId) ??
            "Unknown warehouse"}
        </span>
      ),
    },
    {
      key: "quantity",
      header: "Planned / Produced",
      render: (order) => (
        <span className="font-mono text-zinc-700">
          {order.plannedQuantity} / {order.producedQuantity}
        </span>
      ),
    },
    {
      key: "created",
      header: "Created",
      render: (order) => (
        <span className="text-zinc-500 font-mono">
          {new Date(order.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (order) => {
        const actions = [];

        if (canApprove && (order.status === "DRAFT" || order.status === "PLANNED")) {
          actions.push(
            <button
              key="approve"
              type="button"
              title="Approve order"
              onClick={() => approve.mutate(order.id)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
            >
              <HiOutlineCheck className="w-4 h-4" />
            </button>,
          );
        }

        if (canExecute && order.status === "APPROVED") {
          actions.push(
            <button
              key="start"
              type="button"
              title="Start production"
              onClick={() => start.mutate(order.id)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition"
            >
              <HiOutlinePlay className="w-4 h-4" />
            </button>,
          );
        }

        if (canExecute && order.status === "IN_PROGRESS") {
          actions.push(
            <button
              key="batch"
              type="button"
              title="Create batch"
              onClick={() => setBatchFor(order)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition"
            >
              <HiOutlineCube className="w-4 h-4" />
            </button>,
            <button
              key="complete"
              type="button"
              title="Complete order"
              onClick={() => complete.mutate(order.id)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
            >
              <HiOutlineCheck className="w-4 h-4" />
            </button>,
          );
        }

        if (
          canApprove &&
          (order.status === "DRAFT" ||
            order.status === "PLANNED" ||
            order.status === "APPROVED")
        ) {
          actions.push(
            <button
              key="cancel"
              type="button"
              title="Cancel order"
              onClick={() => cancel.mutate(order.id)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition"
            >
              <HiOutlineXMark className="w-4 h-4" />
            </button>,
          );
        }

        return (
          <div className="flex items-center justify-end gap-0.5">
            <button
              type="button"
              onClick={() => setMaterialsFor(order)}
              className="px-2 py-1 rounded-lg hover:bg-zinc-100 text-zinc-600 text-xs font-medium transition mr-1"
            >
              Materials
            </button>
            {actions}
          </div>
        );
      },
    },
  ];

  if (!canRead) {
    return (
      <EmptyState
        icon={<HiOutlineFingerPrint className="w-6 h-6" />}
        title="Access restricted"
        description="You do not have permission to view production orders."
      />
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<HiOutlineDocumentText className="w-5 h-5" />}
        title="Production Orders"
        description="Plan, approve and execute production runs against approved BOM versions."
        actions={
          canCreate ? (
            <button type="button" className={BTN_PRIMARY} onClick={() => setCreateOpen(true)}>
              <HiOutlinePlus className="w-4 h-4" />
              New Order
            </button>
          ) : undefined
        }
      />

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search order number..."
            className="w-56 px-3 py-1.5 rounded-lg bg-zinc-50 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:bg-white transition text-xs"
          />
          <FilterSelect
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            options={PRODUCTION_ORDER_STATUS_LIST.map((value) => ({
              label: value,
              value,
            }))}
            placeholder="All statuses"
          />
          <FilterSelect
            value={itemId}
            onChange={(value) => {
              setItemId(value);
              setPage(1);
            }}
            options={[...itemLabelFor.entries()].map(([id, label]) => ({
              label,
              value: id,
            }))}
            placeholder="All items"
          />
          <FilterSelect
            value={warehouseId}
            onChange={(value) => {
              setWarehouseId(value);
              setPage(1);
            }}
            options={[...warehouseLabelFor.entries()].map(([id, label]) => ({
              label,
              value: id,
            }))}
            placeholder="All warehouses"
          />
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={orders}
        isLoading={isLoading}
        emptyMessage="No production orders found."
        emptyDescription="Plan and schedule a production run against an approved BOM."
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
        footer={
          meta && meta.totalPages > 1 ? (
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              onPageChange={setPage}
            />
          ) : null
        }
      />

      <CreateOrderModal open={createOpen} onClose={() => setCreateOpen(false)} />

      {materialsFor ? (
        <OrderMaterialsModal
          orderId={materialsFor.id}
          orderNumber={materialsFor.orderNumber}
          itemNameFor={itemNameFor}
          onClose={() => setMaterialsFor(null)}
        />
      ) : null}

      {batchFor ? (
        <CreateBatchModal
          orderId={batchFor.id}
          orderNumber={batchFor.orderNumber}
          onClose={() => setBatchFor(null)}
        />
      ) : null}
    </div>
  );
}

function CreateOrderModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [orderNumber, setOrderNumber] = useState("");
  const [bomId, setBomId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [plannedQuantity, setPlannedQuantity] = useState("");
  const [expectedYieldPercent, setExpectedYieldPercent] = useState("");
  const [plannedStartDate, setPlannedStartDate] = useState("");
  const [plannedEndDate, setPlannedEndDate] = useState("");
  const [notes, setNotes] = useState("");

  const { boms } = useBomOptions();
  const { warehouses } = useWarehouseOptions();
  const { mutate, isPending } = useCreateProductionOrder();

  const reset = () => {
    setOrderNumber("");
    setBomId("");
    setWarehouseId("");
    setPlannedQuantity("");
    setExpectedYieldPercent("");
    setPlannedStartDate("");
    setPlannedEndDate("");
    setNotes("");
  };

  const submit = () => {
    const parsed = productionOrderCreateSchema.safeParse({
      orderNumber: orderNumber || undefined,
      bomId,
      warehouseId,
      plannedQuantity,
      expectedYieldPercent: expectedYieldPercent || undefined,
      plannedStartDate: plannedStartDate || undefined,
      plannedEndDate: plannedEndDate || undefined,
      notes: notes || undefined,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid order data");
      return;
    }

    mutate(
      { body: parsed.data },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      },
    );
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="New Production Order"
      icon={<HiOutlineDocumentText className="w-4 h-4" />}
      maxWidth="max-w-xl"
    >
      <div className="grid grid-cols-2 gap-3">
        <LabeledInput
          label="Order number (optional, auto-generated)"
          id="po-number"
          value={orderNumber}
          onChange={(event) => setOrderNumber(event.target.value)}
          placeholder="e.g. PO-2024-001"
        />
        <LabeledSelect
          label="Warehouse"
          id="po-warehouse"
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
      <LabeledSelect
        label="Bill of Materials"
        id="po-bom"
        value={bomId}
        onChange={(event) => setBomId(event.target.value)}
      >
        <option value="">Select BOM...</option>
        {boms.map((bom) => (
          <option key={bom.id} value={bom.id}>
            {bom.code} — {bom.name}
          </option>
        ))}
      </LabeledSelect>
      <div className="grid grid-cols-2 gap-3">
        <LabeledInput
          label="Planned quantity"
          id="po-quantity"
          value={plannedQuantity}
          onChange={(event) => setPlannedQuantity(event.target.value)}
          placeholder="e.g. 100"
        />
        <LabeledInput
          label="Expected yield % (optional)"
          id="po-yield"
          value={expectedYieldPercent}
          onChange={(event) => setExpectedYieldPercent(event.target.value)}
          placeholder="e.g. 95"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <LabeledInput
          label="Planned start (optional)"
          id="po-start"
          type="datetime-local"
          value={plannedStartDate}
          onChange={(event) => setPlannedStartDate(event.target.value)}
        />
        <LabeledInput
          label="Planned end (optional)"
          id="po-end"
          type="datetime-local"
          value={plannedEndDate}
          onChange={(event) => setPlannedEndDate(event.target.value)}
        />
      </div>
      <LabeledTextarea
        label="Notes (optional)"
        id="po-notes"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Notes about this production run..."
      />
      <ModalActions
        onCancel={onClose}
        onSubmit={submit}
        submitLabel="Create Order"
        isPending={isPending}
      />
    </FormModal>
  );
}
