"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  HiOutlineArrowDownTray,
  HiOutlineDevicePhoneMobile,
  HiOutlinePencilSquare,
  HiOutlinePlus,
} from "react-icons/hi2";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  Card,
  Column,
  DataTable,
  EmptyState,
  PageHeader,
  RowActionsMenu,
  StatusBadge,
} from "@/modules/workspace/components/ui";
import { FormModal, LabeledInput, ModalActions } from "@/modules/workspace/components/form";
import { usePermissions } from "@/modules/workspace/hooks";
import type { Kiosk } from "@rona/types/kiosk";
import { CLIENT_KIOSK_TERMINAL_PAGE } from "@rona/routes/workspace";
import {
  useActivateKiosk,
  useDeactivateKiosk,
  useKiosks,
  useRegisterKiosk,
  useUpdateKiosk,
} from "../kiosk-hooks";

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
        retrieved later. Enter it once on the tablet under {CLIENT_KIOSK_TERMINAL_PAGE}.
      </p>
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

export default function KiosksView() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("kiosk.read");
  const canCreate = hasPermission("kiosk.create");
  const canActivate = hasPermission("kiosk.activate");
  const canDeactivate = hasPermission("kiosk.deactivate");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Kiosk | null>(null);
  const [name, setName] = useState("");
  const [deviceToken, setDeviceToken] = useState("");
  const [revealToken, setRevealToken] = useState<string | null>(null);
  const [revealHeading, setRevealHeading] = useState("Kiosk registered");

  const { kiosks, isLoading } = useKiosks();
  const registerKiosk = useRegisterKiosk();
  const updateKiosk = useUpdateKiosk();
  const activateKiosk = useActivateKiosk();
  const deactivateKiosk = useDeactivateKiosk();

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
    if (!name.trim() && !deviceToken.trim()) {
      toast.error("Enter a new name or a new credential.");
      return;
    }
    const result = await updateKiosk.mutateAsync({
      id: editing.id,
      ...(name.trim() ? { name: name.trim() } : {}),
      ...(deviceToken.trim() ? { deviceToken: deviceToken.trim() } : {}),
    });
    setEditing(null);
    setName("");
    setDeviceToken("");
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

      <Card className="p-4 text-xs text-slate-500">
        Employees clock in at <code className="font-mono">{CLIENT_KIOSK_TERMINAL_PAGE}</code>{" "}
        using their own fingerprint / Face ID (passkey), after the employee&apos;s
        HR department links a device to them. A device only becomes a kiosk
        after entering the credential issued here.
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
        onClose={() => {
          setEditing(null);
          setName("");
          setDeviceToken("");
        }}
        title="Edit kiosk"
      >
        <LabeledInput
          id="kiosk-name-edit"
          label="Kiosk name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
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
          onCancel={() => {
            setEditing(null);
            setName("");
            setDeviceToken("");
          }}
        />
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
