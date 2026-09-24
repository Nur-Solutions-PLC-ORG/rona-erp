"use client";

import { useState } from "react";
import { HiOutlineCheck, HiOutlineClipboard, HiOutlinePlus, HiOutlineXMark } from "react-icons/hi2";
import { toast } from "sonner";
import type { InspectionDto, InspectionTestDto } from "@rona/types/quality";
import {
  inspectionTestCreateSchema,
  testResultCreateSchema,
} from "@rona/validation/quality";
import { TEST_RESULT_LIST } from "@rona/config/quality";
import { usePermissions } from "@/modules/workspace/hooks";
import { BTN_SECONDARY, Card, type Column, DataTable, StatusBadge } from "@/modules/workspace/components/ui";
import {
  FormModal,
  LabeledInput,
  LabeledSelect,
  LabeledTextarea,
  ModalActions,
} from "@/modules/workspace/components/form";
import {
  useAddInspectionTest,
  useCompleteInspection,
  useInspectionTests,
  useRecordTestResult,
  useRejectInspection,
  useReleaseInspection,
} from "../hooks";

const OVERVIEW_LABEL = "text-xs font-medium text-gray-500";
const OVERVIEW_VALUE = "text-sm text-gray-900";

function OverviewField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className={OVERVIEW_LABEL}>{label}</p>
      <div className={OVERVIEW_VALUE}>{children}</div>
    </div>
  );
}

