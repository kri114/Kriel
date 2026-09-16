"use client";

import { Wand2 } from "lucide-react";
import { fmtEUR } from "@/lib/constants";
import type { ProductVariant } from "@/lib/types";

/**
 * Price matrix linking color × size → price + pricePerChar.
 *
 * Rows = the product's colors (or a single "Standard" row when none),
 * columns = its sizes (or a single "Standard" column when none).
 * A filled price means that combination is offered at that price;
 * an empty cell means the combination is unavailable.
 *
 * Feature 1: Each cell also has an optional "€/karakter" field.
 */
export default function VariantMatrix({
  basePrice,
  colors,
  sizes,
  value,
  onChange,
  isCustomizable = false,
}: {
  basePrice: number;
  colors: string[];
  sizes: string[];
  value: ProductVariant[];
  onChange: (v: ProductVariant[]) => void;
  isCustomizable?: boolean;
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
      const existing = find(color, size);
      onChange([...others, { color, size, price, pricePerChar: existing?.pricePerChar ?? 0 }]);
    }
  };

  const setPricePerChar = (color: string, size: string, raw: string) => {
    const existing = find(color, size);
    if (!existing) return; // can only set pricePerChar if the cell has a price
    const others = value.filter((v) => !(v.color === color && v.size === size));
    const pricePerChar = Number(raw);
    onChange([
      ...others,
      {
        ...existing,
        pricePerChar: raw.trim() === "" || !Number.isFinite(pricePerChar) || pricePerChar < 0
          ? 0
          : pricePerChar,
      },
    ]);
  };

  const fillAll = () => {
    const next = [...value];
    for (const c of rows) {
      for (const s of cols) {
        if (!next.some((v) => v.color === c && v.size === s)) {
          next.push({ color: c, size: s, price: basePrice, pricePerChar: 0 });
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
        {isCustomizable && (
          <> Mund të vendosni gjithashtu çmimin <strong>€/karakter</strong> për tekstin e personalizuar të çdo varianti.</>
        )}
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
                      <div className="flex flex-col gap-1">
                        {/* Price cell */}
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-600">€</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={entry ? String(entry.price) : ""}
                            onChange={(e) => setCell(c, s, e.target.value)}
                            placeholder={basePrice ? String(basePrice) : "0.00"}
                            title="Çmimi i variantit"
                            className="w-24 rounded-lg border border-slate-300 pl-6 pr-2 py-1.5 text-[12px] focus:border-amber-500 outline-none"
                          />
                        </div>
                        {/* Price per char cell — only shown when product is customizable and variant has a price */}
                        {isCustomizable && entry && (
                          <div className="relative" title="Çmimi për karakter (tekst i personalizuar)">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-emerald-600">€/k</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={entry.pricePerChar && entry.pricePerChar > 0 ? String(entry.pricePerChar) : ""}
                              onChange={(e) => setPricePerChar(c, s, e.target.value)}
                              placeholder="0.00"
                              title="Çmimi për karakter"
                              className="w-24 rounded-lg border border-emerald-300 pl-8 pr-2 py-1 text-[11px] focus:border-emerald-500 outline-none bg-emerald-50"
                            />
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isCustomizable && (
        <p className="mt-1.5 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
          <strong>€/k</strong> = çmimi për çdo karakter/shkronjë në tekstin e personalizuar të atij varianti.
          Nëse lihet bosh, nuk aplikohet çmim shtesë për tekstin.
        </p>
      )}

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
