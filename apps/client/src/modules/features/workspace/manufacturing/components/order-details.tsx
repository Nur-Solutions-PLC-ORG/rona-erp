"use client";

import { useState } from "react";
import { HiOutlineClipboard, HiOutlineCube } from "react-icons/hi2";
import { toast } from "sonner";
import { batchCreateSchema } from "@rona/validation/manufacturing";
import {
  FormModal,
  LabeledInput,
  LabeledTextarea,
  ModalActions,
} from "@/modules/workspace/components/form";
import { DataTable, type Column } from "@/modules/workspace/components/ui";
import type { ProductionOrderMaterialDto } from "@rona/types/manufacturing";
import {
  useCreateProductionBatch,
  useOrderMaterials,
} from "../hooks";

export function OrderMaterialsModal({
  orderId,
  orderNumber,
  itemNameFor,
  onClose,
}: {
  orderId: string;
  orderNumber: string;
  itemNameFor: Map<string, string>;
  onClose: () => void;
}) {
  const { materials, isLoading } = useOrderMaterials(orderId);

  const columns: Column<ProductionOrderMaterialDto>[] = [
    {
      key: "component",
      header: "Component",
      render: (material) => (
        <span className="text-zinc-700">
          {itemNameFor.get(material.componentItemId) ?? material.componentItemId}
        </span>
      ),
    },
    {
      key: "required",
      header: "Required",
      render: (material) => (
        <span className="font-mono text-zinc-700">{material.requiredQuantity}</span>
      ),
    },
    {
      key: "consumed",
      header: "Consumed",
      render: (material) => (
        <span className="font-mono text-zinc-700">{material.consumedQuantity}</span>
      ),
    },
    {
      key: "returned",
      header: "Returned",
      render: (material) => (
        <span className="font-mono text-zinc-500">{material.returnedQuantity}</span>
      ),
    },
  ];

  return (
    <FormModal
      open
      onClose={onClose}
      title={`Materials — ${orderNumber}`}
      icon={<HiOutlineClipboard className="w-4 h-4" />}
      maxWidth="max-w-2xl"
    >
      <DataTable
        columns={columns}
        rows={materials}
        isLoading={isLoading}
        emptyMessage="No material requirements recorded."
      />
    </FormModal>
  );
}

export function CreateBatchModal({
  orderId,
  orderNumber,
  onClose,
}: {
  orderId: string;
  orderNumber: string;
  onClose: () => void;
}) {
  const [batchNumber, setBatchNumber] = useState("");
  const [notes, setNotes] = useState("");

  const { mutate, isPending } = useCreateProductionBatch();

  const submit = () => {
    const parsed = batchCreateSchema.safeParse({
      batchNumber: batchNumber || undefined,
      notes: notes || undefined,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid batch data");
      return;
    }

    mutate(
      { orderId, body: parsed.data },
      {
        onSuccess: () => {
          setBatchNumber("");
          setNotes("");
          onClose();
        },
      },
    );
  };

  return (
    <FormModal
      open
      onClose={onClose}
      title={`New Batch — ${orderNumber}`}
      icon={<HiOutlineCube className="w-4 h-4" />}
    >
      <LabeledInput
        label="Batch number (optional, auto-generated when blank)"
        id="batch-number"
        value={batchNumber}
        onChange={(event) => setBatchNumber(event.target.value)}
        placeholder="e.g. BATCH-001"
      />
      <LabeledTextarea
        label="Notes (optional)"
        id="batch-notes"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Notes about this production batch..."
      />
      <ModalActions
        onCancel={onClose}
        onSubmit={submit}
        submitLabel="Create Batch"
        isPending={isPending}
      />
    </FormModal>
  );
}
