"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HiOutlineIdentification, HiOutlineKey } from "react-icons/hi2";
import { KIOSK_PASSCODE_LENGTH } from "@rona/config/kiosk";
import type {
  EmployeeBiometricTemplate,
  EmployeeCard,
} from "@rona/types/kiosk";
import { usePermissions } from "@/modules/workspace/hooks";
import { BTN_DANGER, DotBadge } from "@/modules/workspace/components/ui";
import {
  FormModal,
  LabeledInput,
  ModalActions,
} from "@/modules/workspace/components/form";
import {
  useEmployeeCredentials,
  useRevokeEmployeeCard,
  useRevokeEmployeeTemplate,
  useUpdateEmployeePasscode,
} from "../hooks";

interface KioskEmployee {
  id: string;
  fullName: string;
  eid: string;
}

// ISO/ZKTeco finger numbering: 0-4 right hand thumb→little, 5-9 left hand.
const FINGER_NAMES = [
  "Right thumb",
  "Right index",
  "Right middle",
  "Right ring",
  "Right little",
  "Left thumb",
  "Left index",
  "Left middle",
  "Left ring",
  "Left little",
];

function formatDate(value: Date | string | null): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RevokedOrActive({ revokedAt }: { revokedAt: Date | string | null }) {
  return revokedAt ? (
    <DotBadge tone="zinc" label="Revoked" />
  ) : (
    <DotBadge tone="emerald" label="Active" />
  );
}

function templateLabel(template: EmployeeBiometricTemplate): string {
  if (template.kind === "FACE") return "Face";
  const finger =
    template.fingerIndex != null ? FINGER_NAMES[template.fingerIndex] : null;
  return finger ? `Fingerprint · ${finger}` : "Fingerprint";
}

export default function EmployeeKioskCredentialsModal({
  employee,
  onClose,
}: {
  employee: KioskEmployee;
  onClose: () => void;
}) {
  const { hasPermission } = usePermissions();
  const canRevoke = hasPermission("hr.credential.revoke");
  const { templates, cards, isLoading } = useEmployeeCredentials(employee.id);
  const revokeTemplate = useRevokeEmployeeTemplate(employee.id);
  const revokeCard = useRevokeEmployeeCard(employee.id);

  const confirmRevokeTemplate = (template: EmployeeBiometricTemplate) => {
    if (
      window.confirm(
        `Revoke ${templateLabel(template).toLowerCase()} for ${employee.fullName}? Terminals delete it on their next sync.`,
      )
    ) {
      revokeTemplate.mutate(template.id);
    }
  };

  const confirmRevokeCard = (card: EmployeeCard) => {
    if (
      window.confirm(
        `Revoke card ••••${card.uidSuffix} for ${employee.fullName}? It stops working on all terminals after their next sync.`,
      )
    ) {
      revokeCard.mutate(card.id);
    }
  };

  return (
    <FormModal
      open
      onClose={onClose}
      title="Kiosk credentials"
      icon={<HiOutlineIdentification className="h-5 w-5" />}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-800">
          {employee.fullName}{" "}
          <span className="font-mono text-xs text-slate-400">{employee.eid}</span>
        </p>
        <p className="text-xs text-slate-500">
          Face, fingerprints and cards are enrolled on a Rona Kiosk terminal in
          Supervisor mode (create an enrollment code on the Kiosks page).
          Biometric templates stay encrypted and are only used by terminals.
        </p>
      </div>

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Biometrics
        </h3>
        {isLoading ? (
          <p className="text-xs text-slate-400">Loading…</p>
        ) : templates.length === 0 ? (
          <p className="text-xs text-slate-400">No face or fingerprint enrolled.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
            {templates.map((template) => (
              <li
                key={template.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm text-slate-800">{templateLabel(template)}</p>
                  <p className="text-[11px] text-slate-400">
                    {formatDate(template.createdAt)}
                    {template.enrolledByKioskName
                      ? ` · ${template.enrolledByKioskName}`
                      : ""}
                    {` · ${template.algorithmVersion}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <RevokedOrActive revokedAt={template.revokedAt} />
                  {canRevoke && !template.revokedAt ? (
                    <button
                      type="button"
                      className={BTN_DANGER}
                      onClick={() => confirmRevokeTemplate(template)}
                      disabled={revokeTemplate.isPending}
                    >
                      Revoke
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Cards
        </h3>
        {isLoading ? (
          <p className="text-xs text-slate-400">Loading…</p>
        ) : cards.length === 0 ? (
          <p className="text-xs text-slate-400">No card bound.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
            {cards.map((card) => (
              <li
                key={card.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm text-slate-800">
                    {card.label || "Card"}{" "}
                    <span className="font-mono text-xs text-slate-500">
                      ••••{card.uidSuffix}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {formatDate(card.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <RevokedOrActive revokedAt={card.revokedAt} />
                  {canRevoke && !card.revokedAt ? (
                    <button
                      type="button"
                      className={BTN_DANGER}
                      onClick={() => confirmRevokeCard(card)}
                      disabled={revokeCard.isPending}
                    >
                      Revoke
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </FormModal>
  );
}

export function EmployeePasscodeModal({
  employee,
  onClose,
}: {
  employee: KioskEmployee;
  onClose: () => void;
}) {
  const [passcode, setPasscode] = useState("");
  const updatePasscode = useUpdateEmployeePasscode();

  const submit = async () => {
    if (!new RegExp(`^\\d{${KIOSK_PASSCODE_LENGTH}}$`).test(passcode)) {
      toast.error(`Passcode must be exactly ${KIOSK_PASSCODE_LENGTH} digits.`);
      return;
    }
    const result = await updatePasscode.mutateAsync({
      id: employee.id,
      passcode,
    });
    if (result.success) onClose();
  };

  const remove = async () => {
    if (
      !window.confirm(
        `Remove the kiosk passcode for ${employee.fullName}? They can no longer use EID + passcode on the web kiosk.`,
      )
    ) {
      return;
    }
    const result = await updatePasscode.mutateAsync({
      id: employee.id,
      passcode: null,
    });
    if (result.success) onClose();
  };

  return (
    <FormModal
      open
      onClose={onClose}
      title="Kiosk passcode"
      icon={<HiOutlineKey className="h-5 w-5" />}
    >
      <p className="text-xs text-slate-500">
        Used with the employee ID ({employee.eid}) on the browser kiosk. Share
        it with {employee.fullName} privately; it replaces any previous
        passcode.
      </p>
      <LabeledInput
        id="employee-kiosk-passcode"
        label={`New passcode (${KIOSK_PASSCODE_LENGTH} digits)`}
        value={passcode}
        onChange={(event) =>
          setPasscode(
            event.target.value.replace(/\D/g, "").slice(0, KIOSK_PASSCODE_LENGTH),
          )
        }
        inputMode="numeric"
        autoComplete="off"
      />
      <button
        type="button"
        className="-mt-2 self-start text-xs text-rose-600 hover:underline disabled:opacity-50"
        onClick={() => void remove()}
        disabled={updatePasscode.isPending}
      >
        Remove passcode
      </button>
      <ModalActions
        onCancel={onClose}
        onSubmit={() => void submit()}
        submitLabel="Set passcode"
        isPending={updatePasscode.isPending}
      />
    </FormModal>
  );
}
