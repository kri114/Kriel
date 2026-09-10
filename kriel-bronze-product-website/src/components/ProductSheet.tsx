"use client";

import { useEffect, useState } from "react";
import { X, Phone, MessageCircle, ShoppingBag, Ruler, Layers, Tag, PenLine, Check, Palette } from "lucide-react";
import { fmtEUR, PHONE_TEL, waLink } from "@/lib/constants";
import type { Category, Product } from "@/lib/types";
import { useCart } from "./CartContext";

export default function ProductSheet({
  p,
  category,
  onClose,
}: {
  p: Product | null;
  category: Category | null;
  onClose: () => void;
}) {
  const { addItem } = useCart();
  const [customText, setCustomText] = useState("");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");

  useEffect(() => {
    document.body.style.overflow = p ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", esc);
    };
  }, [p, onClose]);

  useEffect(() => {
    setCustomText("");
    setQty(1);
    setAdded(false);
    setPhotoIdx(0);
    setSize(p?.sizes[0] ?? "");
    setColor(p?.colors[0] ?? "");
  }, [p?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!p) return null;

  const photos = p.images.length ? p.images : p.image ? [p.image] : [];
  const activePhoto = photos[photoIdx] ?? photos[0] ?? "/images/categories/germa.jpg";

  const waText = `Përshëndetje KRIEL! Jam i/e interesuar për produktin "${p.name}"${p.code ? ` (${p.code})` : ""}, çmimi ${fmtEUR(p.price)}.${
    size ? ` Madhësia: "${size}".` : ""
  }${color ? ` Ngjyra: "${color}".` : ""}${
    p.customizable && customText ? ` Teksti i dëshiruar: "${customText}".` : ""
  } Faleminderit!`;

  const canAdd = !p.customizable || customText.trim().length > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    addItem(p, { qty, customText: customText.trim(), size, color });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm fade-in" />
      <div
        className="sheet-shadow sheet-up fixed inset-x-0 bottom-0 z-[85] mx-auto w-full max-w-xl overflow-hidden rounded-t-[28px] border-t border-x border-bronze/25 bg-ink-2 sm:bottom-6 sm:rounded-[28px] sm:border"
        style={{ maxHeight: "92svh" }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <span className="h-1.5 w-12 rounded-full bg-bronze/40" />
        </div>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 w-9 h-9 rounded-full bg-ink/70 backdrop-blur border border-line flex items-center justify-center text-ivory-2 hover:text-bronze"
          aria-label="Mbyll"
        >
          <X size={16} />
        </button>

        <div className="overflow-y-auto no-scrollbar" style={{ maxHeight: "calc(92svh - 20px)" }}>
          <div className="relative mx-4 overflow-hidden rounded-2xl bg-[#cfc8bb]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activePhoto} alt={p.name} className="w-full max-h-[42svh] object-cover object-center" />
            {photos.length > 1 && (
              <span className="absolute bottom-2.5 right-2.5 rounded-full bg-ink/70 backdrop-blur px-2.5 py-1 text-[10px] font-semibold text-ivory-2">
                {photoIdx + 1} / {photos.length}
              </span>
            )}
          </div>

          {photos.length > 1 && (
            <div className="mx-4 mt-2.5 flex gap-2 overflow-x-auto no-scrollbar">
              {photos.map((photo, i) => (
                <button
                  key={`${i}-${photo.slice(0, 32)}`}
                  onClick={() => setPhotoIdx(i)}
                  aria-label={`Foto ${i + 1}`}
                  className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                    i === photoIdx ? "border-bronze" : "border-line/60 opacity-60 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="px-5 pt-5 pb-7">
            <p className="text-[10.5px] font-semibold tracking-[0.28em] uppercase text-bronze/80">{category?.name ?? ""}</p>
            <h3 className="mt-1.5 font-display text-[30px] leading-tight font-semibold text-ivory">{p.name}</h3>
            {p.code ? (
              <p className="mt-1.5 text-[11.5px] font-medium tracking-[0.22em] uppercase text-ivory-2/50">{p.code}</p>
            ) : null}

            <div className="mt-3.5 flex items-end justify-between rounded-2xl border border-line bg-ink-3/50 px-4 py-3.5">
              <div>
                <p className="text-[10px] tracking-[0.22em] uppercase text-ivory-2/60">Çmimi me TVSH</p>
                <p className="mt-0.5 font-display text-[32px] font-bold leading-none text-bronze-grad">{fmtEUR(p.price)}</p>
              </div>
              <p className="text-right text-[10.5px] leading-relaxed text-ivory-2/55 max-w-[120px]">
                çmim orientues — konfirmoni disponueshmërinë
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {p.code && <Spec icon={Tag} k="Kodi i katalogut" v={p.code.replace("COD. ", "")} />}
              {p.dims && <Spec icon={Ruler} k="Përmasat" v={p.dims} />}
              {p.material && <Spec icon={Layers} k="Materiali" v={p.material} />}
            </div>

            {p.description ? (
              <p className="mt-5 text-[13.5px] leading-relaxed text-ivory-2/80 font-light">{p.description}</p>
            ) : null}

            {p.sizes.length > 0 && (
              <div className="mt-5">
                <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-ivory-2/60">
                  <Ruler size={13} className="text-bronze" /> Zgjidhni madhësinë
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {p.sizes.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSize(opt)}
                      className={`rounded-full border px-4 py-2 text-[12.5px] font-semibold transition-colors ${
                        size === opt
                          ? "border-bronze bg-bronze/15 text-bronze"
                          : "border-line text-ivory-2 hover:border-bronze/50 hover:text-bronze"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {p.colors.length > 0 && (
              <div className="mt-5">
                <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-ivory-2/60">
                  <Palette size={13} className="text-bronze" /> Zgjidhni ngjyrën
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {p.colors.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setColor(opt)}
                      className={`rounded-full border px-4 py-2 text-[12.5px] font-semibold transition-colors ${
                        color === opt
                          ? "border-bronze bg-bronze/15 text-bronze"
                          : "border-line text-ivory-2 hover:border-bronze/50 hover:text-bronze"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {p.customizable && (
              <div className="mt-5 rounded-2xl border border-bronze/35 bg-bronze/[0.06] p-4">
                <p className="flex items-center gap-2 text-[12.5px] font-semibold text-bronze">
                  <PenLine size={14} /> Ky produkt personalizohet me shkrim
                </p>
                <p className="mt-1 text-[11.5px] text-ivory-2/70 leading-relaxed">
                  Shkruani emrin ose fjalinë që dëshironi të porositni me gërma (p.sh. emri i të ndjerit).
                </p>
                <input
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Shkruani tekstin këtu…"
                  className="mt-2.5 w-full rounded-xl border border-line bg-ink-3/60 px-4 py-3 text-[13.5px] text-ivory placeholder:text-ivory-2/35"
                />
              </div>
            )}

            <div className="mt-5 flex items-center gap-3">
              <span className="text-[11px] tracking-[0.2em] uppercase text-ivory-2/60">Sasia</span>
              <div className="inline-flex items-center rounded-full border border-line overflow-hidden">
                <button
                  onClick={() => setQty((n) => Math.max(1, n - 1))}
                  className="w-9 h-9 flex items-center justify-center text-ivory-2 hover:text-bronze"
                >
                  −
                </button>
                <span className="w-9 text-center text-[13px] font-semibold text-ivory">{qty}</span>
                <button
                  onClick={() => setQty((n) => n + 1)}
                  className="w-9 h-9 flex items-center justify-center text-ivory-2 hover:text-bronze"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <a
                href={`tel:${PHONE_TEL}`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-bronze/45 py-3.5 text-[13px] font-bold text-bronze hover:bg-bronze/10 transition-colors"
              >
                <Phone size={15} strokeWidth={2.3} />
                Telefononi
              </a>
              <button
                onClick={handleAdd}
                disabled={!canAdd}
                className={`inline-flex items-center justify-center gap-2 rounded-full border py-3.5 text-[13px] font-bold transition-colors ${
                  canAdd
                    ? "border-ivory/25 text-ivory hover:border-bronze/60 hover:text-bronze"
                    : "border-line text-ivory-2/40 cursor-not-allowed"
                }`}
              >
                {added ? <Check size={15} strokeWidth={2.6} /> : <ShoppingBag size={15} strokeWidth={2.3} />}
                {added ? "U shtua!" : "Shto në shportë"}
              </button>
              <a
                href={waLink(waText)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ecd9a8] via-bronze to-bronze-2 py-3.5 text-[13px] font-bold text-ink"
              >
                <MessageCircle size={15} strokeWidth={2.3} />
                Porosit në WhatsApp
              </a>
            </div>
            {p.customizable && !canAdd && (
              <p className="mt-2.5 text-[11px] text-bronze/80">Ju lutem shkruani tekstin që dëshironi para se ta shtoni në shportë.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Spec({ icon: Icon, k, v }: { icon: typeof Tag; k: string; v: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-line/70 bg-ink-3/40 px-3 py-2.5">
      <Icon size={14} className="mt-0.5 shrink-0 text-bronze" strokeWidth={2} />
      <div className="min-w-0">
        <p className="text-[9px] tracking-[0.2em] uppercase text-ivory-2/55">{k}</p>
        <p className="mt-0.5 text-[12px] font-semibold text-ivory truncate">{v}</p>
      </div>
    </div>
  );
}
