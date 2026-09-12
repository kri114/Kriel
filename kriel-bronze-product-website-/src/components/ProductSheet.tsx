"use client";

import { useEffect, useState } from "react";
import { X, Phone, MessageCircle, ShoppingBag, Ruler, Layers, Tag, PenLine, Check, Palette, Expand, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Package2 } from "lucide-react";
import { fmtEUR, effectivePrice, PHONE_TEL, waLink } from "@/lib/constants";
import type { Category, Product } from "@/lib/types";
import { useCart } from "./CartContext";

/** Unique values in first-appearance order. */
function unique(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of list) {
    if (!seen.has(x)) {
      seen.add(x);
      out.push(x);
    }
  }
  return out;
}

export default function ProductSheet({
  p,
  category,
  onClose,
  allProducts = [],
  onOpen,
}: {
  p: Product | null;
  category: Category | null;
  onClose: () => void;
  /** Full product list — used to find complementary products in the same set. */
  allProducts?: Product[];
  /** Callback to open another product's sheet (for complementary items). */
  onOpen?: (product: Product) => void;
}) {
  const { addItem } = useCart();
  const [customText, setCustomText] = useState("");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [zoomIdx, setZoomIdx] = useState<number | null>(null);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [setOpen, setSetOpen] = useState(false);

  const hasVariants = (p?.variants.length ?? 0) > 0;

  /** Colors offered — in variant mode only the colors that have priced cells. */
  const colorsList = p
    ? hasVariants
      ? unique(p.variants.map((v) => v.color).filter((c) => c !== ""))
      : p.colors
    : [];

  /** Sizes available for a given color (variant mode: only priced combos). */
  const sizesFor = (c: string): string[] => {
    if (!p) return [];
    if (!hasVariants) return p.sizes;
    const inVariants = unique(
      p.variants.filter((v) => v.color === c && v.size !== "").map((v) => v.size)
    );
    // Simple-flat sizes act as a fallback dimension when a variant color has none.
    return inVariants;
  };

  useEffect(() => {
    document.body.style.overflow = p ? "hidden" : "";
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (zoomIdx !== null) {
        setZoomIdx(null);
      } else {
        onClose();
      }
    };
    window.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", esc);
    };
  }, [p, onClose, zoomIdx]);

  useEffect(() => {
    setCustomText("");
    setQty(1);
    setAdded(false);
    setPhotoIdx(0);
    setZoomIdx(null);
    setSetOpen(false);
    if (p) {
      const firstColor = colorsList[0] ?? "";
      setColor(firstColor);
      setSize(sizesFor(firstColor)[0] ?? "");
    }
  }, [p?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!p) return null;

  const photos = p.images.length ? p.images : p.image ? [p.image] : [];
  const activePhoto = photos[photoIdx] ?? photos[0] ?? "/images/categories/germa.jpg";

  /** Complementary products: same non-empty setName, excluding current product. */
  const complementary = p.setName
    ? allProducts.filter((q) => q.id !== p.id && q.setName === p.setName && q.active)
    : [];

  const currentSizes = sizesFor(color);
  const currentVariant = hasVariants
    ? p.variants.find((v) => v.color === color && (v.size === size || (currentSizes.length === 0 && v.size === "")))
    : undefined;
  const basePrice = currentVariant?.price ?? p.price;
  const onSale = (p.salePct ?? 0) > 0;
  const currentPrice = effectivePrice(basePrice, p.salePct);

  const pickColor = (c: string) => {
    setColor(c);
    setSize(sizesFor(c)[0] ?? "");
  };

  const waText = `Përshëndetje KRIEL! Jam i/e interesuar për produktin "${p.name}"${p.code ? ` (${p.code})` : ""}, çmimi ${fmtEUR(currentPrice)}.${
    size ? ` Madhësia: "${size}".` : ""
  }${color ? ` Ngjyra: "${color}".` : ""}${
    p.customizable && customText ? ` Teksti i dëshiruar: "${customText}".` : ""
  } Faleminderit!`;

  const canAdd =
    (!p.customizable || customText.trim().length > 0) && (!hasVariants || Boolean(currentVariant));

  const handleAdd = () => {
    if (!canAdd) return;
    addItem(p, { qty, customText: customText.trim(), size, color, price: currentPrice });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  const navZoom = (dir: -1 | 1) => {
    setZoomIdx((i) => {
      if (i === null || photos.length < 2) return i;
      return (i + dir + photos.length) % photos.length;
    });
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
          <div
            className="relative mx-4 overflow-hidden rounded-2xl bg-[#cfc8bb] cursor-zoom-in group"
            onClick={() => setZoomIdx(photoIdx)}
            title="Kliko për ta inspektuar foton"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activePhoto} alt={p.name} className="w-full max-h-[42svh] object-cover object-center" />
            <span className="absolute left-2.5 bottom-2.5 inline-flex items-center gap-1.5 rounded-full bg-ink/70 backdrop-blur px-2.5 py-1 text-[10px] font-semibold text-ivory-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Expand size={11} /> Inspekto
            </span>
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
                <p className="mt-0.5 flex items-baseline gap-2.5">
                  <span className="font-display text-[32px] font-bold leading-none text-bronze-grad">{fmtEUR(currentPrice)}</span>
                  {onSale && (
                    <span className="text-[15px] font-semibold line-through text-ivory-2/45">{fmtEUR(basePrice)}</span>
                  )}
                </p>
                {onSale && (
                  <span className="mt-1.5 inline-flex items-center rounded-full bg-gradient-to-r from-[#d3543a] to-[#8e1f12] px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-[#fff2e8]">
                    Ulje -{p.salePct}%
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

            {/* ── Pjesë e Setit ─────────────────────────────────────────── */}
            {p.setName && (
              <div className="mt-5 rounded-2xl border border-bronze/30 bg-bronze/[0.05] overflow-hidden">
                <button
                  onClick={() => setSetOpen((v) => !v)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
                  aria-expanded={setOpen}
                >
                  <span className="flex items-center gap-2.5">
                    <Package2 size={15} className="text-bronze shrink-0" strokeWidth={2} />
                    <span className="text-[12.5px] font-semibold text-ivory-2/90">
                      Pjesë e setit{" "}
                      <span className="text-bronze">{p.setName}</span>
                    </span>
                  </span>
                  {setOpen ? (
                    <ChevronUp size={14} className="text-bronze/70 shrink-0" />
                  ) : (
                    <ChevronDown size={14} className="text-bronze/70 shrink-0" />
                  )}
                </button>

                {setOpen && (
                  <div className="border-t border-bronze/20 px-4 pb-4 pt-3">
                    {complementary.length === 0 ? (
                      <p className="text-[12px] text-ivory-2/55 italic">
                        Nuk ka produkte të tjera në këtë set.
                      </p>
                    ) : (
                      <>
                        <p className="text-[10.5px] font-semibold tracking-[0.22em] uppercase text-bronze/70 mb-3">
                          Komplementare me:
                        </p>
                        <div className="space-y-2.5">
                          {complementary.map((cp) => {
                            const cpPrice = effectivePrice(cp.price, cp.salePct);
                            return (
                              <button
                                key={cp.id}
                                onClick={() => onOpen?.(cp)}
                                className="w-full flex items-center gap-3 rounded-xl border border-line/70 bg-ink-3/40 p-2.5 text-left hover:border-bronze/50 hover:bg-bronze/[0.06] transition-colors group"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={cp.image || "/images/categories/germa.jpg"}
                                  alt={cp.name}
                                  className="w-14 h-14 rounded-lg object-cover shrink-0 bg-[#cfc8bb]"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-semibold text-ivory leading-snug line-clamp-2 group-hover:text-bronze transition-colors">
                                    {cp.name}
                                  </p>
                                  {cp.code && (
                                    <p className="mt-0.5 text-[10px] tracking-[0.16em] uppercase text-ivory-2/50">
                                      {cp.code}
                                    </p>
                                  )}
                                  <p className="mt-1 text-[13px] font-bold text-bronze-grad">
                                    {fmtEUR(cpPrice)}
                                    {(cp.salePct ?? 0) > 0 && (
                                      <span className="ml-1.5 text-[11px] font-normal line-through text-ivory-2/40">
                                        {fmtEUR(cp.price)}
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <ChevronRight size={15} className="text-bronze/50 shrink-0 group-hover:text-bronze transition-colors" />
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
            {/* ────────────────────────────────────────────────────────────── */}

            {colorsList.length > 0 && (
              <div className="mt-5">
                <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-ivory-2/60">
                  <Palette size={13} className="text-bronze" /> Zgjidhni ngjyrën
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {colorsList.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => pickColor(opt)}
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

            {currentSizes.length > 0 && (
              <div className="mt-5">
                <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-ivory-2/60">
                  <Ruler size={13} className="text-bronze" /> Zgjidhni madhësinë
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {currentSizes.map((opt) => (
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

      {zoomIdx !== null && (
        <div
          onClick={() => setZoomIdx(null)}
          className="fixed inset-0 z-[120] bg-ink/95 backdrop-blur-md fade-in flex items-center justify-center p-4 sm:p-10"
        >
          <button
            onClick={() => setZoomIdx(null)}
            className="absolute right-4 top-4 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-ivory hover:text-bronze hover:border-bronze/50"
            aria-label="Mbyll pamjen e plotë"
          >
            <X size={18} />
          </button>

          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); navZoom(-1); }}
                className="absolute left-3 sm:left-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-ivory hover:text-bronze hover:border-bronze/50"
                aria-label="Fotoja e mëparshme"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navZoom(1); }}
                className="absolute right-3 sm:right-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-ivory hover:text-bronze hover:border-bronze/50"
                aria-label="Fotoja tjetër"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[zoomIdx] ?? activePhoto}
            alt={p.name}
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full object-contain rounded-xl"
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 rounded-full bg-white/10 border border-white/15 px-4 py-1.5">
            <span className="text-[11px] font-semibold text-ivory-2">
              {p.name}{photos.length > 1 ? ` · ${zoomIdx + 1}/${photos.length}` : ""}
            </span>
            <span className="text-[10px] text-ivory-2/50">Kliko jashtë ose Esc për të mbyllur</span>
          </div>
        </div>
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
