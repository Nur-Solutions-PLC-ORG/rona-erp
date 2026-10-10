"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  HiOutlineArrowDownTray,
  HiOutlineDevicePhoneMobile,
  HiOutlineFingerPrint,
  HiOutlineLinkSlash,
  HiOutlinePencilSquare,
  HiOutlinePlus,
} from "react-icons/hi2";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  Card,
  Column,
  DataTable,
  DotBadge,
  EmptyState,
  PageHeader,
  RowActionsMenu,
  StatusBadge,
} from "@/modules/workspace/components/ui";
import {
  FormModal,
  LabeledInput,
  LabeledSelect,
  ModalActions,
} from "@/modules/workspace/components/form";
import { usePermissions } from "@/modules/workspace/hooks";
import type {
  Kiosk,
  KioskAttestationStatus,
  KioskEnrollCodeResult,
  KioskVerificationPolicy,
} from "@rona/types/kiosk";
import { DEFAULT_API_URL } from "@rona/config/server";
import {
  KIOSK_ADMIN_PIN_LENGTH,
  KIOSK_VERIFICATION_POLICY_LIST,
} from "@rona/config/kiosk";
import { CLIENT_KIOSK_TERMINAL_PAGE } from "@rona/routes/workspace";
import {
  useActivateKiosk,
  useCreateKioskEnrollCode,
  useDeactivateKiosk,
  useKiosks,
  useRegisterKiosk,
  useUnpairKiosk,
  useUpdateKiosk,
} from "../kiosk-hooks";

export const KIOSK_POLICY_LABELS: Record<KioskVerificationPolicy, string> = {
  FACE_ONLY: "Face only",
  FACE_OR_FINGER: "Face or fingerprint",
  FACE_AND_FINGER: "Face and fingerprint",
  CARD_AND_FACE: "Card and face",
  CARD_AND_FINGER: "Card and fingerprint",
};

const ATTESTATION_BADGES: Record<
  KioskAttestationStatus,
  { label: string; tone: "emerald" | "amber" | "zinc" }
> = {
  CHAIN_VALID: { label: "Attested", tone: "emerald" },
  UNVERIFIED: { label: "Unverified", tone: "amber" },
  NONE: { label: "No attestation", tone: "zinc" },
};

// Origin of the API the Rona Kiosk app talks to (route constants already
// include the /api prefix).
function kioskPairingApiUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
  return base.replace(/\/+$/, "").replace(/\/api$/, "");
}

function formatLastSeen(date: Date | string | null): string {
  if (!date) return "Never";
  const value = typeof date === "string" ? new Date(date) : date;
  return value.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DeviceTokenReveal({ token, onDone }: { token: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      toast.success("Device credential copied.");
    } catch {
      toast.error("Copy failed - select the text manually.");
    }
  };

  const download = () => {
    const blob = new Blob([token], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "rona-kiosk-device-token.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
        Store this credential now - it is shown only once and cannot be
        retrieved later. Scan the QR code on a Rona Kiosk terminal, or enter
        the credential once on a tablet under {CLIENT_KIOSK_TERMINAL_PAGE}.
      </p>
      <div className="flex flex-col items-center gap-2 rounded-md border border-slate-200 bg-white p-4">
        <QRCodeSVG
          value={JSON.stringify({ v: 1, api: kioskPairingApiUrl(), token })}
          size={196}
          marginSize={2}
        />
        <p className="text-xs text-slate-500">Scan with the Rona Kiosk app</p>
      </div>
      <code className="block w-full break-all rounded-md bg-zinc-900 text-emerald-400 px-3 py-3 text-xs font-mono">
        {token}
      </code>
      <div className="flex items-center gap-2">
        <button type="button" onClick={copy} className={BTN_SECONDARY}>
          {copied ? "Copied" : "Copy"}
        </button>
        <button type="button" onClick={download} className={BTN_SECONDARY}>
          <HiOutlineArrowDownTray className="h-4 w-4" />
          Download
        </button>
        <button type="button" className={BTN_PRIMARY} onClick={onDone}>
          Done
        </button>
      </div>
    </div>
  );
}

function useSecondsLeft(expiresAt: string | null): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  if (!expiresAt) return 0;
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 1000));
}

