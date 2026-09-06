"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Phone, MessageCircle, BadgeCheck, Ruler, Layers, Tag, Landmark } from "lucide-react";
import type { ProductDto } from "@/lib/types";
import { fmtEUR, waLink, SITE } from "@/lib/types";
import ProductImage from "./ProductImage";

export default function ProductSheet({
  p,
  categoryName,
  onClose,
}: {
  p: ProductDto | null;
  categoryName: string;
  onClose: () => void;
}) {
  useEffect(() => {
    document.body.style.overflow = p ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", esc);
    };
  }, [p, onClose]);

  const waText = p
    ? `Përshëndetje Kriel! Jam i/e interesuar për produktin "${p.name}" (${p.code}), çmimi ${fmtEUR(p.price)}. Faleminderit!`
    : "";

  return (
    <AnimatePresence>
      {p && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) onClose();
            }}
            className="sheet-shadow fixed inset-x-0 bottom-0 z-[85] mx-auto w-full max-w-xl overflow-hidden rounded-t-[28px] border-t border-x border-bronze/25 bg-ink-2 sm:bottom-6 sm:rounded-[28px] sm:border"
            style={{ maxHeight: "92svh" }}
          >
            <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
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
              <div className="relative mx-4 overflow-hidden rounded-2xl">
                <ProductImage src={p.img} alt={p.name} className="max-h-[46svh]" />
                <span className="absolute left-3.5 bottom-3.5 inline-flex items-center gap-1.5 rounded-full bg-ink/65 backdrop-blur px-3 py-1.5 text-[10px] font-bold tracking-[0.18em] uppercase text-bronze border border-bronze/30">
                  <BadgeCheck size={12} /> Origjinal Caggiati®
                </span>
              </div>

              <div className="px-5 pt-5 pb-7">
                <p className="text-[10.5px] font-semibold tracking-[0.28em] uppercase text-bronze/80">{categoryName}</p>
                <h3 className="mt-1.5 font-display text-[30px] leading-tight font-semibold text-ivory">{p.name}</h3>
                {p.code ? (
                  <p className="mt-1.5 text-[11.5px] font-medium tracking-[0.22em] uppercase text-ivory-2/50">
                    {p.code}
                  </p>
                ) : null}

                <div className="mt-3.5 flex items-end justify-between rounded-2xl border border-line bg-ink-3/50 px-4 py-3.5">
                  <div>
                    <p className="text-[10px] tracking-[0.22em] uppercase text-ivory-2/60">Çmimi me TVSH</p>
                    <p className="mt-0.5 font-display text-[32px] font-bold leading-none text-bronze-grad">
                      {fmtEUR(p.price)}
                    </p>
                  </div>
                  <p className="text-right text-[10.5px] leading-relaxed text-ivory-2/55 max-w-[9.5rem]">
                    Për porosi të shpejta, dërgoni mesazh në WhatsApp
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  {p.dims ? <Spec icon={Ruler} k="Përmasat" v={p.dims} /> : null}
                  {p.mat ? <Spec icon={Layers} k="Materiali" v={p.mat} /> : null}
                  {p.code ? <Spec icon={Tag} k="Kodi katalogu" v={p.code} /> : null}
                  <Spec icon={Landmark} k="Origjina" v="Caggiati · Parma" />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <a
                    href={waLink(waText)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ecd9a8] via-bronze to-bronze-2 py-3.5 text-[13.5px] font-bold text-ink shadow-[0_10px_30px_rgba(201,163,92,0.3)] hover:shadow-[0_14px_40px_rgba(201,163,92,0.45)] transition-shadow"
                  >
                    <MessageCircle size={16} strokeWidth={2.4} />
                    WhatsApp
                  </a>
                  <a
                    href={SITE.phoneHref}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-bronze/45 py-3.5 text-[13.5px] font-bold text-bronze hover:bg-bronze/10 transition-colors"
                  >
                    <Phone size={16} strokeWidth={2.4} />
                    Telefononi
                  </a>
                </div>

                <p className="mt-4 text-center text-[10.5px] tracking-[0.18em] uppercase text-ivory-2/45">
                  Transport me kujdes në gjithë Shqipërinë
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
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
