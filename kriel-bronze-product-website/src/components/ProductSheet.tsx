"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Phone, MessageCircle, ShoppingBag, Ruler, Layers, Tag, PenLine, Check, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import { applyDiscount, fmtEUR, PHONE_TEL, waLink } from "@/lib/constants";
import type { Category, Product, ProductVariant } from "@/lib/types";
import { useCart } from "./CartContext";
import Lightbox from "./Lightbox";

const FALLBACK_IMG = "/images/categories/germa.jpg";

export default function ProductSheet({
  p,
  category,
  variants,
  onClose,
}: {
  p: Product | null;
  category: Category | null;
  variants: ProductVariant[];
  onClose: () => void;
}) {
  const { addItem } = useCart();
  const [customText, setCustomText] = useState("");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

  useEffect(() => {
    document.body.style.overflow = p ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", esc);
    };
  }, [p, onClose]);

  // Colors / sizes derived from this product's variants. A product may have
  // only sizes, only colors, both (each color can list its own sizes), or
  // neither (plain product — behaves exactly as before).
  const colors = useMemo(
    () => Array.from(new Set(variants.map((v) => v.color).filter(Boolean))),
    [variants]
  );
  const sizesForSelectedColor = useMemo(() => {
    const pool = colors.length > 0 ? variants.filter((v) => v.color === selectedColor) : variants;
    return Array.from(new Set(pool.map((v) => v.size).filter(Boolean)));
  }, [variants, colors, selectedColor]);

  const matchingVariant = useMemo(() => {
    if (colors.length === 0 && sizesForSelectedColor.length === 0) return null;
    return (
      variants.find(
        (v) =>
          (colors.length === 0 || v.color === selectedColor) &&
          (sizesForSelectedColor.length === 0 || v.size === selectedSize)
      ) ?? null
    );
  }, [variants, colors, sizesForSelectedColor, selectedColor, selectedSize]);

  const rawPrice = matchingVariant?.price ?? p?.price ?? 0;
  const hasDiscount = Boolean(p?.discountPercent && p.discountPercent > 0);
  const effectivePrice = hasDiscount ? applyDiscount(rawPrice, p?.discountPercent) : rawPrice;

  const gallery = useMemo(() => {
    if (!p) return [];
    const list = [p.image, ...(p.images ?? [])].filter(Boolean);
    return list.length > 0 ? list : [FALLBACK_IMG];
  }, [p]);

  const displayedImage = matchingVariant?.image || gallery[activeImg] || FALLBACK_IMG;

  useEffect(() => {
    setCustomText("");
    setQty(1);
    setAdded(false);
    setActiveImg(0);
    setSelectedColor(colors[0] ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p?.id]);

  useEffect(() => {
    setSelectedSize(sizesForSelectedColor[0] ?? "");
  }, [selectedColor, sizesForSelectedColor]);

  if (!p) return null;

  const variantText = [selectedColor, selectedSize].filter(Boolean).join(" · ");

  const waText = `Përshëndetje KRIEL! Jam i/e interesuar për produktin "${p.name}"${p.code ? ` (${p.code})` : ""}${
    variantText ? ` — ${variantText}` : ""
  }, çmimi ${fmtEUR(effectivePrice)}.${
    p.customizable && customText ? ` Teksti i dëshiruar: "${customText}".` : ""
  } Faleminderit!`;

  const canAdd = !p.customizable || customText.trim().length > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    addItem(p, {
      qty,
      customText: customText.trim(),
      color: selectedColor,
      size: selectedSize,
      price: effectivePrice,
    });
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
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="group relative block w-full"
              aria-label="Zmadho foton"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={displayedImage} alt={p.name} className="w-full max-h-[42svh] object-cover object-center" />
              <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-ink/70 backdrop-blur px-3 py-1.5 text-[11px] font-semibold text-ivory opacity-90 group-hover:opacity-100 transition-opacity">
                <ZoomIn size={13} /> Zmadho
              </span>
            </button>

            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveImg((i) => (i - 1 + gallery.length) % gallery.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-ink/60 text-ivory flex items-center justify-center hover:bg-ink/80"
                  aria-label="Foto e mëparshme"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImg((i) => (i + 1) % gallery.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-ink/60 text-ivory flex items-center justify-center hover:bg-ink/80"
                  aria-label="Foto tjetër"
                >
                  <ChevronRight size={15} />
                </button>
              </>
            )}
          </div>

          {gallery.length > 1 && (
            <div className="mt-2.5 flex gap-2 px-4 overflow-x-auto no-scrollbar">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-colors ${
                    i === activeImg ? "border-bronze" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="w-full h-full object-cover" />
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
                <div className="mt-0.5 flex items-baseline gap-2.5">
                  <p className={`font-display text-[32px] font-bold leading-none ${hasDiscount ? "text-red-400" : "text-bronze-grad"}`}>
                    {fmtEUR(effectivePrice)}
                  </p>
                  {hasDiscount && (
                    <p className="text-[15px] font-medium text-ivory-2/45 line-through">{fmtEUR(rawPrice)}</p>
                  )}
                </div>
                {hasDiscount && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-red-600/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Ulje -{Math.round(p.discountPercent as number)}%
                  </span>
                )}
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

            {colors.length > 0 && (
              <div className="mt-5">
                <span className="text-[11px] tracking-[0.2em] uppercase text-ivory-2/60">Ngjyra</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`rounded-full border px-4 py-2 text-[12.5px] font-semibold transition-colors ${
                        selectedColor === c
                          ? "border-bronze bg-bronze/15 text-bronze"
                          : "border-line text-ivory-2/80 hover:border-bronze/50"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {sizesForSelectedColor.length > 0 && (
              <div className="mt-4">
                <span className="text-[11px] tracking-[0.2em] uppercase text-ivory-2/60">Përmasa</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {sizesForSelectedColor.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`rounded-full border px-4 py-2 text-[12.5px] font-semibold transition-colors ${
                        selectedSize === s
                          ? "border-bronze bg-bronze/15 text-bronze"
                          : "border-line text-ivory-2/80 hover:border-bronze/50"
                      }`}
                    >
                      {s}
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
                  className="mt-2.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-[13.5px] text-slate-900 placeholder:text-slate-400"
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

      {lightboxOpen && (
        <Lightbox
          images={gallery}
          index={activeImg}
          onIndexChange={setActiveImg}
          onClose={() => setLightboxOpen(false)}
        />
      )}
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
