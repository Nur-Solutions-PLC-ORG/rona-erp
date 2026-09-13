"use client";

import { useState } from "react";
import { HiOutlineCheck, HiOutlineCube } from "react-icons/hi2";
import { toast } from "sonner";
import {
  materialConsumptionSchema,
  materialReturnSchema,
  productionOutputSchema,
} from "@rona/validation/manufacturing";
import type { ProductionBatchDto } from "@rona/types/manufacturing";
import {
  useItemOptions,
  useLotsForItem,
  useWarehouseLocations,
  useWarehouseOptions,
} from "../../inventory/hooks";
import { FormModal, LabeledInput, LabeledSelect, LabeledTextarea, ModalActions } from "@/modules/workspace/components/form";
import {
  useBatchConsumptions,
  useBatchOutputs,
  useBatchReturns,
  useCompleteBatch,
  useConsumeMaterial,
  useRecordOutput,
  useReturnMaterial,
} from "../hooks";

type Tab = "consume" | "return" | "output";

const TABS: { key: Tab; label: string }[] = [
  { key: "consume", label: "Consume" },
  { key: "return", label: "Return" },
  { key: "output", label: "Output" },
];

export function BatchOperationsModal({
  batch,
  onClose,
}: {
  batch: ProductionBatchDto;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("consume");
  const complete = useCompleteBatch();
  const { nameFor: itemNameFor } = useItemOptions();

  return (
    <FormModal
      open
      onClose={onClose}
      title={`Batch ${batch.batchNumber}`}
      icon={<HiOutlineCube className="w-4 h-4" />}
      maxWidth="max-w-xl"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg bg-zinc-100 p-1">
          {TABS.map((entry) => (
            <button
              key={entry.key}
              type="button"
              onClick={() => setTab(entry.key)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                tab === entry.key
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {entry.label}
            </button>
          ))}
        </div>
        {batch.status === "IN_PROGRESS" ? (
          <button
            type="button"
            disabled={complete.isPending}
            onClick={() =>
              complete.mutate(
                { slugReplacement: { id: batch.id } },
                { onSuccess: onClose },
              )
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold transition"
          >
            <HiOutlineCheck className="w-3.5 h-3.5" />
            Complete Batch
          </button>
        ) : null}
      </div>

      {tab === "consume" ? <ConsumeForm batchId={batch.id} /> : null}
      {tab === "return" ? <ReturnForm batchId={batch.id} /> : null}
      {tab === "output" ? <OutputForm batchId={batch.id} /> : null}

      <div className="border-t border-zinc-100 pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-2">
          History
        </p>
        {tab === "consume" ? (
          <ConsumptionsList batchId={batch.id} itemNameFor={itemNameFor} />
        ) : null}
        {tab === "return" ? (
          <ReturnsList batchId={batch.id} itemNameFor={itemNameFor} />
        ) : null}
        {tab === "output" ? <OutputsList batchId={batch.id} /> : null}
      </div>
    </FormModal>
  );
}

function ConsumeForm({ batchId }: { batchId: string }) {
  const [itemId, setItemId] = useState("");
  const [lotId, setLotId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isScrap, setIsScrap] = useState(false);
  const [substitutedForItemId, setSubstitutedForItemId] = useState("");
  const [notes, setNotes] = useState("");

  const { items } = useItemOptions();
  const { lots } = useLotsForItem(itemId || undefined);
  const { warehouses } = useWarehouseOptions();
  const { locations } = useWarehouseLocations(warehouseId || undefined);
  const { mutate, isPending } = useConsumeMaterial();

  const reset = () => {
    setItemId("");
    setLotId("");
    setWarehouseId("");
    setLocationId("");
    setQuantity("");
    setIsScrap(false);
    setSubstitutedForItemId("");
    setNotes("");
  };

  const submit = () => {
    const parsed = materialConsumptionSchema.safeParse({
      itemId,
      lotId,
      locationId,
      quantity,
      isScrap: isScrap || undefined,
      substitutedForItemId: substitutedForItemId || undefined,
      notes: notes || undefined,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid consumption data");
      return;
    }

    mutate(
      { body: parsed.data, slugReplacement: { id: batchId } },
      { onSuccess: reset },
    );
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <LabeledSelect
          label="Component item"
          id="consume-item"
          value={itemId}
          onChange={(event) => {
            setItemId(event.target.value);
            setLotId("");
          }}
        >
          <option value="">Select item...</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.code} — {item.name}
            </option>
          ))}
        </LabeledSelect>
        <LabeledSelect
          label="Lot"
          id="consume-lot"
          value={lotId}
          onChange={(event) => setLotId(event.target.value)}
          disabled={!itemId}
        >
          <option value="">Select lot...</option>
          {lots.map((lot) => (
            <option key={lot.id} value={lot.id}>
              {lot.lotNumber}
            </option>
          ))}
        </LabeledSelect>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <LabeledSelect
          label="Warehouse"
          id="consume-warehouse"
          value={warehouseId}
          onChange={(event) => {
            setWarehouseId(event.target.value);
            setLocationId("");
          }}
        >
          <option value="">Select warehouse...</option>
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.code} — {warehouse.name}
            </option>
          ))}
        </LabeledSelect>
        <LabeledSelect
          label="Location"
          id="consume-location"
          value={locationId}
          onChange={(event) => setLocationId(event.target.value)}
          disabled={!warehouseId}
        >
          <option value="">Select location...</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.code} — {location.name}
            </option>
          ))}
        </LabeledSelect>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <LabeledInput
          label="Quantity"
          id="consume-quantity"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          placeholder="e.g. 10"
        />
        <LabeledSelect
          label="Substitute for (optional)"
          id="consume-substitute"
          value={substitutedForItemId}
          onChange={(event) => setSubstitutedForItemId(event.target.value)}
        >
          <option value="">None</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.code} — {item.name}
            </option>
          ))}
        </LabeledSelect>
      </div>
      <label className="flex items-center gap-2 text-xs text-zinc-600 font-medium">
        <input
          type="checkbox"
          checked={isScrap}
          onChange={(event) => setIsScrap(event.target.checked)}
          className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
        />
        Mark as scrap
      </label>
      <LabeledTextarea
        label="Notes (optional)"
        id="consume-notes"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
      />
      <ModalActions
        onCancel={() => reset()}
        onSubmit={submit}
        submitLabel="Consume Material"
        isPending={isPending}
      />
    </div>
  );
}

