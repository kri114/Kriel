"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Image as ImageIcon, X } from "lucide-react";
import ImagesField from "./ImagesField";

export default function ColorImagesField({
  colors,
  value,
  onChange,
}: {
  colors: string[];
  value: Record<string, string[]>;
  onChange: (v: Record<string, string[]>) => void;
}) {
  const [openColor, setOpenColor] = useState<string | null>(null);

  if (colors.length === 0) return null;

  return (
    <div className="mt-6 space-y-3">
      <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-700">
        Foto sipas ngjyrës (opsionale)
      </span>
      <p className="text-[11px] text-slate-600 mb-3">
        Lidhni foto specifike me secilën ngjyrë. Kur klienti zgjedh ngjyrën, galeria do të shfaqë këto foto.
        Nëse një ngjyrë nuk ka foto të lidhura, do të shfaqen fotot e përgjithshme të produktit.
      </p>

      <div className="grid gap-2">
        {colors.map((color) => {
          const isOpen = openColor === color;
          const images = value[color] || [];

          return (
            <div
              key={color}
              className={`rounded-xl border ${
                isOpen ? "border-amber-400 bg-amber-50/30" : "border-slate-200 bg-white"
              } transition-all`}
            >
              <button
                type="button"
                onClick={() => setOpenColor(isOpen ? null : color)}
                className="flex w-full items-center justify-between p-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <ImageIcon size={16} />
                  </div>
                  <div>
                    <span className="text-[13px] font-bold text-slate-900">{color}</span>
                    <span className="ml-2 text-[11px] text-slate-500">
                      {images.length === 0 ? "Asnjë foto e lidhur" : `${images.length} foto`}
                    </span>
                  </div>
                </div>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {isOpen && (
                <div className="border-t border-amber-100 p-4">
                  <ImagesField
                    label={`Foto për ngjyrën: ${color}`}
                    value={images}
                    onChange={(newImages) => {
                      onChange({ ...value, [color]: newImages });
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
