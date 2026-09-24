"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  HiOutlineBanknotes,
  HiOutlineCheckBadge,
  HiOutlinePencilSquare,
  HiOutlinePlus,
} from "react-icons/hi2";
import {
  BTN_PRIMARY,
  DataTable,
  DotBadge,
  PageHeader,
  RowActionsMenu,
  StatusBadge,
  type Column,
} from "@/modules/workspace/components/ui";
import {
  BarList,
  ChartCard,
  ChartStatStrip,
  toCategoryPoints,
  toMonthlySeries,
} from "@/modules/workspace/components/charts";
import {
  FormModal,
  LabeledInput,
  LabeledSelect,
  ModalActions,
} from "@/modules/workspace/components/form";
import {
  commissionRuleCreateSchema,
  commissionRuleUpdateSchema,
} from "@rona/validation/sales";
import type {
  CommissionRecordDto,
  CommissionRuleDto,
} from "@rona/types/sales";
import { usePermissions } from "@/modules/workspace/hooks";
import { useMemberships } from "@/modules/features/workspace/organization/hooks";
import {
  useApproveCommission,
  useCommissionRecords,
  useCommissionRules,
  useCreateCommissionRule,
  useMarkCommissionPaid,
  useUpdateCommissionRule,
} from "@/modules/features/workspace/sales/hooks";