function ReturnForm({ batchId }: { batchId: string }) {
  const [itemId, setItemId] = useState("");
  const [lotId, setLotId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const { items } = useItemOptions();
  const { lots } = useLotsForItem(itemId || undefined);
  const { warehouses } = useWarehouseOptions();
  const { locations } = useWarehouseLocations(warehouseId || undefined);
  const { mutate, isPending } = useReturnMaterial();

  const reset = () => {
    setItemId("");
    setLotId("");
    setWarehouseId("");
    setLocationId("");
    setQuantity("");
    setReason("");
    setNotes("");
  };

  const submit = () => {
    const parsed = materialReturnSchema.safeParse({
      itemId,
      lotId,
      locationId,
      quantity,
      reason,
      notes: notes || undefined,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid return data");
      return;
    }

    mutate(
      { body: parsed.data, slugReplacement: { id: batchId } },
      { onSuccess: reset },
    );
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <LabeledSelect
          label="Item"
          id="return-item"
          value={itemId}
          onChange={(event) => {
            setItemId(event.target.value);
            setLotId("");
          }}
        >
          <option value="">Select item...</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.code} — {item.name}
            </option>
          ))}
        </LabeledSelect>
        <LabeledSelect
          label="Lot"
          id="return-lot"
          value={lotId}
          onChange={(event) => setLotId(event.target.value)}
          disabled={!itemId}
        >
          <option value="">Select lot...</option>
          {lots.map((lot) => (
            <option key={lot.id} value={lot.id}>
              {lot.lotNumber}
            </option>
          ))}
        </LabeledSelect>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <LabeledSelect
          label="Warehouse"
          id="return-warehouse"
          value={warehouseId}
          onChange={(event) => {
            setWarehouseId(event.target.value);
            setLocationId("");
          }}
        >
          <option value="">Select warehouse...</option>
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.code} — {warehouse.name}
            </option>
          ))}
        </LabeledSelect>
        <LabeledSelect
          label="Location"
          id="return-location"
          value={locationId}
          onChange={(event) => setLocationId(event.target.value)}
          disabled={!warehouseId}
        >
          <option value="">Select location...</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.code} — {location.name}
            </option>
          ))}
        </LabeledSelect>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <LabeledInput
          label="Quantity"
          id="return-quantity"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          placeholder="e.g. 5"
        />
        <LabeledInput
          label="Reason"
          id="return-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="e.g. Over-issued"
        />
      </div>
      <LabeledTextarea
        label="Notes (optional)"
        id="return-notes"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
      />
      <ModalActions
        onCancel={() => reset()}
        onSubmit={submit}
        submitLabel="Return Material"
        isPending={isPending}
      />
    </div>
  );
}

