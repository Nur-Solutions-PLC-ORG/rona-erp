"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { HiOutlineFaceSmile, HiOutlineTrash } from "react-icons/hi2";
import type { Employee } from "@rona/types/hr";
import type { EmployeeFaceMetadata } from "@rona/types/kiosk";
import Spinner from "@/components/custom/spinner";
import {
  BTN_PRIMARY,
  EmptyState,
} from "@/modules/workspace/components/ui";
import {
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalSection,
  ModalWrapper,
} from "@/modules/workspace/components/form";
import {
  enrollFace,
  isFaceIoConfigured,
  friendlyFaceIoError,
} from "@/modules/kiosk/faceio";
import { useEmployeeFaces, useEnrollFace, useRevokeFace } from "../hooks";

function EnrolledFaceRow({
  face,
  onRevoke,
  isRevoking,
}: {
  face: EmployeeFaceMetadata;
  onRevoke: () => void;
  isRevoking: boolean;
}) {
  const revoked = face.revokedAt !== null;
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <HiOutlineFaceSmile
          className={`h-5 w-5 shrink-0 ${
            revoked ? "text-zinc-300" : "text-emerald-600"
          }`}
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-800 text-left">
            {revoked ? "Revoked face" : "Active face"}
          </p>
          <p className="text-xs text-zinc-500 text-left">
            Enrolled {format(new Date(face.enrolledAt), "MMM d, yyyy h:mm a")}
            {face.lastUsedAt
              ? ` · last used ${format(new Date(face.lastUsedAt), "MMM d, yyyy")}`
              : ""}
          </p>
        </div>
      </div>
      {!revoked ? (
        <button
          type="button"
          onClick={onRevoke}
          disabled={isRevoking}
          className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:pointer-events-none disabled:opacity-50"
        >
          {isRevoking ? "Revoking…" : "Revoke"}
        </button>
      ) : null}
    </div>
  );
}

export default function EmployeeFaceModal({
  employee,
  onClose,
}: {
  employee: Employee | null;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const facesQuery = useEmployeeFaces(employee?.id ?? null);
  const enrollMutation = useEnrollFace();
  const revokeMutation = useRevokeFace();

  const faces = facesQuery.data?.data?.faces ?? [];
  const configured = isFaceIoConfigured();

  const handleEnroll = async () => {
    if (!employee || busy) return;
    if (!configured) {
      toast.info("Face authentication is not configured on this device.");
      return;
    }
    setBusy(true);
    try {
      const facialId = await enrollFace({ employeeId: employee.id });
      await enrollMutation.mutateAsync({ id: employee.id, facialId });
      toast.success("Face enrolled successfully.");
    } catch (error) {
      toast.error(friendlyFaceIoError(error));
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = (faceId: string) => {
    if (!employee) return;
    revokeMutation.mutate(
      { id: employee.id, faceId },
      { onSuccess: () => toast.success("Face revoked successfully.") },
    );
  };

  return (
    <ModalWrapper open={employee !== null} onClose={onClose}>
      <ModalHeader
        title="Face ID enrollment"
        icon={<HiOutlineFaceSmile className="w-5 h-5" />}
        onClose={onClose}
      />
      <ModalBody>
        {employee ? (
          <p className="text-sm text-zinc-500">
            Enroll a face for{" "}
            <span className="font-medium text-zinc-800">
              {employee.eId} — {employee.fullName}
            </span>{" "}
            so they can sign in on kiosk terminals without a passcode. Each
            employee keeps one active face; enrolling a new one revokes the
            previous.
          </p>
        ) : null}

        <ModalSection title="Face ID">
          {facesQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-6 w-6" />
            </div>
          ) : faces.length === 0 ? (
            <EmptyState
              icon={<HiOutlineFaceSmile className="w-5 h-5" />}
              title="Not enrolled"
              description="No face is enrolled for this employee yet."
            />
          ) : (
            <div className="space-y-2">
              {faces.map((face) => (
                <EnrolledFaceRow
                  key={face.id}
                  face={face}
                  isRevoking={revokeMutation.isPending}
                  onRevoke={() => handleRevoke(face.id)}
                />
              ))}
            </div>
          )}
        </ModalSection>
      </ModalBody>
      <ModalFooter>
        <button type="button" className={BTN_PRIMARY} onClick={handleEnroll}>
          {busy ? "Scanning…" : "Enroll Face"}
        </button>
      </ModalFooter>
    </ModalWrapper>
  );
}