"use client";

import { HiOutlinePlus, HiOutlineTrash } from "react-icons/hi2";
import {
  LabeledInput,
  LabeledSelect,
} from "@/modules/workspace/components/form";

export interface LineDraft {
  componentItemId: string;
  quantityPerUnit: string;
  notes: string;
}

export const EMPTY_BOM_LINE: LineDraft = {
  componentItemId: "",
  quantityPerUnit: "",
  notes: "",
};

export function BomLinesEditor({
  lines,
  onChange,
  itemOptions,
}: {
  lines: LineDraft[];
  onChange: (lines: LineDraft[]) => void;
  itemOptions: { id: string; label: string }[];
}) {
  const updateLine = (index: number, patch: Partial<LineDraft>) => {
    onChange(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-zinc-700">
          Components (per finished unit)
        </span>
        <button
          type="button"
          onClick={() => onChange([...lines, { ...EMPTY_BOM_LINE }])}
          className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-zinc-100 text-zinc-900 text-xs font-medium transition"
        >
          <HiOutlinePlus className="w-3.5 h-3.5" />
          Add line
        </button>
      </div>
      <div className="space-y-2">
        {lines.map((line, index) => (
          <div key={index} className="flex items-start gap-2">
            <div className="grid grid-cols-2 gap-2 flex-1">
              <LabeledSelect
                label="Component item"
                id={`bom-line-item-${index}`}
                value={line.componentItemId}
                onChange={(event) =>
                  updateLine(index, { componentItemId: event.target.value })
                }
              >
                <option value="">Select item...</option>
                {itemOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </LabeledSelect>
              <LabeledInput
                label="Quantity per unit"
                id={`bom-line-qty-${index}`}
                value={line.quantityPerUnit}
                onChange={(event) =>
                  updateLine(index, { quantityPerUnit: event.target.value })
                }
                placeholder="e.g. 4"
              />
            </div>
            {lines.length > 1 ? (
              <button
                type="button"
                onClick={() => onChange(lines.filter((_, i) => i !== index))}
                className="mt-6 p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition"
                aria-label="Remove line"
              >
                <HiOutlineTrash className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
