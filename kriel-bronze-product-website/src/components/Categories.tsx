import { useMemo, useRef } from "react";
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { CATEGORIES, Product } from "../data/catalogue";
import { Reveal, Eyebrow } from "./Reveal";

export default function Categories({ onPick, products }: { onPick: (cat: string) => void; products: Product[] }) {
  const rail = useRef<HTMLDivElement>(null);
  const { counts, covers } = useMemo(() => {
    const c: Record<string, number> = {};
    const cov: Record<string, string> = {};
    products.forEach((p) => {
      c[p.cat] = (c[p.cat] || 0) + 1;
      if (!cov[p.cat]) cov[p.cat] = p.img;
    });
    return { counts: c, covers: cov };
  }, [products]);

  const scrollBy = (dir: number) => {
    rail.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  return (
    <section id="kategorite" className="relative py-20 sm:py-28 overflow-hidden">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="flex items-end justify-between gap-6">
          <div>
            <Reveal><Eyebrow>Katalogu ynë</Eyebrow></Reveal>
            <Reveal delay={0.08}>
              <h2 className="mt-4 font-display text-4xl sm:text-[52px] font-medium leading-[1.02] text-ivory">
                Kategoritë e <em className="text-bronze-grad not-italic font-semibold">produkteve</em>
              </h2>
            </Reveal>
            <Reveal delay={0.14}>
              <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-ivory-2/80 font-light">
                E gjithë gama Caggiati e organizuar sipas llojit — nga statujat
                monumentale te detajet më të vogla të bronzit.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.2} className="hidden sm:flex gap-2 shrink-0">
            <button
              onClick={() => scrollBy(-1)}
              className="w-11 h-11 rounded-full border border-line flex items-center justify-center text-ivory-2 hover:text-bronze hover:border-bronze/50 transition-colors"
              aria-label="Më parë"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scrollBy(1)}
              className="w-11 h-11 rounded-full border border-line flex items-center justify-center text-ivory-2 hover:text-bronze hover:border-bronze/50 transition-colors"
              aria-label="Më tej"
            >
              <ChevronRight size={18} />
            </button>
          </Reveal>
        </div>
      </div>

      <Reveal delay={0.18}>
        <div
          ref={rail}
          className="no-scrollbar mt-10 flex gap-4 overflow-x-auto snap-x snap-mandatory px-5 sm:px-[max(1.5rem,calc((100vw_-_72rem)/2_+_1.5rem))] pb-2"
        >
          {CATEGORIES.map((c, i) => (
            <button
              key={c.id}
              onClick={() => onPick(c.id)}
              className="group relative w-[228px] sm:w-[264px] shrink-0 snap-start overflow-hidden rounded-[22px] border border-line bg-ink-2 text-left transition-all duration-500 hover:border-bronze/45 hover:shadow-[0_18px_50px_rgba(0,0,0,0.5)]"
            >
              <div className="relative h-[210px] sm:h-[240px] overflow-hidden bg-[#cfc8bb]">
                <img
                  src={covers[c.id] || c.cover}
                  alt={c.name}
                  loading="lazy"
                  className="card-img h-full w-full object-contain object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-transparent to-transparent" />
                <span className="absolute top-3.5 left-3.5 rounded-full bg-ink/60 backdrop-blur-sm border border-bronze/30 px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-bronze uppercase">
                  {counts[c.id] || 0} produkte
                </span>
                <span className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-bronze text-ink flex items-center justify-center opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-400">
                  <ArrowUpRight size={15} strokeWidth={2.4} />
                </span>
              </div>
              <div className="p-4.5 px-5 py-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-[20px] font-semibold text-ivory leading-tight">
                    <span className="text-bronze/60 text-[13px] align-top mr-1.5">{String(i + 1).padStart(2, "0")}</span>
                    {c.name}
                  </h3>
                </div>
                <span className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.18em] uppercase text-bronze/80 group-hover:text-bronze transition-colors">
                  Shiko serinë <ArrowRight size={12} strokeWidth={2.4} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
