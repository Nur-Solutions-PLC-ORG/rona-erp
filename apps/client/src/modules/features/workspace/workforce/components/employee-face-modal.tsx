"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { format } from "date-fns";
import { HiOutlineFaceSmile } from "react-icons/hi2";
import Spinner from "@/components/custom/spinner";
import { BTN_PRIMARY, Card, EmptyState, PageHeader } from "@/modules/workspace/components/ui";
import { useCurrentOrganization, usePermissions } from "@/modules/workspace/hooks";
import { useSession } from "@/modules/auth/hooks";
import { captureFace, friendlyFaceError } from "@/modules/kiosk/face-api";
import { ApiGetSelfFaces, ApiPostSelfFaceEnroll, ApiPostSelfFaceRevoke } from "@/modules/staff/api";

function apiError(error: unknown): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    return typeof message === "string" ? message : "Request failed. Please try again.";
  }
  return error instanceof Error ? error.message : "Request failed. Please try again.";
}

function SelfFaceSettings({ organizationId, userId }: { organizationId: string; userId: string }) {
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const operation = useRef<AbortController | null>(null);
  const facesQuery = useQuery({
    queryKey: ["staff-self-faces", organizationId, userId],
    queryFn: async () => {
      const response = await ApiGetSelfFaces();
      if (!response.success || !response.data) throw new Error(response.message);
      return response.data;
    },
    retry: false,
    gcTime: 0,
  });

  useEffect(() => () => operation.current?.abort(), []);

  const activeFace = facesQuery.data?.faces.find((face) => face.revokedAt === null);
  const unavailable = facesQuery.isPending || facesQuery.isError || facesQuery.isFetching;

  const handleEnroll = async () => {
    if (!consent || operation.current || unavailable) return;
    const controller = new AbortController();
    operation.current = controller;
    setBusy(true);
    setMessage("");
    let capturing = true;
    try {
      const descriptor = await captureFace(controller.signal);
      controller.signal.throwIfAborted();
      capturing = false;
      const response = await ApiPostSelfFaceEnroll({ body: { descriptor } });
      if (controller.signal.aborted) return;
      if (!response.success || !response.data) throw new Error(response.message);
      setConsent(false);
      setMessage("Your face enrollment was saved. Use your EID and a fresh scan at the kiosk.");
      await facesQuery.refetch();
    } catch (error) {
      if (!controller.signal.aborted) setMessage(capturing ? friendlyFaceError(error) : apiError(error));
    } finally {
      if (operation.current === controller) operation.current = null;
      if (!controller.signal.aborted) setBusy(false);
    }
  };

  const handleRevoke = async () => {
    if (operation.current || unavailable || !activeFace) return;
    if (!window.confirm("Revoke your active face enrollment? You can still use your kiosk passcode.")) return;
    const controller = new AbortController();
    operation.current = controller;
    setBusy(true);
    setMessage("");
    try {
      const response = await ApiPostSelfFaceRevoke();
      if (controller.signal.aborted) return;
      if (!response.success || !response.data) throw new Error(response.message);
      setMessage(response.data.face ? "Your face enrollment was revoked." : "You have no active face enrollment.");
      setConsent(false);
      await facesQuery.refetch();
    } catch (error) {
      if (!controller.signal.aborted) setMessage(apiError(error));
    } finally {
      if (operation.current === controller) operation.current = null;
      if (!controller.signal.aborted) setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader icon={<HiOutlineFaceSmile className="h-5 w-5" />} title="Staff settings" description="Manage your own face enrollment for kiosk attendance" />
      <Card className="space-y-4 p-6">
        <h2 className="text-lg font-semibold">My face enrollment</h2>
        <p className="text-sm text-zinc-600">
          Enrollment applies only to your linked employee in the current organization.
          Replacing your face revokes the previous enrollment. HR cannot enroll a face on your behalf here.
        </p>
        {facesQuery.isPending ? <Spinner className="h-6 w-6" /> : facesQuery.isError ? (
          <div role="alert" className="space-y-2 text-sm text-rose-600">
            <p>{apiError(facesQuery.error)}</p>
            <button type="button" className={BTN_PRIMARY} onClick={() => void facesQuery.refetch()} disabled={busy || facesQuery.isFetching}>Retry</button>
          </div>
        ) : (
          <div className="space-y-2">
            {!activeFace ? <p className="text-sm text-zinc-600">No active face enrollment.</p> : null}
            {facesQuery.data?.faces.map((face) => (
              <div key={face.id} className="rounded-lg border border-zinc-200 p-3 text-sm">
                <p className="font-medium">{face.revokedAt ? "Revoked face" : "Active face"}</p>
                <p className="text-zinc-500">Enrolled {format(new Date(face.enrolledAt), "MMM d, yyyy h:mm a")}</p>
                {face.lastUsedAt ? <p className="text-zinc-500">Last used {format(new Date(face.lastUsedAt), "MMM d, yyyy h:mm a")}</p> : null}
              </div>
            ))}
          </div>
        )}
        <p className="text-sm text-zinc-600">
          Face descriptors are sensitive biometric data. Camera frames stay in your browser;
          a numeric descriptor is sent to the server for storage and attendance matching.
          Kiosks send your EID and a fresh descriptor, not photos, and do not download enrolled faces.
          Revocation disables matching; it does not promise deletion of retained records.
          Ask your organization about retention, access and deletion before consenting.
          Face capture provides no liveness guarantee or proof of identity. A passcode remains available as an alternative.
        </p>
        <label className="flex items-start gap-2 text-sm text-zinc-700">
          <input type="checkbox" checked={consent} disabled={busy || unavailable} onChange={(event) => setConsent(event.target.checked)} className="mt-1 accent-zinc-900" />
          I consent to capturing and storing my face descriptor for attendance matching.
        </label>
        <div className="flex flex-wrap gap-3">
          <button type="button" className={BTN_PRIMARY} onClick={handleEnroll} disabled={busy || unavailable || !consent}>
            {busy ? "Working…" : activeFace ? "Replace my face" : "Enroll my face"}
          </button>
          <button type="button" className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 disabled:opacity-50" onClick={handleRevoke} disabled={busy || unavailable || !activeFace}>Revoke my face</button>
        </div>
        {message ? <p role="status" className="text-sm text-zinc-700">{message}</p> : null}
      </Card>
    </div>
  );
}

export default function StaffFaceSettings() {
  const { hasPermission } = usePermissions();
  const { organizationId, isLoading } = useCurrentOrganization();
  const { user, isLoading: sessionLoading } = useSession();
  if (isLoading || sessionLoading) return <Spinner className="h-6 w-6" />;
  if (!organizationId || !user || !hasPermission("hr.attendance.clock")) {
    return <EmptyState icon={<HiOutlineFaceSmile className="h-6 w-6" />} title="Staff settings unavailable" description="You need attendance clock permission and a linked employee in this organization." />;
  }
  return <SelfFaceSettings key={`${organizationId}:${user.id}`} organizationId={organizationId} userId={user.id} />;
}
