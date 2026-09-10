"use client";

import { Wand2 } from "lucide-react";
import { fmtEUR } from "@/lib/constants";
import type { ProductVariant } from "@/lib/types";

/**
 * Price matrix linking color × size → price.
 *
 * Rows = the product's colors (or a single "Standard" row when none),
 * columns = its sizes (or a single "Standard" column when none).
 * A filled price means that combination is offered at that price;
 * an empty cell means the combination is unavailable — this is how a
 * color can offer a different subset of sizes than another color.
 */
export default function VariantMatrix({
  basePrice,
  colors,
  sizes,
  value,
  onChange,
}: {
  basePrice: number;
  colors: string[];
  sizes: string[];
  value: ProductVariant[];
  onChange: (v: ProductVariant[]) => void;
}) {
  const rows = colors.length ? colors : [""];
  const cols = sizes.length ? sizes : [""];

  const find = (color: string, size: string) =>
    value.find((v) => v.color === color && v.size === size);

  const setCell = (color: string, size: string, raw: string) => {
    const others = value.filter((v) => !(v.color === color && v.size === size));
    const price = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(price) || price <= 0) {
      onChange(others);
    } else {
      onChange([...others, { color, size, price }]);
    }
  };

  const fillAll = () => {
    const next = [...value];
    for (const c of rows) {
      for (const s of cols) {
        if (!next.some((v) => v.color === c && v.size === s)) {
          next.push({ color: c, size: s, price: basePrice });
        }
      }
    }
    onChange(next);
  };

  const total = rows.length * cols.length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2 mb-1">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-700">
          Çmimet sipas variantit (ngjyrë × madhësi)
        </span>
        <span className="text-[10.5px] text-slate-600">
          {value.length}/{total} kombinime aktive
        </span>
      </div>
      <p className="mb-2 text-[10.5px] leading-relaxed text-slate-600">
        Plotësoni çmimin për çdo kombinim që ofrohet — bosh do të thotë «i padisponueshëm».
        Sapo të plotësoni të paktën një çmim, klienti zgjedh ngjyrën, pastaj madhësinë e saj
        dhe sheh çmimin përkatës.
      </p>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full border-collapse text-[12.5px]">
          <thead>
            <tr>
              <th className="bg-slate-50 px-3 py-2 text-left text-[10.5px] font-bold uppercase tracking-wide text-slate-600 whitespace-nowrap">
                Ngjyra \ Madhësia
              </th>
              {cols.map((s) => (
                <th key={s || "std"} className="bg-slate-50 px-3 py-2 text-left font-semibold text-slate-700 whitespace-nowrap">
                  {s || "Standarde"}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c || "std"} className="border-t border-slate-100">
                <td className="bg-slate-50 px-3 py-2 font-semibold text-slate-700 whitespace-nowrap">
                  {c || "Standarde"}
                </td>
                {cols.map((s) => {
                  const entry = find(c, s);
                  return (
                    <td key={s || "std"} className="px-2 py-1.5">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-600">€</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={entry ? String(entry.price) : ""}
                          onChange={(e) => setCell(c, s, e.target.value)}
                          placeholder={basePrice ? String(basePrice) : "0.00"}
                          className="w-24 rounded-lg border border-slate-300 pl-6 pr-2 py-1.5 text-[12px] focus:border-amber-500 outline-none"
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={fillAll}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[11.5px] font-semibold text-slate-600 hover:border-amber-400"
        >
          <Wand2 size={12} /> Mbushe të gjitha me çmimin bazë ({fmtEUR(basePrice)})
        </button>
      </div>
    </div>
  );
}