function EnrollCodeReveal({
  result,
  onRenew,
  isRenewing,
  onDone,
}: {
  result: KioskEnrollCodeResult;
  onRenew: () => void;
  isRenewing: boolean;
  onDone: () => void;
}) {
  const secondsLeft = useSecondsLeft(result.expiresAt);
  const expired = secondsLeft === 0;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="space-y-4 text-center">
      <p className="text-sm text-slate-600">
        On the terminal open Supervisor mode and enter this code.
      </p>
      <p
        className={`font-mono text-5xl font-semibold tracking-[0.3em] ${
          expired ? "text-slate-300 line-through" : "text-slate-900"
        }`}
      >
        {result.code}
      </p>
      <p className={`text-xs ${expired ? "text-rose-600" : "text-slate-500"}`}>
        {expired ? "This code has expired." : `Expires in ${minutes}:${seconds}`}
      </p>
      <p className="text-xs text-slate-400">
        The code works once, on any active terminal of this organization, and
        enrolls credentials on your behalf.
      </p>
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          className={BTN_SECONDARY}
          onClick={onRenew}
          disabled={isRenewing}
        >
          {isRenewing ? "Working..." : "New code"}
        </button>
        <button type="button" className={BTN_PRIMARY} onClick={onDone}>
          Done
        </button>
      </div>
    </div>
  );
}

function TerminalCell({ kiosk }: { kiosk: Kiosk }) {
  if (!kiosk.pairedAt) {
    return <span className="text-xs text-slate-400">Not paired</span>;
  }
  const attestation = ATTESTATION_BADGES[kiosk.attestationStatus];
  const info = kiosk.deviceInfo;
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-700">
        {info ? `${info.manufacturer} ${info.model}` : "Paired terminal"}
      </p>
      <div className="flex flex-wrap items-center gap-1">
        <DotBadge tone={attestation.tone} label={attestation.label} />
        {info?.engine === "SIM" ? (
          <DotBadge tone="amber" label="Simulated" />
        ) : null}
      </div>
      <p className="text-[11px] text-slate-400">
        {kiosk.appVersion ? `App ${kiosk.appVersion}` : null}
        {info ? ` · Android ${info.androidVersion}` : null}
      </p>
    </div>
  );
}

