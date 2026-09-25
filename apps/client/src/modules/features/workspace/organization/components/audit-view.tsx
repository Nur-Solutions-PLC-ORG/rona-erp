"use client";

import { useMemo, useState } from "react";
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";
import type { AuditLogDto } from "@rona/types/tenancy";
import { usePermissions } from "@/modules/workspace/hooks";
import {
  Card,
  Column,
  DataTable,
  EmptyState,
  humanize,
  INPUT_CLASS,
  PageHeader,
  Pagination,
} from "@/modules/workspace/components/ui";
import { useAuditLogs, useMemberships } from "../hooks";

interface FilterForm {
  action: string;
  entityType: string;
  entityId: string;
  actorId: string;
}

function shortId(id: string | null): string {
  if (!id) return "—";
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}

function shortValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") {
    return value.length > 32 ? `${value.slice(0, 32)}…` : value;
  }
  const text = JSON.stringify(value);
  return text.length > 32 ? `${text.slice(0, 32)}…` : text;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function humanizeAction(action: string): string {
  return humanize(action.split(".").pop() ?? action);
}

const ISO_TIME_KEY = /At$/i;

function describeChanges(before: unknown, after: unknown): string[] {
  const b = isObject(before) ? before : null;
  const a = isObject(after) ? after : null;

  if (!b && !a) {
    const from = shortValue(before);
    const to = shortValue(after);
    return from === to && to === "—" ? [] : [`${from} → ${to}`];
  }

  const keys = Array.from(
    new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]),
  );
  const changed: string[] = [];

  for (const key of keys) {
    const beforeValue = b?.[key];
    const afterValue = a?.[key];
    if (JSON.stringify(beforeValue) === JSON.stringify(afterValue)) continue;

    if (ISO_TIME_KEY.test(key)) {
      const isIso = (value: unknown) =>
        typeof value === "string" && !Number.isNaN(Date.parse(value));
      if (isIso(beforeValue) && isIso(afterValue)) continue;
    }

    if (beforeValue === undefined) {
      changed.push(`${key}: ${shortValue(afterValue)}`);
    } else if (afterValue === undefined) {
      changed.push(`${key}: removed (was ${shortValue(beforeValue)})`);
    } else {
      changed.push(
        `${key}: ${shortValue(beforeValue)} → ${shortValue(afterValue)}`,
      );
    }
  }

  return changed;
}

function ActorCell({ actorId, name }: { actorId: string | null; name?: string }) {
  if (!actorId) {
    return (
      <span className="inline-flex items-center rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
        System
      </span>
    );
  }
  if (name) {
    return (
      <div className="min-w-0">
        <p className="text-xs font-medium text-zinc-800 truncate">{name}</p>
        <p className="font-mono text-[10px] text-zinc-400 truncate">
          {shortId(actorId)}
        </p>
      </div>
    );
  }
  return (
    <span className="font-mono text-zinc-600 text-[11px]">
      User {shortId(actorId)}
    </span>
  );
}

export default function AuditView() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("audit.read");

  const [page, setPage] = useState(1);
  const [form, setForm] = useState<FilterForm>({
    action: "",
    entityType: "",
    entityId: "",
    actorId: "",
  });
  const [applied, setApplied] = useState<FilterForm>({
    action: "",
    entityType: "",
    entityId: "",
    actorId: "",
  });

  const { logs, meta, isLoading } = useAuditLogs(page, {
    action: applied.action || undefined,
    entityType: applied.entityType || undefined,
    entityId: applied.entityId || undefined,
    actorId: applied.actorId || undefined,
  });

  const { memberships } = useMemberships();
  const actorNames = useMemo(
    () =>
      new Map(
        memberships.map((membership) => [
          membership.userId,
          membership.user.fullName,
        ]),
      ),
    [memberships],
  );

  if (!canRead) {
    return (
      <EmptyState
        icon={<HiOutlineClipboardDocumentList className="w-6 h-6" />}
        title="Audit log unavailable"
        description="You do not have permission to view the audit log. Contact an administrator."
      />
    );
  }

  const updateForm = (key: keyof FilterForm, value: string) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const applyFilters = () => {
    setPage(1);
    setApplied({ ...form });
  };

  const columns: Column<AuditLogDto>[] = [
    {
      key: "createdAt",
      header: "Timestamp",
      render: (row) => (
        <span className="font-mono text-zinc-600 text-[11px] whitespace-nowrap">
          {new Date(row.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: "activity",
      header: "Activity",
      render: (row) => (
        <div className="min-w-0">
          <p className="text-xs font-semibold text-zinc-800">
            {humanizeAction(row.action)}{" "}
            <span className="font-normal text-zinc-500">
              {humanize(row.entityType).toLowerCase()}
            </span>
          </p>
          {row.entityId ? (
            <p className="font-mono text-[10px] text-zinc-400 truncate">
              Ref {shortId(row.entityId)}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "actor",
      header: "Actor",
      render: (row) => (
        <ActorCell
          actorId={row.actorId}
          name={row.actorId ? actorNames.get(row.actorId) : undefined}
        />
      ),
    },
    {
      key: "changes",
      header: "Changes",
      render: (row) => {
        const changes = describeChanges(row.before, row.after);
        if (changes.length === 0) {
          return <span className="text-xs text-zinc-400">No field changes</span>;
        }
        const preview = changes.slice(0, 4);
        const more = changes.length - preview.length;
        return (
          <div className="min-w-0">
            {preview.map((line, index) => (
              <p
                key={`${index}-${line}`}
                className="truncate text-[11px] text-zinc-600"
              >
                {line}
              </p>
            ))}
            {more > 0 ? (
              <p className="text-[10px] font-medium text-zinc-400">
                +{more} more
              </p>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "ip",
      header: "IP",
      render: (row) => (
        <span className="font-mono text-zinc-500 text-[11px]">
          {row.ip ?? "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<HiOutlineClipboardDocumentList className="w-5 h-5" />}
        title="Audit Log"
        description="Append-only record of organization, membership, and role changes"
      />

      <Card className="p-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[140px]">
            <label className="block mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Action
            </label>
            <input
              className={INPUT_CLASS}
              value={form.action}
              onChange={(event) => updateForm("action", event.target.value)}
              placeholder="e.g. updated, created"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Entity Type
            </label>
            <input
              className={INPUT_CLASS}
              value={form.entityType}
              onChange={(event) => updateForm("entityType", event.target.value)}
              placeholder="e.g. Membership"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Entity ID
            </label>
            <input
              className={INPUT_CLASS}
              value={form.entityId}
              onChange={(event) => updateForm("entityId", event.target.value)}
              placeholder="UUID"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Actor ID
            </label>
            <input
              className={INPUT_CLASS}
              value={form.actorId}
              onChange={(event) => updateForm("actorId", event.target.value)}
              placeholder="User ID"
            />
          </div>
          <button
            type="button"
            className="h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition"
            onClick={applyFilters}
          >
            Apply Filters
          </button>
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={logs}
        isLoading={isLoading}
        emptyMessage="No audit entries match these filters."
        footer={
          meta && meta.totalPages > 1 ? (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              onPageChange={setPage}
            />
          ) : null
        }
      />

      <Card className="p-3">
        <p className="text-xs text-zinc-500">
          Audit records are append-only. They cannot be edited or deleted from the
          application; changed fields are shown in condensed form.
        </p>
      </Card>
    </div>
  );
}
