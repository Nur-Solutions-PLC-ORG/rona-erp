"use client";

import { useState } from "react";
import type { ComponentType } from "react";
import { toast } from "sonner";
import {
  HiOutlineAdjustmentsHorizontal,
  HiOutlineArrowDownTray,
  HiOutlineArrowUpTray,
  HiOutlineArrowUturnLeft,
  HiOutlineArrowsRightLeft,
} from "react-icons/hi2";
import {
  adjustStockSchema,
  issueStockSchema,
  receiveStockSchema,
  returnStockSchema,
  transferStockSchema,
} from "@rona/validation/inventory";
import { ALLOCATION_STRATEGY_LIST } from "@rona/config/inventory";
import {
  FormModal,
  LabeledInput,
  LabeledSelect,
  LabeledTextarea,
  ModalActions,
  ModalSection,
} from "@/modules/workspace/components/form";
import {
  useAdjustStock,
  useIssueStock,
  useItemOptions,
  useLotsForItem,
  useReceiveStock,
  useReturnStock,
  useTransferStock,
  useWarehouseLocations,
  useWarehouseOptions,
} from "../hooks";

export type StockOperation =
  | "receive"
  | "issue"
  | "transfer"
  | "adjust"
  | "return";

const META: Record<
  StockOperation,
  {
    title: string;
    icon: ComponentType<{ className?: string }>;
    submitLabel: string;
  }
> = {
  receive: {
    title: "Receive Stock",
    icon: HiOutlineArrowDownTray,
    submitLabel: "Receive",
  },
  issue: {
    title: "Issue Stock",
    icon: HiOutlineArrowUpTray,
    submitLabel: "Issue",
  },
  transfer: {
    title: "Transfer Stock",
    icon: HiOutlineArrowsRightLeft,
    submitLabel: "Transfer",
  },
  adjust: {
    title: "Adjust Stock",
    icon: HiOutlineAdjustmentsHorizontal,
    submitLabel: "Adjust",
  },
  return: {
    title: "Return Stock",
    icon: HiOutlineArrowUturnLeft,
    submitLabel: "Return",
  },
};

const EMPTY_FORM = {
  itemId: "",
  warehouseId: "",
  fromWarehouseId: "",
  toWarehouseId: "",
  locationId: "",
  toLocationId: "",
  lotId: "",
  lotNumber: "",
  quantity: "",
  quantityDelta: "",
  unitCost: "",
  strategy: "",
  reason: "",
  supplier: "",
  manufactureDate: "",
  expiryDate: "",
  reference: "",
  notes: "",
};

interface StockOperationsProps {
  operation: StockOperation;
  onClose: () => void;
}

