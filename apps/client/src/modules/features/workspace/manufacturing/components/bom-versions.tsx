"use client";

import { useState } from "react";
import { HiOutlineClock, HiOutlinePlus } from "react-icons/hi2";
import { toast } from "sonner";
import { bomVersionCreateSchema } from "@rona/validation/manufacturing";
import { usePermissions } from "@/modules/workspace/hooks";
import { useItemOptions } from "../../inventory/hooks";
import { StatusBadge } from "@/modules/workspace/components/ui";
import {
  FormModal,
  LabeledTextarea,
  ModalActions,
} from "@/modules/workspace/components/form";
import {
  useApproveBomVersion,
  useBomVersions,
  useCreateBomVersion,
  useRetireBomVersion,
} from "../hooks";
import type { BomDto, BomVersionDto } from "@rona/types/manufacturing";
import { BomLinesEditor, EMPTY_BOM_LINE, type LineDraft } from "./bom-lines-editor";

export function BomVersionsModal({
  bom,
  onClose,
}: {
  bom: BomDto | null;
  onClose: () => void;
}) {
  const { hasPermission } = usePermissions();
  const canApprove = hasPermission("manufacturing.bom.approve");
  const canCreate = hasPermission("manufacturing.bom.create");

  const [createOpen, setCreateOpen] = useState(false);

  const { versions, isLoading } = useBomVersions(bom?.id);
  const itemOptions = useItemOptions();

  const approveMutation = useApproveBomVersion(bom?.id ?? "");
  const retireMutation = useRetireBomVersion(bom?.id ?? "");

  return (
    <FormModal
      open={bom !== null}
      onClose={onClose}
      title={bom ? `Versions — ${bom.code}` : "Versions"}
      icon={<HiOutlineClock className="w-4 h-4" />}
      maxWidth="max-w-2xl"
    >
      {isLoading ? (
        <p className="text-xs text-zinc-500 py-6 text-center">Loading versions...</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {versions.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center">
              No versions yet. Create the first draft.
            </p>
          ) : (
            versions.map((version) => (
              <VersionRow
                key={version.id}
                version={version}
                canApprove={canApprove}
                isPending={
                  approveMutation.isPending || retireMutation.isPending
                }
                onApprove={() =>
                  approveMutation.mutate(
                    { slugReplacement: { versionId: version.id } },
                    {
                      onSuccess: () => toast.success(`Version ${version.version} approved`),
                    },
                  )
                }
                onRetire={() =>
                  retireMutation.mutate(
                    { slugReplacement: { versionId: version.id } },
                    {
                      onSuccess: () => toast.success(`Version ${version.version} retired`),
                    },
                  )
                }
              />
            ))
          )}
        </div>
      )}

      {canCreate ? (
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-semibold transition"
        >
          <HiOutlinePlus className="w-4 h-4" />
          Create next draft version
        </button>
      ) : null}

      <CreateVersionForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        bomId={bom?.id ?? ""}
        itemOptions={itemOptions.items.map((item) => ({
          id: item.id,
          label: `${item.code} — ${item.name}`,
        }))}
      />
    </FormModal>
  );
}

function VersionRow({
  version,
  canApprove,
  isPending,
  onApprove,
  onRetire,
}: {
  version: BomVersionDto;
  canApprove: boolean;
  isPending: boolean;
  onApprove: () => void;
  onRetire: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-zinc-200 bg-white">
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-800 font-mono">
            v{version.version}
          </span>
          <StatusBadge status={version.status} />
          {version.isUsedInProduction ? (
            <span className="text-[10px] font-medium text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded-md">
              in production
            </span>
          ) : null}
        </div>
        <div className="text-[10px] text-zinc-500 mt-0.5">
          {version.approvedAt
            ? `Approved ${new Date(version.approvedAt).toLocaleDateString()}`
            : `Created ${new Date(version.createdAt).toLocaleDateString()}`}
          {version.retiredAt
            ? ` · Retired ${new Date(version.retiredAt).toLocaleDateString()}`
            : ""}
        </div>
      </div>
      {canApprove && version.status === "DRAFT" ? (
        <button
          type="button"
          disabled={isPending}
          onClick={onApprove}
          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[11px] font-semibold transition"
        >
          Approve
        </button>
      ) : null}
      {canApprove && version.status === "APPROVED" && !version.isUsedInProduction ? (
        <button
          type="button"
          disabled={isPending}
          onClick={onRetire}
          className="px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 disabled:opacity-50 text-zinc-600 text-[11px] font-semibold transition"
        >
          Retire
        </button>
      ) : null}
    </div>
  );
}

function CreateVersionForm({
  open,
  onClose,
  bomId,
  itemOptions,
}: {
  open: boolean;
  onClose: () => void;
  bomId: string;
  itemOptions: { id: string; label: string }[];
}) {
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([{ ...EMPTY_BOM_LINE }]);

  const { mutate, isPending } = useCreateBomVersion(bomId);

  const reset = () => {
    setNotes("");
    setLines([{ ...EMPTY_BOM_LINE }]);
  };

  const submit = () => {
    const parsed = bomVersionCreateSchema.safeParse({
      lines: lines.map((line) => ({
        componentItemId: line.componentItemId,
        quantityPerUnit: line.quantityPerUnit,
        notes: line.notes || undefined,
      })),
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid version data");
      return;
    }

    mutate(
      { body: parsed.data, slugReplacement: { id: bomId } },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      },
    );
  };

  if (!open) return null;

  return (
    <div className="mt-3 pt-3 border-t border-zinc-100 space-y-3">
      <LabeledTextarea
        label="Change notes (optional)"
        id="bom-version-notes"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="What changed in this version..."
      />
      <BomLinesEditor lines={lines} onChange={setLines} itemOptions={itemOptions} />
      <ModalActions
        onCancel={onClose}
        onSubmit={submit}
        submitLabel="Create draft"
        isPending={isPending}
      />
    </div>
  );
}