export function InspectionDetailsModal({
  inspection,
  open,
  onClose,
}: {
  inspection: InspectionDto;
  open: boolean;
  onClose: () => void;
}) {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission("quality.inspection.create");
  const canRelease =
    hasPermission("quality.inspection.review") && hasPermission("quality.inventory.release");
  const canReject =
    hasPermission("quality.inspection.review") && hasPermission("quality.inventory.reject");
  const inProgress = inspection.status === "IN_PROGRESS";
  const completed = inspection.status === "COMPLETED";

  const { tests, isLoading } = useInspectionTests(open ? inspection.id : undefined);

  const [showAddTest, setShowAddTest] = useState(false);
  const [testName, setTestName] = useState("");
  const [testSpec, setTestSpec] = useState("");
  const [testMethod, setTestMethod] = useState("");
  const [testNotes, setTestNotes] = useState("");

  const [resultFor, setResultFor] = useState<string | null>(null);
  const [resultValue, setResultValue] = useState("PASS");
  const [measuredValue, setMeasuredValue] = useState("");
  const [resultNotes, setResultNotes] = useState("");

  const [actionNotes, setActionNotes] = useState("");

  const addTest = useAddInspectionTest(inspection.id);
  const recordResult = useRecordTestResult(inspection.id);
  const complete = useCompleteInspection(inspection.id);
  const release = useReleaseInspection(inspection.id);
  const reject = useRejectInspection(inspection.id);

  const resetForms = () => {
    setShowAddTest(false);
    setTestName("");
    setTestSpec("");
    setTestMethod("");
    setTestNotes("");
    setResultFor(null);
    setResultValue("PASS");
    setMeasuredValue("");
    setResultNotes("");
    setActionNotes("");
  };

  const closeModal = () => {
    resetForms();
    onClose();
  };

  const submitAddTest = () => {
    const parsed = inspectionTestCreateSchema.safeParse({
      name: testName,
      specification: testSpec || undefined,
      method: testMethod || undefined,
      notes: testNotes || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message);
      return;
    }
    addTest.mutate(parsed.data, {
      onSuccess: () => {
        setTestName("");
        setTestSpec("");
        setTestMethod("");
        setTestNotes("");
        setShowAddTest(false);
      },
    });
  };

  const submitResult = (testId: string) => {
    const parsed = testResultCreateSchema.safeParse({
      result: resultValue,
      measuredValue: measuredValue || undefined,
      notes: resultNotes || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message);
      return;
    }
    recordResult.mutate(
      { ...parsed.data, inspectionId: inspection.id, testId },
      {
        onSuccess: () => {
          setResultFor(null);
          setMeasuredValue("");
          setResultNotes("");
        },
      },
    );
  };

  const submitAction = (mutation: typeof complete, action: () => void) => {
    mutation.mutate({ notes: actionNotes || undefined }, { onSuccess: action });
  };

  const columns: Column<InspectionTestDto>[] = [
    { key: "name", header: "Test", render: (row) => <span className="font-medium">{row.name}</span> },
    { key: "specification", header: "Specification", render: (row) => row.specification ?? "—" },
    { key: "method", header: "Method", render: (row) => row.method ?? "—" },
    {
      key: "createdAt",
      header: "Created",
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  if (inProgress && canCreate) {
    columns.push({
      key: "result",
      header: "Result",
      render: (row) =>
        resultFor === row.id ? (
          <button
            type="button"
            onClick={() => setResultFor(null)}
            className="text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setResultFor(row.id)}
            className="text-xs font-medium text-purple-600 hover:text-purple-500"
          >
            Record result
          </button>
        ),
    });
  }

  return (
    <FormModal
      open={open}
      onClose={closeModal}
      title={`Inspection ${inspection.inspectionNumber}`}
      icon={<HiOutlineClipboard />}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5">
        <Card className="p-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <OverviewField label="Type">{inspection.type}</OverviewField>
            <OverviewField label="Status">
              <StatusBadge status={inspection.status} />
            </OverviewField>
            <OverviewField label="Lot">
              <span className="font-mono text-xs">{inspection.lotId}</span>
            </OverviewField>
            <OverviewField label="Created">
              {new Date(inspection.createdAt).toLocaleString()}
            </OverviewField>
            <OverviewField label="Completed">
              {inspection.completedAt ? new Date(inspection.completedAt).toLocaleString() : "—"}
            </OverviewField>
            <OverviewField label="Reviewed">
              {inspection.reviewedAt ? new Date(inspection.reviewedAt).toLocaleString() : "—"}
            </OverviewField>
            <div className="col-span-2 sm:col-span-4">
              <OverviewField label="Notes">{inspection.notes ?? "—"}</OverviewField>
            </div>
          </div>
        </Card>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Tests</h3>
            {inProgress && canCreate && !showAddTest && (
              <button
                type="button"
                onClick={() => setShowAddTest(true)}
                className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-500"
              >
                <HiOutlinePlus className="h-4 w-4" /> Add test
              </button>
            )}
          </div>

          {showAddTest && (
            <Card className="space-y-3 p-4">
              <LabeledInput
                label="Test name"
                id="test-name"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <LabeledInput
                  label="Specification"
                  id="test-spec"
                  value={testSpec}
                  onChange={(e) => setTestSpec(e.target.value)}
                />
                <LabeledInput
                  label="Method"
                  id="test-method"
                  value={testMethod}
                  onChange={(e) => setTestMethod(e.target.value)}
                />
              </div>
              <LabeledTextarea
                label="Notes"
                id="test-notes"
                value={testNotes}
                onChange={(e) => setTestNotes(e.target.value)}
              />
              <ModalActions
                onCancel={() => setShowAddTest(false)}
                onSubmit={submitAddTest}
                submitLabel="Add test"
                isPending={addTest.isPending}
              />
            </Card>
          )}

          <DataTable
            columns={columns}
            rows={tests}
            isLoading={isLoading}
            emptyMessage="No tests recorded for this inspection yet."
          />

          {resultFor && (
            <Card className="space-y-3 p-4">
              <p className="text-sm font-medium text-gray-900">
                Record result — {tests.find((t) => t.id === resultFor)?.name}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <LabeledSelect
                  label="Result"
                  id="result-value"
                  value={resultValue}
                  onChange={(e) => setResultValue(e.target.value)}
                >
                  {TEST_RESULT_LIST.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </LabeledSelect>
                <LabeledInput
                  label="Measured value"
                  id="measured-value"
                  value={measuredValue}
                  onChange={(e) => setMeasuredValue(e.target.value)}
                  placeholder="e.g. 12.5"
                />
              </div>
              <LabeledTextarea
                label="Notes"
                id="result-notes"
                value={resultNotes}
                onChange={(e) => setResultNotes(e.target.value)}
              />
              <ModalActions
                onCancel={() => setResultFor(null)}
                onSubmit={() => submitResult(resultFor)}
                submitLabel="Save result"
                isPending={recordResult.isPending}
              />
            </Card>
          )}
        </section>

        {(inProgress || completed) && (
          <Card className="space-y-3 p-4">
            <LabeledTextarea
              label="Action notes (optional)"
              id="action-notes"
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {inProgress && canCreate && (
                <button
                  type="button"
                  disabled={complete.isPending}
                  onClick={() => submitAction(complete, resetForms)}
                  className={BTN_SECONDARY}
                >
                  <HiOutlineCheck className="h-4 w-4" /> Complete inspection
                </button>
              )}
              {completed && canRelease && (
                <button
                  type="button"
                  disabled={release.isPending}
                  onClick={() => submitAction(release, resetForms)}
                  className={BTN_SECONDARY}
                >
                  <HiOutlineCheck className="h-4 w-4" /> Release lot
                </button>
              )}
              {completed && canReject && (
                <button
                  type="button"
                  disabled={reject.isPending}
                  onClick={() => submitAction(reject, resetForms)}
                  className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                >
                  <HiOutlineXMark className="h-4 w-4" /> Reject lot
                </button>
              )}
            </div>
          </Card>
        )}
      </div>
    </FormModal>
  );
}
