"use client";

import { useRef, useState } from "react";
import { ImagePlus, Link as LinkIcon, Loader2 } from "lucide-react";
import { resizeImageFile } from "@/lib/image";

export default function ImageField({
  value,
  onChange,
  label = "Foto",
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const dataUrl = await resizeImageFile(file);
      onChange(dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gabim gjatë ngarkimit.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <span className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.2em] uppercase text-slate-500">{label}</span>
      <div className="flex items-start gap-3">
        <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImagePlus size={20} className="text-slate-400" />
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="relative">
            <LinkIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={value.startsWith("data:") ? "" : value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Lidhje (URL) e fotos…"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 text-[13px] text-slate-800"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:border-amber-400"
            >
              {busy ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
              Ngarko foto
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="text-[12px] text-red-500 underline underline-offset-2"
              >
                Hiq foton
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          {error && <p className="text-[11px] text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
}