export default function KiosksView() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("kiosk.read");
  const canCreate = hasPermission("kiosk.create");
  const canActivate = hasPermission("kiosk.activate");
  const canDeactivate = hasPermission("kiosk.deactivate");
  const canEnroll = hasPermission("hr.credential.enroll");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Kiosk | null>(null);
  const [name, setName] = useState("");
  const [deviceToken, setDeviceToken] = useState("");
  const [revealToken, setRevealToken] = useState<string | null>(null);
  const [revealHeading, setRevealHeading] = useState("Kiosk registered");
  const [policy, setPolicy] = useState<KioskVerificationPolicy>(
    "FACE_OR_FINGER",
  );
  const [adminPin, setAdminPin] = useState("");
  const [enrollCode, setEnrollCode] = useState<KioskEnrollCodeResult | null>(
    null,
  );

  const { kiosks, isLoading } = useKiosks();
  const registerKiosk = useRegisterKiosk();
  const updateKiosk = useUpdateKiosk();
  const activateKiosk = useActivateKiosk();
  const deactivateKiosk = useDeactivateKiosk();
  const unpairKiosk = useUnpairKiosk();
  const createEnrollCode = useCreateKioskEnrollCode();

  const requestEnrollCode = async () => {
    const result = await createEnrollCode.mutateAsync();
    if (result.success && result.data) setEnrollCode(result.data);
  };

  const closeEdit = () => {
    setEditing(null);
    setName("");
    setDeviceToken("");
    setAdminPin("");
  };

  const submitClearPin = async () => {
    if (!editing) return;
    await updateKiosk.mutateAsync({ id: editing.id, adminPin: null });
    toast.success("Admin PIN removed.");
    closeEdit();
  };

  const openCreate = () => {
    setRevealToken(null);
    setName("");
    setDeviceToken("");
    setIsCreateOpen(true);
  };

  const submitRegister = async () => {
    if (!name.trim()) {
      toast.error("Kiosk name is required.");
      return;
    }
    const token = deviceToken.trim();
    const result = await registerKiosk.mutateAsync({
      name: name.trim(),
      ...(token ? { deviceToken: token } : {}),
    });
    if (result.data?.deviceToken) {
      setRevealHeading("Kiosk registered");
      setRevealToken(result.data.deviceToken);
      setName("");
      setDeviceToken("");
    }
  };

  const submitUpdate = async () => {
    if (!editing) return;
    const pin = adminPin.trim();
    if (pin && !new RegExp(`^\\d{${KIOSK_ADMIN_PIN_LENGTH}}$`).test(pin)) {
      toast.error(`Admin PIN must be exactly ${KIOSK_ADMIN_PIN_LENGTH} digits.`);
      return;
    }
    const nameChanged = name.trim() && name.trim() !== editing.name;
    const policyChanged = policy !== editing.verificationPolicy;
    if (!nameChanged && !deviceToken.trim() && !policyChanged && !pin) {
      toast.error("Nothing to update.");
      return;
    }
    const result = await updateKiosk.mutateAsync({
      id: editing.id,
      ...(nameChanged ? { name: name.trim() } : {}),
      ...(deviceToken.trim() ? { deviceToken: deviceToken.trim() } : {}),
      ...(policyChanged ? { verificationPolicy: policy } : {}),
      ...(pin ? { adminPin: pin } : {}),
    });
    if (!result.success) return;
    closeEdit();
    if (result.data?.deviceToken) {
      setRevealHeading("Credential rotated");
      setRevealToken(result.data.deviceToken);
    }
  };

  const columns: Column<Kiosk>[] = [
    {
      key: "name",
      header: "Kiosk",
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.name}</p>
          <p className="text-[11px] text-slate-400 font-mono">{row.deviceId}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "terminal",
      header: "Terminal",
      render: (row) => <TerminalCell kiosk={row} />,
    },
    {
      key: "verificationPolicy",
      header: "Policy",
      render: (row) => (
        <span className="text-xs text-slate-600">
          {KIOSK_POLICY_LABELS[row.verificationPolicy] ?? row.verificationPolicy}
        </span>
      ),
    },
    {
      key: "registeredAt",
      header: "Registered",
      render: (row) => (
        <span className="text-xs text-slate-500">
          {formatLastSeen(row.registeredAt)}
        </span>
      ),
    },
    {
      key: "lastSeenAt",
      header: "Last seen",
      render: (row) => (
        <span className="text-xs text-slate-500">
          {formatLastSeen(row.lastSeenAt)}
        </span>
      ),
    },
    {
      key: "lastHeartbeatAt",
      header: "Heartbeat",
      render: (row) => (
        <span className="text-xs text-slate-500">
          {row.pairedAt ? formatLastSeen(row.lastHeartbeatAt) : "\u2014"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (row) => (
        <RowActionsMenu
          items={[
            ...(canCreate
              ? [
                  {
                    label: "Edit",
                    icon: <HiOutlinePencilSquare className="h-4 w-4" />,
                    onClick: () => {
                      setEditing(row);
                      setName(row.name);
                      setDeviceToken("");
                      setPolicy(row.verificationPolicy);
                      setAdminPin("");
                    },
                  },
                ]
              : []),
            ...(row.pairedAt && canCreate
              ? [
                  {
                    label: "Unpair terminal",
                    icon: <HiOutlineLinkSlash className="h-4 w-4" />,
                    destructive: true,
                    onClick: () => {
                      if (
                        window.confirm(
                          `Unpair the terminal from "${row.name}"? It stops working until it is paired again with a device credential.`,
                        )
                      ) {
                        void unpairKiosk.mutateAsync(row.id);
                      }
                    },
                  },
                ]
              : []),
            ...(row.status === "INACTIVE" && canActivate
              ? [
                  {
                    label: "Activate",
                    onClick: () => void activateKiosk.mutateAsync(row.id),
                  },
                ]
              : []),
            ...(row.status === "ACTIVE" && canDeactivate
              ? [
                  {
                    label: "Deactivate",
                    onClick: () => void deactivateKiosk.mutateAsync(row.id),
                  },
                ]
              : []),
          ]}
        />
      ),
    },
  ];

  if (!canRead) {
    return (
      <EmptyState
        icon={<HiOutlineDevicePhoneMobile className="h-10 w-10" />}
        title="No access"
        description="You do not have permission to manage kiosk devices. Ask an administrator for the kiosk.read permission."
      />
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<HiOutlineDevicePhoneMobile className="h-6 w-6" />}
        title="Kiosks"
        description="Tablet time-tracking terminals for employee attendance."
        actions={
          canCreate || canEnroll ? (
            <div className="flex flex-wrap items-center gap-2">
              {canEnroll ? (
                <button
                  type="button"
                  className={BTN_SECONDARY}
                  onClick={() => void requestEnrollCode()}
                  disabled={createEnrollCode.isPending}
                >
                  <HiOutlineFingerPrint className="h-4 w-4" />
                  Enrollment code
                </button>
              ) : null}
              {canCreate ? (
                <button
                  type="button"
                  className={BTN_PRIMARY}
                  onClick={() => {
                    setRevealToken(null);
                    setName("");
                    setDeviceToken("");
                    setIsCreateOpen(true);
                  }}
                >
                  <HiOutlinePlus className="h-4 w-4" />
                  Register kiosk
                </button>
              ) : null}
            </div>
          ) : null
        }
      />

      <Card className="p-4 text-xs text-slate-500">
        Rona Kiosk terminals pair by scanning the QR code issued here and
        verify employees on the device (face, fingerprint, card). Browsers
        without a terminal can still use{" "}
        <code className="font-mono">{CLIENT_KIOSK_TERMINAL_PAGE}</code> with an
        employee ID and passcode. Biometrics and cards are enrolled on a
        terminal in Supervisor mode, unlocked with an enrollment code.
      </Card>

      <DataTable
        columns={columns}
        rows={kiosks}
        isLoading={isLoading}
        emptyMessage="No kiosks registered."
        emptyDescription="Register a kiosk device to enable tablet time tracking."
        emptyAction={
          canCreate ? (
            <button
              type="button"
              className={BTN_PRIMARY}
              onClick={() => {
                setRevealToken(null);
                setName("");
                setDeviceToken("");
                setIsCreateOpen(true);
              }}
            >
              <HiOutlinePlus className="h-4 w-4" />
              Register kiosk
            </button>
          ) : null
        }
      />

      <FormModal
        open={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setRevealToken(null);
        }}
        title={revealToken ? "Kiosk registered" : "Register kiosk"}
      >
        {revealToken ? (
          <DeviceTokenReveal
            token={revealToken}
            onDone={() => {
              setIsCreateOpen(false);
              setRevealToken(null);
            }}
          />
        ) : (
          <>
            <LabeledInput
              id="kiosk-name"
              label="Kiosk name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Factory floor terminal"
            />
            <LabeledInput
              id="kiosk-token"
              label="Device credential (optional)"
              value={deviceToken}
              onChange={(event) => setDeviceToken(event.target.value)}
              placeholder="e.g. ronakiosk123 — leave blank for a secure random one"
              autoComplete="off"
            />
            <ModalActions
              onSubmit={submitRegister}
              submitLabel="Register"
              isPending={registerKiosk.isPending}
              onCancel={() => setIsCreateOpen(false)}
            />
          </>
        )}
      </FormModal>

      <FormModal
        open={editing !== null && revealToken === null}
        onClose={closeEdit}
        title="Edit kiosk"
      >
        <LabeledInput
          id="kiosk-name-edit"
          label="Kiosk name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <LabeledSelect
          id="kiosk-policy-edit"
          label="Verification policy"
          value={policy}
          onChange={(event) =>
            setPolicy(event.target.value as KioskVerificationPolicy)
          }
        >
          {KIOSK_VERIFICATION_POLICY_LIST.map((value) => (
            <option key={value} value={value}>
              {KIOSK_POLICY_LABELS[value]}
            </option>
          ))}
        </LabeledSelect>
        <p className="-mt-2 text-[11px] text-slate-400">
          How a terminal verifies an employee before recording a punch. A card
          is never accepted on its own.
        </p>
        <LabeledInput
          id="kiosk-admin-pin-edit"
          label={
            editing?.hasAdminPin
              ? "New terminal admin PIN (optional)"
              : "Terminal admin PIN (not set)"
          }
          value={adminPin}
          onChange={(event) =>
            setAdminPin(
              event.target.value.replace(/\D/g, "").slice(0, KIOSK_ADMIN_PIN_LENGTH),
            )
          }
          placeholder={`${KIOSK_ADMIN_PIN_LENGTH} digits — unlocks the terminal's admin menu`}
          inputMode="numeric"
          autoComplete="off"
        />
        {editing?.hasAdminPin ? (
          <button
            type="button"
            className="-mt-2 text-xs text-rose-600 hover:underline disabled:opacity-50"
            onClick={() => void submitClearPin()}
            disabled={updateKiosk.isPending}
          >
            Remove admin PIN
          </button>
        ) : null}
        <LabeledInput
          id="kiosk-token-edit"
          label="New device credential (optional)"
          value={deviceToken}
          onChange={(event) => setDeviceToken(event.target.value)}
          placeholder="e.g. ronakiosk123 — blank keeps the current credential"
          autoComplete="off"
        />
        <ModalActions
          onSubmit={submitUpdate}
          submitLabel="Save"
          isPending={updateKiosk.isPending}
          onCancel={closeEdit}
        />
      </FormModal>

      <FormModal
        open={enrollCode !== null}
        onClose={() => setEnrollCode(null)}
        title="Enrollment code"
      >
        {enrollCode ? (
          <EnrollCodeReveal
            result={enrollCode}
            onRenew={() => void requestEnrollCode()}
            isRenewing={createEnrollCode.isPending}
            onDone={() => setEnrollCode(null)}
          />
        ) : null}
      </FormModal>

      <FormModal
        open={revealToken !== null}
        onClose={() => setRevealToken(null)}
        title={revealHeading}
      >
        {revealToken ? (
          <DeviceTokenReveal
            token={revealToken}
            onDone={() => setRevealToken(null)}
          />
        ) : null}
      </FormModal>
    </div>
  );
}