export function StockOperations({ operation, onClose }: StockOperationsProps) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const setField = (key: keyof typeof EMPTY_FORM, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const { items, labelFor: itemLabelFor } = useItemOptions();
  const { warehouses, labelFor: warehouseLabelFor } = useWarehouseOptions();

  const locationsWarehouseId =
    operation === "transfer" ? form.toWarehouseId : form.warehouseId;
  const { locations } = useWarehouseLocations(
    locationsWarehouseId || undefined,
  );

  const lotItemId =
    operation === "adjust" || operation === "return" ? form.itemId : "";
  const { lots } = useLotsForItem(lotItemId || undefined);

  const receive = useReceiveStock();
  const issue = useIssueStock();
  const transfer = useTransferStock();
  const adjust = useAdjustStock();
  const returnOp = useReturnStock();
  const isPending =
    receive.isPending ||
    issue.isPending ||
    transfer.isPending ||
    adjust.isPending ||
    returnOp.isPending;

  const fail = (result: { success: false }) => {
    const message = (result as { error?: { issues?: { message?: string }[] } })
      .error?.issues?.[0]?.message;
    toast.error(message ?? "Please review the form and try again.");
  };

  const submit = () => {
    if (operation === "receive") {
      const parsed = receiveStockSchema.safeParse({
        itemId: form.itemId,
        warehouseId: form.warehouseId,
        locationId: form.locationId,
        quantity: form.quantity,
        unitCost: form.unitCost || undefined,
        lotNumber: form.lotNumber,
        supplier: form.supplier || undefined,
        manufactureDate: form.manufactureDate || undefined,
        expiryDate: form.expiryDate || undefined,
        reference: form.reference || undefined,
        notes: form.notes || undefined,
      });
      if (!parsed.success) return fail(parsed);
      receive.mutate(parsed.data, { onSuccess: onClose });
      return;
    }

    if (operation === "issue") {
      const parsed = issueStockSchema.safeParse({
        itemId: form.itemId,
        warehouseId: form.warehouseId,
        quantity: form.quantity,
        strategy: form.strategy || undefined,
        locationId: form.locationId || undefined,
        reference: form.reference || undefined,
        notes: form.notes || undefined,
      });
      if (!parsed.success) return fail(parsed);
      issue.mutate(parsed.data, { onSuccess: onClose });
      return;
    }

    if (operation === "transfer") {
      const parsed = transferStockSchema.safeParse({
        itemId: form.itemId,
        fromWarehouseId: form.fromWarehouseId,
        toWarehouseId: form.toWarehouseId,
        quantity: form.quantity,
        strategy: form.strategy || undefined,
        toLocationId: form.toLocationId,
        reference: form.reference || undefined,
        notes: form.notes || undefined,
      });
      if (!parsed.success) return fail(parsed);
      transfer.mutate(parsed.data, { onSuccess: onClose });
      return;
    }

    if (operation === "adjust") {
      const parsed = adjustStockSchema.safeParse({
        itemId: form.itemId,
        warehouseId: form.warehouseId,
        locationId: form.locationId,
        lotId: form.lotId,
        quantityDelta: form.quantityDelta,
        reason: form.reason,
        reference: form.reference || undefined,
        notes: form.notes || undefined,
      });
      if (!parsed.success) return fail(parsed);
      adjust.mutate(parsed.data, { onSuccess: onClose });
      return;
    }

    const parsed = returnStockSchema.safeParse({
      itemId: form.itemId,
      warehouseId: form.warehouseId,
      locationId: form.locationId,
      lotId: form.lotId,
      quantity: form.quantity,
      reason: form.reason,
      reference: form.reference || undefined,
      notes: form.notes || undefined,
    });
    if (!parsed.success) return fail(parsed);
    returnOp.mutate(parsed.data, { onSuccess: onClose });
  };

  const { title, icon: Icon, submitLabel } = META[operation];
  const locationPlaceholder =
    locations.length === 0 ? "No locations available" : "Select a location…";

  return (
    <FormModal
      open
      onClose={onClose}
      title={title}
      icon={<Icon className="h-4 w-4" />}
    >
      {operation === "receive" ? (
        <>
          <ModalSection title="Item & Location">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <LabeledSelect
                label="Item"
                id="op-item"
                value={form.itemId}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    itemId: e.target.value,
                    lotId: "",
                  }))
                }
              >
                <option value="">Select an item…</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {itemLabelFor.get(item.id)}
                  </option>
                ))}
              </LabeledSelect>
              <LabeledSelect
                label="Warehouse"
                id="op-warehouse"
                value={form.warehouseId}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    warehouseId: e.target.value,
                    locationId: "",
                  }))
                }
              >
                <option value="">Select a warehouse…</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {warehouseLabelFor.get(w.id)}
                  </option>
                ))}
              </LabeledSelect>
              <LabeledSelect
                label="Location"
                id="op-location"
                value={form.locationId}
                onChange={(e) => setField("locationId", e.target.value)}
                disabled={locations.length === 0}
              >
                <option value="">{locationPlaceholder}</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} — {l.name}
                  </option>
                ))}
              </LabeledSelect>
            </div>
          </ModalSection>

          <ModalSection title="Lot & Expiry Tracking">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <LabeledInput
                label="Lot number"
                id="op-lot-number"
                value={form.lotNumber}
                onChange={(e) => setField("lotNumber", e.target.value)}
                placeholder="e.g. LOT-2026-001"
              />
              <LabeledInput
                label="Quantity"
                id="op-quantity"
                value={form.quantity}
                onChange={(e) => setField("quantity", e.target.value)}
                placeholder="e.g. 10.5"
              />
              <LabeledInput
                label="Manufacture date (optional)"
                id="op-mfg-date"
                type="date"
                value={form.manufactureDate}
                onChange={(e) => setField("manufactureDate", e.target.value)}
              />
              <LabeledInput
                label="Expiry date (optional)"
                id="op-expiry-date"
                type="date"
                value={form.expiryDate}
                onChange={(e) => setField("expiryDate", e.target.value)}
              />
            </div>
          </ModalSection>

          <ModalSection title="Vendor & Reference">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <LabeledInput
                label="Supplier (optional)"
                id="op-supplier"
                value={form.supplier}
                onChange={(e) => setField("supplier", e.target.value)}
                placeholder="Supplier name"
              />
              <LabeledInput
                label="Unit cost (optional)"
                id="op-unit-cost"
                value={form.unitCost}
                onChange={(e) => setField("unitCost", e.target.value)}
                placeholder="e.g. 12.5"
              />
              <LabeledInput
                label="Reference (optional)"
                id="op-reference"
                value={form.reference}
                onChange={(e) => setField("reference", e.target.value)}
                placeholder="e.g. PO-2026-014"
              />
            </div>
            <LabeledTextarea
              label="Notes (optional)"
              id="op-notes"
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              rows={2}
              placeholder="Additional context for this movement"
            />
          </ModalSection>
        </>
      ) : null}

        {operation === "issue" ? (
        <>
          <ModalSection title="Item & Location">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <LabeledSelect
                label="Item"
                id="op-item"
                value={form.itemId}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    itemId: e.target.value,
                    lotId: "",
                  }))
                }
              >
                <option value="">Select an item…</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {itemLabelFor.get(item.id)}
                  </option>
                ))}
              </LabeledSelect>
              <LabeledSelect
                label="Warehouse"
                id="op-warehouse"
                value={form.warehouseId}
                onChange={(e) => setField("warehouseId", e.target.value)}
              >
                <option value="">Select a warehouse…</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {warehouseLabelFor.get(w.id)}
                  </option>
                ))}
              </LabeledSelect>
              <LabeledSelect
                label="Location (optional)"
                id="op-location"
                value={form.locationId}
                onChange={(e) => setField("locationId", e.target.value)}
                disabled={locations.length === 0}
              >
                <option value="">
                  {locations.length === 0
                    ? "Any location"
                    : "Any location (auto)"}
                </option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} — {l.name}
                  </option>
                ))}
              </LabeledSelect>
            </div>
          </ModalSection>

          <ModalSection title="Issue Details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <LabeledInput
                label="Quantity"
                id="op-quantity"
                value={form.quantity}
                onChange={(e) => setField("quantity", e.target.value)}
                placeholder="e.g. 10.5"
              />
              <LabeledSelect
                label="Allocation strategy (optional)"
                id="op-strategy"
                value={form.strategy}
                onChange={(e) => setField("strategy", e.target.value)}
              >
                <option value="">Default (FIFO)</option>
                {ALLOCATION_STRATEGY_LIST.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </LabeledSelect>
            </div>
          </ModalSection>
        </>
      ) : null}

        {operation === "transfer" ? (
        <>
          <ModalSection title="Item & Location">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <LabeledSelect
                label="Item"
                id="op-item"
                value={form.itemId}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    itemId: e.target.value,
                    lotId: "",
                  }))
                }
              >
                <option value="">Select an item…</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {itemLabelFor.get(item.id)}
                  </option>
                ))}
              </LabeledSelect>
              <LabeledSelect
                label="From warehouse"
                id="op-from-warehouse"
                value={form.fromWarehouseId}
                onChange={(e) => setField("fromWarehouseId", e.target.value)}
              >
                <option value="">Select a warehouse…</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {warehouseLabelFor.get(w.id)}
                  </option>
                ))}
              </LabeledSelect>
              <LabeledSelect
                label="To warehouse"
                id="op-to-warehouse"
                value={form.toWarehouseId}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    toWarehouseId: e.target.value,
                    toLocationId: "",
                  }))
                }
              >
                <option value="">Select a warehouse…</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {warehouseLabelFor.get(w.id)}
                  </option>
                ))}
              </LabeledSelect>
            </div>
          </ModalSection>

          <ModalSection title="Transfer Details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <LabeledInput
                label="Quantity"
                id="op-quantity"
                value={form.quantity}
                onChange={(e) => setField("quantity", e.target.value)}
                placeholder="e.g. 10.5"
              />
              <LabeledSelect
                label="Allocation strategy (optional)"
                id="op-strategy"
                value={form.strategy}
                onChange={(e) => setField("strategy", e.target.value)}
              >
                <option value="">Default (FIFO)</option>
                {ALLOCATION_STRATEGY_LIST.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </LabeledSelect>
              <LabeledSelect
                label="Destination location"
                id="op-to-location"
                value={form.toLocationId}
                onChange={(e) => setField("toLocationId", e.target.value)}
                disabled={locations.length === 0}
              >
                <option value="">{locationPlaceholder}</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} — {l.name}
                  </option>
                ))}
              </LabeledSelect>
            </div>
          </ModalSection>
        </>
      ) : null}

        {(operation === "adjust" || operation === "return") ? (
        <>
          <ModalSection title="Item & Location">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <LabeledSelect
                label="Item"
                id="op-item"
                value={form.itemId}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    itemId: e.target.value,
                    lotId: "",
                  }))
                }
              >
                <option value="">Select an item…</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {itemLabelFor.get(item.id)}
                  </option>
                ))}
              </LabeledSelect>
              <LabeledSelect
                label="Warehouse"
                id="op-warehouse"
                value={form.warehouseId}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    warehouseId: e.target.value,
                    locationId: "",
                  }))
                }
              >
                <option value="">Select a warehouse…</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {warehouseLabelFor.get(w.id)}
                  </option>
                ))}
              </LabeledSelect>
              <LabeledSelect
                label="Location"
                id="op-location"
                value={form.locationId}
                onChange={(e) => setField("locationId", e.target.value)}
                disabled={locations.length === 0}
              >
                <option value="">{locationPlaceholder}</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} — {l.name}
                  </option>
                ))}
              </LabeledSelect>
            </div>
          </ModalSection>

          <ModalSection
            title={operation === "adjust" ? "Adjustment Details" : "Return Details"}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <LabeledSelect
                label="Lot"
                id="op-lot"
                value={form.lotId}
                onChange={(e) => setField("lotId", e.target.value)}
                disabled={lots.length === 0}
              >
                <option value="">
                  {lots.length === 0 ? "No lots for this item" : "Select a lot…"}
                </option>
                {lots.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    {lot.lotNumber}
                  </option>
                ))}
              </LabeledSelect>
              {operation === "adjust" ? (
                <LabeledInput
                  label="Quantity delta"
                  id="op-quantity-delta"
                  value={form.quantityDelta}
                  onChange={(e) => setField("quantityDelta", e.target.value)}
                  placeholder="e.g. -3.5 or 5"
                />
              ) : (
                <LabeledInput
                  label="Quantity"
                  id="op-quantity"
                  value={form.quantity}
                  onChange={(e) => setField("quantity", e.target.value)}
                  placeholder="e.g. 10.5"
                />
              )}
            </div>
            <LabeledInput
              label="Reason"
              id="op-reason"
              value={form.reason}
              onChange={(e) => setField("reason", e.target.value)}
              placeholder="e.g. Cycle count correction"
            />
          </ModalSection>
        </>
      ) : null}

      {operation !== "receive" ? (
        <ModalSection title="Reference">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <LabeledInput
              label="Reference (optional)"
              id="op-reference"
              value={form.reference}
              onChange={(e) => setField("reference", e.target.value)}
              placeholder="e.g. PO-2026-014"
            />
          </div>
          <LabeledTextarea
            label="Notes (optional)"
            id="op-notes"
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
            rows={2}
            placeholder="Additional context for this movement"
          />
        </ModalSection>
      ) : null}
      <ModalActions
        onCancel={onClose}
        onSubmit={submit}
        submitLabel={submitLabel}
        isPending={isPending}
      />
    </FormModal>
  );
}
