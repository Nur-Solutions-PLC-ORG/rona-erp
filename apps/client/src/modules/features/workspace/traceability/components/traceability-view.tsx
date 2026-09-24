"use client";

import { useState } from "react";
import { HiOutlineFingerPrint, HiOutlineSquares2X2 } from "react-icons/hi2";
import { usePermissions } from "@/modules/workspace/hooks";
import { useItemOptions, useLotsForItem } from "../../inventory/hooks";
import {
  Card,
  EmptyState,
  FilterSelect,
  PageHeader,
  StatusBadge,
} from "@/modules/workspace/components/ui";
import { useForwardTrace, useLotDetail, useReverseTrace } from "../hooks";

const OVERVIEW_LABEL = "text-xs font-medium text-gray-500";
const OVERVIEW_VALUE = "text-sm text-gray-900";
const SECTION_TITLE = "text-sm font-semibold text-gray-900";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className={OVERVIEW_LABEL}>{label}</p>
      <div className={OVERVIEW_VALUE}>{children}</div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-4">
      <h3 className={`${SECTION_TITLE} mb-3`}>{title}</h3>
      {children}
    </Card>
  );
}

export default function TraceabilityView() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("traceability.read");

  const [itemId, setItemId] = useState("");
  const [lotId, setLotId] = useState("");

  const { items, labelFor: itemLabelFor } = useItemOptions();
  const { lots } = useLotsForItem(itemId || undefined);

  const { detail, isLoading: detailLoading } = useLotDetail(lotId || undefined);
  const { forward, isLoading: forwardLoading } = useForwardTrace(lotId || undefined);
  const { reverse, isLoading: reverseLoading } = useReverseTrace(lotId || undefined);

  if (!canRead) {
    return (
      <EmptyState
        icon={<HiOutlineFingerPrint />}
        title="Access restricted"
        description="You do not have permission to view lot traceability."
      />
    );
  }

  const loading = detailLoading || forwardLoading || reverseLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<HiOutlineSquares2X2 />}
        title="Lot Traceability"
        description="Trace any lot forward to the products it became, and backward to the materials it came from."
      />

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect
            value={itemId}
            onChange={(value) => {
              setItemId(value);
              setLotId("");
            }}
            options={items.map((item) => ({
              label: itemLabelFor.get(item.id) ?? "",
              value: item.id,
            }))}
            placeholder="Select an item…"
          />
          <FilterSelect
            value={lotId}
            onChange={setLotId}
            options={lots.map((lot) => ({
              label: lot.lotNumber,
              value: lot.id,
            }))}
            placeholder={itemId ? "Select a lot…" : "Select an item first"}
            disabled={!itemId}
          />
        </div>
      </Card>

      {!lotId ? (
        <EmptyState
          icon={<HiOutlineSquares2X2 />}
          title="No lot selected"
          description="Pick an item and a lot to trace its full history."
        />
      ) : loading ? (
        <Card className="p-8 text-center text-sm text-gray-500">Loading trace…</Card>
      ) : !detail ? (
        <EmptyState
          icon={<HiOutlineSquares2X2 />}
          title="Lot not found"
          description="No trace data is available for the selected lot."
        />
      ) : (
        <div className="space-y-6">
          <SectionCard title="Lot">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label="Lot number">
                <span className="font-mono text-xs font-medium">{detail.lot.lotNumber}</span>
              </Field>
              <Field label="Item">
                {detail.lot.itemCode} — {detail.lot.itemName}
              </Field>
              <Field label="Quality status">
                <StatusBadge status={detail.lot.qualityStatus} />
              </Field>
              <Field label="Expiry">
                {detail.lot.expiryDate ? new Date(detail.lot.expiryDate).toLocaleDateString() : "—"}
              </Field>
              <Field label="Supplier">{detail.lot.supplier ?? "—"}</Field>
              <Field label="Receipt date">
                {detail.lot.receiptDate ? new Date(detail.lot.receiptDate).toLocaleDateString() : "—"}
              </Field>
              <Field label="Manufacture date">
                {detail.lot.manufactureDate
                  ? new Date(detail.lot.manufactureDate).toLocaleDateString()
                  : "—"}
              </Field>
              <Field label="Created">
                {new Date(detail.lot.createdAt).toLocaleDateString()}
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Inspections">
            {detail.inspections.length === 0 ? (
              <p className="text-sm text-gray-500">No inspections recorded for this lot.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {detail.inspections.map((insp) => (
                  <li key={insp.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                    <span className="font-mono text-xs font-medium">{insp.inspectionNumber}</span>
                    <span className="text-xs text-gray-600">{insp.type.replace(/_/g, " ")}</span>
                    <StatusBadge status={insp.status} />
                    <span className="ml-auto text-xs text-gray-500">
                      {insp.completedAt
                        ? `Completed ${new Date(insp.completedAt).toLocaleDateString()}`
                        : "Not completed"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {detail.releaseDecisions.length > 0 && (
            <SectionCard title="Release decisions">
              <ul className="divide-y divide-gray-100">
                {detail.releaseDecisions.map((decision) => (
                  <li key={decision.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                    <StatusBadge status={decision.decision} />
                    <span className="text-xs text-gray-600">{decision.notes ?? "No notes"}</span>
                    <span className="ml-auto text-xs text-gray-500">
                      {new Date(decision.createdAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          <SectionCard title="Forward trace — where this lot was consumed">
            {!forward || forward.batches.length === 0 ? (
              <p className="text-sm text-gray-500">
                This lot was not consumed by any production batch.
              </p>
            ) : (
              <div className="space-y-4">
                {forward.batches.map((batch) => (
                  <div key={batch.productionBatchId} className="rounded-lg border border-gray-100 p-3">
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="font-mono text-xs font-medium">{batch.batchNumber}</span>
                      <span className="text-xs text-gray-600">Order {batch.orderNumber}</span>
                      <span className="ml-auto text-xs text-gray-500">
                        Consumed {batch.consumedQuantity} at{" "}
                        {new Date(batch.consumedAt).toLocaleString()}
                      </span>
                    </div>
                    {batch.outputs.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-medium text-gray-500">Outputs</p>
                        {batch.outputs.map((output) => (
                          <div
                            key={output.lotId}
                            className="flex flex-wrap items-center gap-3 text-xs text-gray-700"
                          >
                            <span className="font-mono">{output.lotNumber}</span>
                            <span>
                              {output.itemCode} — {output.itemName}
                            </span>
                            <span>× {output.quantity}</span>
                            <StatusBadge status={output.qualityStatus} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Reverse trace — how this lot was produced">
            {!reverse || !reverse.producedBy ? (
              <p className="text-sm text-gray-500">
                This lot was not produced by a production batch (e.g. received stock).
              </p>
            ) : (
              <div className="rounded-lg border border-gray-100 p-3">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-mono text-xs font-medium">
                    {reverse.producedBy.batchNumber}
                  </span>
                  <span className="text-xs text-gray-600">
                    Order {reverse.producedBy.orderNumber}
                  </span>
                  <span className="ml-auto text-xs text-gray-500">
                    Output {reverse.producedBy.outputQuantity}
                    {reverse.producedBy.completedAt
                      ? ` · ${new Date(reverse.producedBy.completedAt).toLocaleDateString()}`
                      : ""}
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-medium text-gray-500">Materials consumed</p>
                  {reverse.producedBy.materials.map((material) => (
                    <div
                      key={material.lotId}
                      className="flex flex-wrap items-center gap-3 text-xs text-gray-700"
                    >
                      <span className="font-mono">{material.lotNumber}</span>
                      <span>
                        {material.itemCode} — {material.itemName}
                      </span>
                      <span>× {material.quantity}</span>
                      {material.isScrap && (
                        <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
                          SCRAP
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      )}
    </div>
  );
}
