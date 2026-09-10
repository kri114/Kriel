"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Star, X, Plus, Link as LinkIcon } from "lucide-react";

function resizeImageFile(file: File, maxSize = 1280, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Nuk u lexua fotoja."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Nuk u ngarkua fotoja."));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas nuk mbështetet."));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Multi-photo field for products. The first photo is the cover used in
 * cards/lists; "Bëje kapak" moves any photo to the front.
 */
export default function ImagesField({
  value,
  onChange,
  label = "Fotot e produktit",
}: {
  value: string[];
  onChange: (v: string[]) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");

  const addFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError("");
    setBusy(true);
    try {
      const next = [...value];
      for (const file of Array.from(files)) {
        next.push(await resizeImageFile(file));
      }
      onChange(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gabim gjatë ngarkimit.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const addUrl = () => {
    const v = url.trim();
    if (!v) return;
    onChange([...value, v]);
    setUrl("");
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const makeCover = (index: number) => {
    if (index === 0) return;
    const next = [...value];
    const [photo] = next.splice(index, 1);
    next.unshift(photo);
    onChange(next);
  };

  return (
    <div>
      <span className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.2em] uppercase text-slate-500">{label}</span>

      {value.length > 0 && (
        <div className="mb-3 grid grid-cols-4 sm:grid-cols-6 gap-2">
          {value.map((photo, i) => (
            <div key={`${i}-${photo.slice(0, 32)}`} className="group relative w-full aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="" className="w-full h-full object-cover" />
              {i === 0 ? (
                <span className="absolute left-1 top-1 inline-flex items-center gap-0.5 rounded-md bg-amber-500/95 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  <Star size={9} /> Kapaku
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => makeCover(i)}
                  title="Bëje kapak"
                  className="absolute left-1 top-1 inline-flex items-center gap-0.5 rounded-md bg-white/90 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Star size={9} /> Kapak
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(i)}
                title="Hiq foton"
                className="absolute right-1 top-1 w-5 h-5 rounded-md bg-black/55 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:border-amber-400 disabled:opacity-60"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
          Ngarko foto
        </button>
        <div className="relative flex-1 min-w-0">
          <LinkIcon size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
            placeholder="…ose ngjite URL-në e fotos"
            className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-[12.5px] text-slate-800"
          />
        </div>
        <button
          type="button"
          onClick={addUrl}
          disabled={!url.trim()}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-slate-700 hover:border-amber-400 disabled:opacity-40"
        >
          <Plus size={13} /> Shto
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />
      {error && <p className="mt-1.5 text-[11px] text-red-500">{error}</p>}
      <p className="mt-1.5 text-[10.5px] text-slate-400">Fotoja e parë përdoret si kapak — kaloni miun mbi një foto për «Bëje kapak» ose «Hiq».</p>
    </div>
  );
}
