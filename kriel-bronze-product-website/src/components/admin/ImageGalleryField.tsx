"use client";

import { useRef, useState } from "react";
import { ImagePlus, Link as LinkIcon, Loader2, X, ArrowLeft, ArrowRight } from "lucide-react";
import { resizeImageFile } from "@/lib/image";

/**
 * Multi-photo gallery editor for a product's additional images (shown as a
 * carousel/lightbox on the public product sheet, alongside the main cover
 * photo managed by <ImageField>).
 */
export default function ImageGalleryField({
  value,
  onChange,
  label = "Foto shtesë (galeri)",
}: {
  value: string[];
  onChange: (v: string[]) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const addImage = (img: string) => {
    if (!img.trim()) return;
    onChange([...value, img.trim()]);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError("");
    setBusy(true);
    try {
      const next: string[] = [];
      for (const file of Array.from(files)) {
        next.push(await resizeImageFile(file));
      }
      onChange([...value, ...next]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gabim gjatë ngarkimit.");
    } finally {
      setBusy(false);
    }
  };

  const removeAt = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const moveAt = (idx: number, dir: -1 | 1) => {
    const next = [...value];
    const swapWith = idx + dir;
    if (swapWith < 0 || swapWith >= next.length) return;
    [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
    onChange(next);
  };

  return (
    <div>
      <span className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.2em] uppercase text-slate-500">
        {label}
      </span>

      {value.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-2.5">
          {value.map((img, i) => (
            <div key={i} className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => moveAt(i, -1)}
                  disabled={i === 0}
                  className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center text-slate-700 disabled:opacity-30"
                  title="Lëviz majtas"
                >
                  <ArrowLeft size={11} />
                </button>
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center text-red-500"
                  title="Hiq foton"
                >
                  <X size={11} />
                </button>
                <button
                  type="button"
                  onClick={() => moveAt(i, 1)}
                  disabled={i === value.length - 1}
                  className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center text-slate-700 disabled:opacity-30"
                  title="Lëviz djathtas"
                >
                  <ArrowRight size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <LinkIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addImage(urlDraft);
                setUrlDraft("");
              }
            }}
            placeholder="Lidhje (URL) e fotos… (Enter për ta shtuar)"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 text-[13px] text-slate-800"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            addImage(urlDraft);
            setUrlDraft("");
          }}
          disabled={!urlDraft.trim()}
          className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 disabled:opacity-40"
        >
          Shto
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:border-amber-400"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
          Ngarko foto (mund të zgjidhni disa njëherësh)
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}
