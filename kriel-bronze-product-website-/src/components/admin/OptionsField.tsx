"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

/**
 * Chip-list editor for per-product option lists (sizes, colors/finishes).
 * The customer picks one of these in the product sheet.
 */
export default function OptionsField({
  value,
  onChange,
  label,
  placeholder,
  hint,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  label: string;
  placeholder: string;
  hint?: string;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (!value.some((x) => x.toLowerCase() === v.toLowerCase())) {
      onChange([...value, v]);
    }
    setDraft("");
  };

  return (
    <div>
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-700">{label}</span>
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {value.map((opt, i) => (
            <span
              key={`${opt}-${i}`}
              className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 pl-2.5 pr-1 py-1 text-[11.5px] font-semibold text-amber-800"
            >
              {opt}
              <button
                type="button"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                className="w-4 h-4 rounded-full flex items-center justify-center text-amber-600 hover:bg-amber-200"
                aria-label="Hiq"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px]"
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 hover:border-amber-400 disabled:opacity-40"
        >
          <Plus size={13} /> Shto
        </button>
      </div>
      {hint && <p className="mt-1 text-[10.5px] text-slate-600">{hint}</p>}
    </div>
  );
}
