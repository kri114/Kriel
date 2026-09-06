"use client";

import { motion } from "motion/react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import type { CategoryDto, ProductDto } from "@/lib/types";
import { fmtEUR } from "@/lib/types";
import ProductImage from "./ProductImage";
import { Eyebrow } from "./Reveal";

/**
 * Seksioni "Më të pëlqyerat" — produktet e zgjedhura nga pronari,
 * të menaxhueshme plotësisht nga paneli i adminit (/admin).
 */
export default function Featured({
  products,
  categories,
  onOpen,
}: {
  products: ProductDto[];
  categories: CategoryDto[];
  onOpen: (p: ProductDto) => void;
}) {
  const featured = products
    .filter((p) => p.featured)
    .sort((a, b) => a.featuredOrder - b.featuredOrder)
    .slice(0, 6);

  if (featured.length === 0) return null;

  const catName = (p: ProductDto) => categories.find((c) => c.id === p.categoryId)?.name ?? "";

  return (
    <section id="te-pelqyerat" className="relative py-20 sm:py-28 overflow-hidden">
      {/* stolisje sfondi */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
      >
        <span className="font-display italic text-[26vw] leading-none text-bronze/5 whitespace-nowrap">
          pelqyerat
        </span>
      </div>
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-80 w-[42rem] rounded-full bg-bronze/10 blur-3xl" />
      <div className="hairline absolute top-0 inset-x-6" />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-6">
        <div className="text-center">
          {/* badge elegant "Më të pëlqyerat" */}
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.94 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-8% 0px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="inline-block"
          >
            <span className="badge-shine badge-glow relative inline-flex items-center gap-2.5 overflow-hidden rounded-full border border-bronze/45 bg-gradient-to-r from-bronze/15 via-bronze/20 to-bronze/15 backdrop-blur-md px-6 py-2.5">
              <Sparkles size={13} strokeWidth={2.2} className="text-bronze" />
              <span className="text-[11px] sm:text-[12px] font-extrabold tracking-[0.34em] uppercase text-bronze-grad">
                Më të pëlqyerat
              </span>
              <Sparkles size={13} strokeWidth={2.2} className="text-bronze" />
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8% 0px" }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 font-display text-4xl sm:text-[52px] font-medium leading-[1.02] text-ivory"
          >
            Zgjedhjet që{" "}
            <em className="text-bronze-grad not-italic font-semibold">klientët i duan</em>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8% 0px" }}
            transition={{ duration: 0.9, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-4 max-w-xl text-[14.5px] leading-relaxed text-ivory-2/80 font-light"
          >
            Veprat më të kërkuara të koleksionit tonë — përzgjedhur me kujdes nga
            pronari dhe të dashuruara nga familjet që na besojnë.
          </motion.p>
        </div>

        {/* rrjetja editoriale e produkteve */}
        <div className="mt-14 grid gap-5 sm:gap-6 md:grid-cols-3">
          {featured.map((p, i) => {
            const middle = featured.length === 3 && i === 1;
            return (
              <motion.button
                key={p.id}
                onClick={() => onOpen(p)}
                initial={{ opacity: 0, y: 44 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-6% 0px" }}
                transition={{ duration: 0.85, delay: 0.12 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                className={`group relative text-left ${middle ? "md:-translate-y-7" : ""}`}
              >
                <div
                  className={`relative overflow-hidden rounded-[26px] border bg-ink-2 transition-all duration-500 group-hover:border-bronze/55 group-hover:shadow-[0_28px_70px_rgba(0,0,0,0.6)] ${
                    middle
                      ? "border-bronze/40 shadow-[0_24px_60px_rgba(201,163,92,0.12)]"
                      : "border-line"
                  }`}
                >
                  {/* numërimi editorial */}
                  <span className="pointer-events-none absolute -top-4 left-4 z-10 font-display italic text-[92px] leading-none text-bronze/25 select-none transition-colors duration-500 group-hover:text-bronze/45">
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <ProductImage
                    src={p.img}
                    alt={p.name}
                    className={`${middle ? "aspect-[4/4.7]" : "aspect-[4/4.4]"} rounded-t-none`}
                  />

                  {/* badge origjinaliteti + shigjeta */}
                  <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-ink/60 backdrop-blur-sm border border-bronze/30 px-3 py-1.5 text-[9.5px] font-bold tracking-[0.18em] uppercase text-bronze">
                    {catName(p)}
                  </span>
                  <span className="absolute right-4 bottom-[6.2rem] sm:bottom-[6.4rem] w-10 h-10 rounded-full bg-gradient-to-br from-[#ecd9a8] via-bronze to-bronze-2 text-ink flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-400 shadow-[0_10px_28px_rgba(201,163,92,0.4)]">
                    <ArrowUpRight size={17} strokeWidth={2.5} />
                  </span>

                  <div className="relative border-t border-line/70 bg-ink-2/95 px-5 py-4.5 px-5 py-4">
                    <div className="hairline absolute top-0 inset-x-5" />
                    <h3 className="font-display text-[21px] sm:text-[23px] font-semibold leading-snug text-ivory line-clamp-1">
                      {p.name}
                    </h3>
                    {p.code ? (
                      <p className="mt-0.5 text-[10px] font-medium tracking-[0.18em] uppercase text-ivory-2/50 truncate">
                        {p.code}
                      </p>
                    ) : null}
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="font-display text-[22px] font-bold tracking-wide text-bronze-grad">
                        {fmtEUR(p.price)}
                      </span>
                      <span className="text-[9.5px] tracking-[0.18em] uppercase text-ivory-2/50">ME TVSH</span>
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* butoni drejt katalogut */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="mt-12 flex justify-center"
        >
          <a
            href="#katalogu"
            className="group inline-flex items-center gap-2.5 rounded-full border border-bronze/40 bg-ink-2/60 px-7 py-3 text-[13px] font-bold tracking-[0.12em] uppercase text-bronze transition-all duration-300 hover:border-bronze hover:bg-bronze/10"
          >
            <Eyebrow>Shiko gjithë koleksionin</Eyebrow>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
