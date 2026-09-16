"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Star, X, Plus, Link as LinkIcon, ChevronDown, ChevronRight, Image as ImageIcon } from "lucide-react";

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
 * Feature 3: Admin field for linking images to specific colours.
 * colorImages: { colorName: string[] }
 * 0, 1, or many images per colour supported.
 */
export default function ColorImagesField({
  colors,
  colorImages,
  onChange,
}: {
  colors: string[];
  colorImages: Record<string, string[]>;
  onChange: (v: Record<string, string[]>) => void;
}) {
  const [expandedColor, setExpandedColor] = useState<string | null>(null);

  if (colors.length === 0) return null;

  const totalImages = Object.values(colorImages).reduce((sum, imgs) => sum + imgs.length, 0);

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
      <div className="flex items-center justify-between mb-1">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-700">
          Fotot sipas ngjyrës (opsionale)
        </span>
        <span className="text-[10.5px] text-slate-600">
          {totalImages} foto gjithsej
        </span>
      </div>
      <p className="text-[11px] text-slate-600 mb-3">
        Lidhni foto specifike me çdo ngjyrë. Kur klienti zgjedh një ngjyrë, do të shfaqen fotot e saj.
        Nëse ngjyra nuk ka foto, do të shfaqen fotot e përgjithshme të produktit.
      </p>

      <div className="space-y-2">
        {colors.map((color) => {
          const imgs = colorImages[color] ?? [];
          const isExpanded = expandedColor === color;

          return (
            <div key={color} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedColor(isExpanded ? null : color)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                  <span className="text-[12.5px] font-semibold text-slate-800">{color}</span>
                </div>
                <div className="flex items-center gap-2">
                  {imgs.length > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] font-bold text-amber-800">
                      <ImageIcon size={10} /> {imgs.length} foto
                    </span>
                  ) : (
                    <span className="text-[10.5px] text-slate-400 italic">pa foto specifike</span>
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-100 p-3">
                  <ColorImageEditor
                    color={color}
                    images={imgs}
                    onChange={(newImgs) => {
                      onChange({ ...colorImages, [color]: newImgs });
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

function ColorImageEditor({
  color,
  images,
  onChange,
}: {
  color: string;
  images: string[];
  onChange: (imgs: string[]) => void;
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
      const next = [...images];
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
    onChange([...images, v]);
    setUrl("");
  };

  const remove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const makeCover = (index: number) => {
    if (index === 0) return;
    const next = [...images];
    const [photo] = next.splice(index, 1);
    next.unshift(photo);
    onChange(next);
  };

  return (
    <div>
      <p className="text-[11px] text-slate-600 mb-2">
        Foto për ngjyrën <strong>{color}</strong> — 0, 1 ose disa foto.
      </p>

      {images.length > 0 && (
        <div className="mb-3 grid grid-cols-4 sm:grid-cols-6 gap-2">
          {images.map((photo, i) => (
            <div
              key={`${i}-${photo.slice(0, 32)}`}
              className="group relative w-full aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
            >
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
          <LinkIcon size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
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
    </div>
  );
}
