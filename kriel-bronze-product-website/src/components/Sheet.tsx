import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, MessageCircle, Ruler, X } from "lucide-react";
import { fmtPrice, waLink, type Product } from "../data/catalog";
import ProductImage from "./ProductImage";

export default function Sheet({ p, onClose }: { p: Product | null; onClose: () => void }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = p ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [p]);

  return (
    <AnimatePresence>
      {p && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-ink/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="sheet-shadow fixed inset-x-0 bottom-0 z-[85] mx-auto max-h-[92svh] w-full max-w-lg overflow-y-auto rounded-t-[28px] border-t border-bronze/25 bg-ink-2 sm:bottom-6 sm:rounded-[28px] sm:border sm:border-line"
            role="dialog"
            aria-modal="true"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <ProductImage src={p.img} alt={p.name} code={p.code} />
              <button
                onClick={onClose}
                aria-label="Mbyll"
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-ink/70 text-ivory-2 backdrop-blur-md transition-colors hover:text-bronze"
              >
                <X size={17} />
              </button>
            </div>

            <div className="px-6 pb-8 pt-5 sm:px-8">
              <h3 className="font-display text-[28px] font-semibold leading-tight text-ivory">
                {p.name}
              </h3>
              {p.code ? (
                <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.2em] text-ivory-2/55">
                  {p.code}
                </p>
              ) : null}

              <div className="mt-4 flex items-center gap-3">
                <span className="text-[26px] font-extrabold tracking-wide text-bronze-grad">
                  {fmtPrice(p.price)}
                </span>
                <span className="rounded-full border border-line px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-ivory-2/60">
                  ME TVSH
                </span>
              </div>

              <div className="mt-5 space-y-2.5">
                {p.dims ? (
                  <p className="flex items-center gap-2.5 text-[13.5px] font-light text-ivory-2/85">
                    <Ruler size={15} className="shrink-0 text-bronze/80" /> {p.dims}
                  </p>
                ) : null}
                {p.mat ? (
                  <p className="flex items-center gap-2.5 text-[13.5px] font-light text-ivory-2/85">
                    <BadgeCheck size={15} className="shrink-0 text-bronze/80" /> {p.mat}
                  </p>
                ) : null}
              </div>

              <p className="mt-5 border-l-2 border-bronze/40 pl-4 text-[12.5px] font-light italic leading-relaxed text-ivory-2/60">
                Çdo kopje numërohet dhe shoqërohet me garanci autenticiteti nga fonderia.
              </p>

              <a
                href={waLink(
                  `Përshëndetje Kriel! Jam i/e interesuar për produktet "${p.name}" (${p.code}), çmimi ${fmtPrice(p.price)}. Faleminderit!`
                )}
                target="_blank"
                rel="noreferrer"
                className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-full bg-bronze py-4 text-[12.5px] font-bold uppercase tracking-[0.18em] text-ink shadow-[0_10px_35px_rgba(201,163,92,0.3)] transition-all hover:shadow-[0_14px_45px_rgba(201,163,92,0.45)]"
              >
                <MessageCircle size={16} strokeWidth={2.4} />
                Pyet në WhatsApp
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