function formatMoney(value: string) {
  const amount = Number(value);
  if (Number.isNaN(amount)) return value;
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const COMMISSION_CATEGORIES = [
  { label: "All categories", value: "" },
  { label: "Raw material", value: "RAW_MATERIAL" },
  { label: "Packaging", value: "PACKAGING" },
  { label: "Consumable", value: "CONSUMABLE" },
  { label: "Semi-finished", value: "SEMI_FINISHED" },
  { label: "Finished good", value: "FINISHED_GOOD" },
];

const EMPTY_RULE = {
  name: "",
  salespersonUserId: "",
  commissionPercent: "",
  itemCategory: "",
  minimumMarginPercent: "",
  isActive: true,
};

type RuleForm = typeof EMPTY_RULE;

function ruleFormFromRule(rule: CommissionRuleDto): RuleForm {
  return {
    name: rule.name,
    salespersonUserId: rule.salespersonUserId,
    commissionPercent: String(Number(rule.commissionPercent)),
    itemCategory: rule.itemCategory ?? "",
    minimumMarginPercent:
      rule.minimumMarginPercent != null
        ? String(Number(rule.minimumMarginPercent))
        : "",
    isActive: rule.isActive,
  };
}

export default function SalesCommissionsPage() {
  const { hasPermission } = usePermissions();
  const canApprove = hasPermission("sales.commission.approve");

  const { rules, isLoading } = useCommissionRules();
  const { records, isLoading: recordsLoading } = useCommissionRecords();
  const { memberships } = useMemberships();

  const createRule = useCreateCommissionRule();
  const updateRule = useUpdateCommissionRule();
  const approveCommission = useApproveCommission();
  const markPaid = useMarkCommissionPaid();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<CommissionRuleDto | null>(null);
  const [createForm, setCreateForm] = useState<RuleForm>(EMPTY_RULE);
  const [editForm, setEditForm] = useState<RuleForm>(EMPTY_RULE);

  const salespersonOptions = useMemo(
    () =>
      memberships.map((membership) => ({
        value: membership.userId,
        label: membership.user.fullName,
      })),
    [memberships],
  );

  const submitCreate = () => {
    const parsed = commissionRuleCreateSchema.safeParse({
      name: createForm.name,
      salespersonUserId: createForm.salespersonUserId,
      commissionPercent: createForm.commissionPercent,
      itemCategory: createForm.itemCategory || undefined,
      minimumMarginPercent: createForm.minimumMarginPercent || undefined,
      isActive: createForm.isActive,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid rule details");
      return;
    }
    createRule.mutate(parsed.data, {
      onSuccess: () => {
        setCreateForm(EMPTY_RULE);
        setIsCreateOpen(false);
      },
    });
  };

  const submitUpdate = () => {
    if (!editing) return;
    const parsed = commissionRuleUpdateSchema.safeParse({
      name: editForm.name,
      salespersonUserId: editForm.salespersonUserId,
      commissionPercent: editForm.commissionPercent,
      itemCategory: editForm.itemCategory || undefined,
      minimumMarginPercent: editForm.minimumMarginPercent || undefined,
      isActive: editForm.isActive,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid rule details");
      return;
    }
    updateRule.mutate(
      { id: editing.id, ...parsed.data },
      {
        onSuccess: () => setEditing(null),
      },
    );
  };

  const ruleColumns: Column<CommissionRuleDto>[] = [
    {
      key: "name",
      header: "Rule",
      render: (row) => (
        <span className="font-medium text-zinc-900">{row.name}</span>
      ),
    },
    {
      key: "salespersonName",
      header: "Salesperson",
      render: (row) => (
        <span className="text-zinc-700">{row.salespersonName ?? "—"}</span>
      ),
    },
    {
      key: "commissionPercent",
      header: "Percent",
      render: (row) => (
        <span className="font-mono text-xs tabular-nums text-zinc-900">
          {Number(row.commissionPercent).toLocaleString()}%
        </span>
      ),
    },
    {
      key: "itemCategory",
      header: "Category",
      render: (row) => (
        <span className="text-zinc-600">
          {row.itemCategory
            ? row.itemCategory
                .toLowerCase()
                .split("_")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")
            : "All"}
        </span>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (row) => (
        <DotBadge
          tone={row.isActive ? "emerald" : "zinc"}
          label={row.isActive ? "Active" : "Inactive"}
        />
      ),
    },
    ...(canApprove
      ? [
          {
            key: "actions",
            header: "Actions",
            render: (row: CommissionRuleDto) => (
              <RowActionsMenu
                label="Rule actions"
                items={[
                  {
                    label: "Edit",
                    icon: <HiOutlinePencilSquare className="h-3.5 w-3.5" />,
                    onClick: () => {
                      setEditing(row);
                      setEditForm(ruleFormFromRule(row));
                    },
                  },
                ]}
              />
            ),
          } satisfies Column<CommissionRuleDto>,
        ]
      : []),
  ];

  const recordColumns: Column<CommissionRecordDto>[] = [
    {
      key: "salespersonName",
      header: "Salesperson",
      render: (row) => (
        <span className="font-medium text-zinc-900">
          {row.salespersonName ?? "—"}
        </span>
      ),
    },
    {
      key: "ruleName",
      header: "Rule",
      render: (row) => (
        <span className="text-zinc-600">{row.ruleName ?? "—"}</span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      className: "text-right",
      render: (row) => (
        <span className="font-mono text-xs tabular-nums text-zinc-900">
          {formatMoney(row.amount)}
        </span>
      ),
    },
    {
      key: "commissionPercent",
      header: "Percent",
      render: (row) => (
        <span className="font-mono text-xs tabular-nums text-zinc-600">
          {Number(row.commissionPercent).toLocaleString()}%
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "approvedAt",
      header: "Approved",
      render: (row) => (
        <span className="font-mono text-xs text-zinc-600">
          {row.approvedAt ? new Date(row.approvedAt).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "paidAt",
      header: "Paid",
      render: (row) => (
        <span className="font-mono text-xs text-zinc-600">
          {row.paidAt ? new Date(row.paidAt).toLocaleDateString() : "—"}
        </span>
      ),
    },
    ...(canApprove
      ? [
          {
            key: "actions",
            header: "Actions",
            render: (row: CommissionRecordDto) => (
              <RowActionsMenu
                label="Record actions"
                items={[
                  ...(row.status === "PENDING"
                    ? [
                        {
                          label: "Approve",
                          icon: (
                            <HiOutlineCheckBadge className="h-3.5 w-3.5" />
                          ),
                          onClick: () => approveCommission.mutate(row.id),
                        },
                      ]
                    : []),
                  ...(row.status === "APPROVED"
                    ? [
                        {
                          label: "Mark paid",
                          icon: (
                            <HiOutlineBanknotes className="h-3.5 w-3.5" />
                          ),
                          onClick: () => markPaid.mutate(row.id),
                        },
                      ]
                    : []),
                ]}
              />
            ),
          } satisfies Column<CommissionRecordDto>,
        ]
      : []),
  ];

  const activeRules = rules.filter((rule) => rule.isActive).length;
  const pendingRecords = records.filter(
    (record) => record.status === "PENDING",
  );
  const paidTotal = records
    .filter((record) => record.status === "PAID")
    .reduce((sum, record) => sum + Number(record.amount), 0);
  const payableTotal = records
    .filter((record) => record.status !== "PAID")
    .reduce((sum, record) => sum + Number(record.amount), 0);

  const salespersonPoints = toCategoryPoints(
    records,
    (record) => record.salespersonName ?? "Unassigned",
    (record) => Number(record.amount),
  );

  const statusPoints = toCategoryPoints(
    records,
    (record) => record.status.toLowerCase(),
    () => 1,
  ).map((point) => ({
    ...point,
    label: point.label
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
  }));

  const commissionTrend = toMonthlySeries(
    records,
    6,
    (record) => record.createdAt,
    (record) => Number(record.amount),
    {
      key: "commission-value",
      label: "Commission value",
      color: "#18181b",
    },
  );

  const isLoadingAll = isLoading || recordsLoading;

  const ruleModal = (form: RuleForm, setForm: (form: RuleForm) => void) => (
    <>
      <LabeledInput
        label="Rule name"
        id="rule-name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="e.g. Finished goods — 5%"
        maxLength={200}
        required
      />
      <LabeledSelect
        label="Salesperson"
        id="rule-salesperson"
        value={form.salespersonUserId}
        onChange={(e) =>
          setForm({ ...form, salespersonUserId: e.target.value })
        }
        required
      >
        {salespersonOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </LabeledSelect>
      <div className="grid grid-cols-2 gap-3">
        <LabeledInput
          label="Commission %"
          id="rule-percent"
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={form.commissionPercent}
          onChange={(e) =>
            setForm({ ...form, commissionPercent: e.target.value })
          }
          placeholder="5"
          className="tabular"
          required
        />
        <LabeledInput
          label="Min. margin % (optional)"
          id="rule-margin"
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={form.minimumMarginPercent}
          onChange={(e) =>
            setForm({ ...form, minimumMarginPercent: e.target.value })
          }
          placeholder="—"
          className="tabular"
        />
      </div>
      <LabeledSelect
        label="Item category"
        id="rule-category"
        value={form.itemCategory}
        onChange={(e) => setForm({ ...form, itemCategory: e.target.value })}
      >
        {COMMISSION_CATEGORIES.map((category) => (
          <option key={category.value} value={category.value}>
            {category.label}
          </option>
        ))}
      </LabeledSelect>
      <label className="flex items-center gap-2 text-xs font-medium text-zinc-700">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          className="h-3.5 w-3.5 rounded accent-zinc-900"
        />
        Rule is active
      </label>
    </>
  );

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<HiOutlineBanknotes className="h-4 w-4" />}
        title="Commissions"
        description="Salesperson commission rules and earned records."
        actions={
          canApprove ? (
            <button
              type="button"
              className={BTN_PRIMARY}
              onClick={() => setIsCreateOpen(true)}
            >
              <HiOutlinePlus className="h-4 w-4" />
              Add Rule
            </button>
          ) : undefined
        }
      />

      <ChartStatStrip
        stats={[
          { label: "Active rules", value: String(activeRules) },
          {
            label: "Awaiting approval",
            value: String(pendingRecords.length),
            tone: "amber",
          },
          {
            label: "Payable (pending + approved)",
            value: formatMoney(String(payableTotal)),
            tone: "amber",
          },
          {
            label: "Paid out",
            value: formatMoney(String(paidTotal)),
            tone: "emerald",
          },
        ]}
      />

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard
            title="Commission value by month"
            description="Total commission value earned, last 6 months."
            isLoading={isLoadingAll}
            isEmpty={records.length === 0}
            emptyMessage="No commission records yet"
          >
            <BarList
              points={commissionTrend.points}
              valueFormat={(value) => formatMoney(String(value))}
            />
          </ChartCard>
        </div>

        <ChartCard
          title="Commission status breakdown"
          description="Records grouped by lifecycle stage."
          isLoading={isLoadingAll}
          isEmpty={records.length === 0}
          emptyMessage="No commission records yet"
        >
          <BarList
            points={statusPoints}
            valueFormat={(value) => String(value)}
          />
        </ChartCard>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <ChartCard
          title="Commission value by salesperson"
          description="Total commission value earned per salesperson."
          isLoading={isLoadingAll}
          isEmpty={records.length === 0}
          emptyMessage="No commission records yet"
        >
          <BarList
            points={salespersonPoints}
            valueFormat={(value) => formatMoney(String(value))}
          />
        </ChartCard>

        <div className="space-y-1">
          <p className="px-1 text-xs font-semibold text-zinc-600">
            Commission rules
          </p>
          <DataTable
            columns={ruleColumns}
            rows={rules}
            isLoading={isLoading}
            emptyMessage="No commission rules yet"
            emptyDescription="Rules you create will appear here."
            emptyAction={
              canApprove ? (
                <button
                  type="button"
                  className={BTN_PRIMARY}
                  onClick={() => setIsCreateOpen(true)}
                >
                  <HiOutlinePlus className="h-4 w-4" />
                  Add Rule
                </button>
              ) : undefined
            }
          />
        </div>
      </div>

      <div className="space-y-1">
        <p className="px-1 text-xs font-semibold text-zinc-600">
          Commission records
        </p>
        <DataTable
          columns={recordColumns}
          rows={records}
          isLoading={recordsLoading}
          emptyMessage="No commission records yet"
          emptyDescription="Records are generated when orders with commission rules are fulfilled."
        />
      </div>

      {isCreateOpen && (
        <FormModal
          open
          onClose={() => setIsCreateOpen(false)}
          title="Add commission rule"
          icon={<HiOutlineBanknotes className="h-4 w-4" />}
        >
          {ruleModal(createForm, setCreateForm)}
          <ModalActions
            onCancel={() => setIsCreateOpen(false)}
            onSubmit={submitCreate}
            submitLabel="Add Rule"
            isPending={createRule.isPending}
          />
        </FormModal>
      )}

      {editing && (
        <FormModal
          open
          onClose={() => setEditing(null)}
          title={`Edit ${editing.name}`}
          icon={<HiOutlinePencilSquare className="h-4 w-4" />}
        >
          {ruleModal(editForm, setEditForm)}
          <ModalActions
            onCancel={() => setEditing(null)}
            onSubmit={submitUpdate}
            submitLabel="Save Changes"
            isPending={updateRule.isPending}
          />
        </FormModal>
      )}
    </div>
  );
}
