"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  HiOutlineCheckCircle,
  HiOutlineDevicePhoneMobile,
  HiOutlineFingerPrint,
  HiOutlineTrash,
  HiOutlineXCircle,
} from "react-icons/hi2";
import { startRegistration } from "@simplewebauthn/browser";
import type { WebAuthnCredentialMetadata } from "@rona/types/kiosk";
import {
  ApiGetEmployeeCredentials,
  ApiPostEmployeeCredentialOptions,
  ApiPostEmployeeCredentialRevoke,
  ApiPostEmployeeCredentialVerify,
} from "../api";
import {
  FormModal,
  LabeledInput,
  ModalActions,
} from "@/modules/workspace/components/form";
import Spinner from "@/components/custom/spinner";

interface Props {
  open: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  canManage: boolean;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EmployeeBiometricsModal({
  open,
  onClose,
  employeeId,
  employeeName,
  canManage,
}: Props) {
  const [credentials, setCredentials] = useState<WebAuthnCredentialMetadata[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [registering, setRegistering] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!open || !employeeId) return;
    setLoading(true);
    try {
      const response = await ApiGetEmployeeCredentials({
        slugReplacement: { ":employeeId": employeeId },
      });
      setCredentials(response.data ?? []);
    } catch {
      setCredentials([]);
    } finally {
      setLoading(false);
    }
  }, [open, employeeId]);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  const handleRegister = async () => {
    if (!canManage || registering) return;
    const name = deviceName.trim();
    if (!name) {
      toast.error("Enter a device name, e.g. “Work phone”.");
      return;
    }
    setRegistering(true);
    try {
      const optionsResponse = await ApiPostEmployeeCredentialOptions({
        body: { deviceName: name },
        slugReplacement: { ":employeeId": employeeId },
      });
      const payload = optionsResponse.data;
      if (!payload) throw new Error("No registration options returned");
      const credential = await startRegistration({
        optionsJSON: payload.options,
      });
      await ApiPostEmployeeCredentialVerify({
        body: {
          challengeId: payload.challengeId,
          response: credential,
        },
        slugReplacement: { ":employeeId": employeeId },
      });
      toast.success(`${name} registered successfully.`);
      setDeviceName("");
      await refresh();
    } catch (error) {
      toast.error(
        (error as { message?: string }).message ??
          "Registration was cancelled or failed. Try again.",
      );
    } finally {
      setRegistering(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!canManage || !id) return;
    setRevokingId(id);
    try {
      await ApiPostEmployeeCredentialRevoke({
        slugReplacement: {
          ":employeeId": employeeId,
          ":credentialId": id,
        },
      });
      toast.success("Device unlinked. The credential can no longer be used.");
      await refresh();
    } catch {
      toast.error("Could not revoke this device. Try again.");
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={`Biometrics — ${employeeName}`}
      icon={<HiOutlineFingerPrint className="w-4 h-4" />}
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        {loading ? (
          <div className="flex justify-center py-6">
            <Spinner className="h-6 w-6" />
          </div>
        ) : credentials.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
            No fingerprint / Face ID devices linked yet. Register a device
            (phone, tablet or security key) to let this employee clock in with
            their biometric.
          </div>
        ) : (
          <ul className="space-y-2.5">
            {credentials.map((credential) => (
              <li
                key={credential.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
                    <HiOutlineDevicePhoneMobile className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-medium text-zinc-800">
                      {credential.deviceName}
                      {credential.revokedAt ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-[11px] font-semibold text-rose-600">
                          <HiOutlineXCircle className="h-3 w-3" />
                          Revoked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-600">
                          <HiOutlineCheckCircle className="h-3 w-3" />
                          Active
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      Linked {formatDate(credential.createdAt)} · Last used{" "}
                      {formatDate(credential.lastUsedAt)}
                    </p>
                  </div>
                </div>
                {canManage && !credential.revokedAt ? (
                  <button
                    type="button"
                    onClick={() => handleRevoke(credential.id)}
                    disabled={revokingId === credential.id}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
                  >
                    {revokingId === credential.id ? (
                      <Spinner className="h-3 w-3" />
                    ) : (
                      <HiOutlineTrash className="h-3.5 w-3.5" />
                    )}
                    Revoke
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {canManage ? (
          <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-zinc-800">
                Register a new device
              </h3>
              <p className="text-xs leading-relaxed text-zinc-400">
                The employee will set up fingerprint / Face ID on their own
                device. A QR code or passkey prompt will appear — the employee
                scans it from their phone.
              </p>
            </div>
            <LabeledInput
              label="Device name"
              id="biometric-device-name"
              value={deviceName}
              onChange={(event) => setDeviceName(event.target.value)}
              placeholder="e.g. Work phone"
            />
          </div>
        ) : null}
      </div>

      {canManage ? (
        <ModalActions
          onCancel={onClose}
          onSubmit={handleRegister}
          submitLabel="Register device"
          isPending={registering}
        />
      ) : (
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Close
          </button>
        </div>
      )}
    </FormModal>
  );
}