function OutputForm({ batchId }: { batchId: string }) {
  const [lotNumber, setLotNumber] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [scrapQuantity, setScrapQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [notes, setNotes] = useState("");

  const { warehouses } = useWarehouseOptions();
  const { locations } = useWarehouseLocations(warehouseId || undefined);
  const { mutate, isPending } = useRecordOutput();

  const reset = () => {
    setLotNumber("");
    setWarehouseId("");
    setLocationId("");
    setQuantity("");
    setScrapQuantity("");
    setUnitCost("");
    setNotes("");
  };

  const submit = () => {
    const parsed = productionOutputSchema.safeParse({
      lotNumber,
      locationId,
      quantity,
      scrapQuantity: scrapQuantity || undefined,
      unitCost: unitCost || undefined,
      notes: notes || undefined,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid output data");
      return;
    }

    mutate(
      { body: parsed.data, slugReplacement: { id: batchId } },
      { onSuccess: reset },
    );
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <LabeledInput
          label="Output lot number"
          id="output-lot"
          value={lotNumber}
          onChange={(event) => setLotNumber(event.target.value)}
          placeholder="e.g. LOT-2024-042"
        />
        <LabeledSelect
          label="Warehouse"
          id="output-warehouse"
          value={warehouseId}
          onChange={(event) => {
            setWarehouseId(event.target.value);
            setLocationId("");
          }}
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
        label="Location"
        id="output-location"
        value={locationId}
        onChange={(event) => setLocationId(event.target.value)}
        disabled={!warehouseId}
      >
        <option value="">Select location...</option>
        {locations.map((location) => (
          <option key={location.id} value={location.id}>
            {location.code} — {location.name}
          </option>
        ))}
      </LabeledSelect>
      <div className="grid grid-cols-3 gap-3">
        <LabeledInput
          label="Quantity"
          id="output-quantity"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          placeholder="e.g. 100"
        />
        <LabeledInput
          label="Scrap qty (optional)"
          id="output-scrap"
          value={scrapQuantity}
          onChange={(event) => setScrapQuantity(event.target.value)}
          placeholder="e.g. 2"
        />
        <LabeledInput
          label="Unit cost (optional)"
          id="output-cost"
          value={unitCost}
          onChange={(event) => setUnitCost(event.target.value)}
          placeholder="e.g. 12.50"
        />
      </div>
      <LabeledTextarea
        label="Notes (optional)"
        id="output-notes"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
      />
      <ModalActions
        onCancel={() => reset()}
        onSubmit={submit}
        submitLabel="Record Output"
        isPending={isPending}
      />
    </div>
  );
}

function ConsumptionsList({
  batchId,
  itemNameFor,
}: {
  batchId: string;
  itemNameFor: Map<string, string>;
}) {
  const { consumptions, isLoading } = useBatchConsumptions(batchId);

  if (isLoading) {
    return <p className="text-xs text-zinc-400">Loading…</p>;
  }
  if (consumptions.length === 0) {
    return <p className="text-xs text-zinc-400">No material consumed yet.</p>;
  }

  return (
    <div className="space-y-1">
      {consumptions.map((consumption) => (
        <div
          key={consumption.movementId}
          className="flex items-center justify-between gap-2 text-xs"
        >
          <span className="text-zinc-700 truncate">
            {itemNameFor.get(consumption.itemId) ?? consumption.itemId}
            {consumption.isScrap ? (
              <span className="text-rose-600 font-medium"> (scrap)</span>
            ) : null}
          </span>
          <span className="font-mono text-zinc-600">
            {consumption.quantity}
          </span>
          <span className="text-zinc-400 font-mono shrink-0">
            {new Date(consumption.consumedAt).toLocaleTimeString()}
          </span>
        </div>
      ))}
    </div>
  );
}

function ReturnsList({
  batchId,
  itemNameFor,
}: {
  batchId: string;
  itemNameFor: Map<string, string>;
}) {
  const { returns, isLoading } = useBatchReturns(batchId);

  if (isLoading) {
    return <p className="text-xs text-zinc-400">Loading…</p>;
  }
  if (returns.length === 0) {
    return <p className="text-xs text-zinc-400">No material returned.</p>;
  }

  return (
    <div className="space-y-1">
      {returns.map((entry) => (
        <div
          key={entry.movementId}
          className="flex items-center justify-between gap-2 text-xs"
        >
          <span className="text-zinc-700 truncate">
            {itemNameFor.get(entry.itemId) ?? entry.itemId}
          </span>
          <span className="font-mono text-zinc-600">{entry.quantity}</span>
          <span className="text-zinc-500 truncate">{entry.reason}</span>
          <span className="text-zinc-400 font-mono shrink-0">
            {new Date(entry.returnedAt).toLocaleTimeString()}
          </span>
        </div>
      ))}
    </div>
  );
}

function OutputsList({ batchId }: { batchId: string }) {
  const { outputs, isLoading } = useBatchOutputs(batchId);

  if (isLoading) {
    return <p className="text-xs text-zinc-400">Loading…</p>;
  }
  if (outputs.length === 0) {
    return <p className="text-xs text-zinc-400">No output recorded yet.</p>;
  }

  return (
    <div className="space-y-1">
      {outputs.map((output) => (
        <div
          key={output.movementId}
          className="flex items-center justify-between gap-2 text-xs"
        >
          <span className="text-zinc-700">Produced</span>
          <span className="font-mono text-zinc-600">
            {output.quantity}
            {output.scrapQuantity ? (
              <span className="text-rose-600"> (+{output.scrapQuantity} scrap)</span>
            ) : null}
          </span>
          <span className="text-zinc-400 font-mono shrink-0">
            {new Date(output.recordedAt).toLocaleTimeString()}
          </span>
        </div>
      ))}
    </div>
  );
}
