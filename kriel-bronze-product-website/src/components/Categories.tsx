import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { CATEGORIES, CATEGORY_TO_GROUP } from "../data/catalog";
import Reveal from "./Reveal";

export default function Categories({ onPick }: { onPick: (groupId: string) => void }) {
  return (
    <section id="kategorite" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <Reveal>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.3em] text-bronze/80">
            Kategoritë e plotësisë
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-[38px] font-medium leading-[1.05] text-ivory sm:text-[52px]">
            E gjithë gama <span className="text-bronze-grad">Caggiati</span>
          </h2>
          <p className="mt-4 max-w-xl text-[14.5px] font-light leading-relaxed text-ivory-2/75">
            E gjithë gama Caggiati e organizuar sipas llojit — nga statujat monumentale te detajet
            më të vogla të bronzit.
          </p>
        </Reveal>
      </div>

      <div className="mt-10 sm:px-[max(1.5rem,calc((100vw_-_72rem)/2_+_1.5rem))]">
        <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:px-0">
          {CATEGORIES.map((c, i) => (
            <motion.button
              key={c.id}
              onClick={() => onPick(CATEGORY_TO_GROUP[c.id] ?? c.id)}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-4% 0px" }}
              transition={{ duration: 0.6, delay: Math.min(i, 5) * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="group relative w-[228px] shrink-0 snap-start overflow-hidden rounded-2xl border border-line text-left transition-all duration-500 hover:border-bronze/50 hover:shadow-[0_18px_50px_rgba(0,0,0,0.5)] sm:w-[264px]"
            >
              <div className="relative h-[300px] overflow-hidden sm:h-[340px]">
                <img
                  src={c.cover}
                  alt={c.name}
                  loading="lazy"
                  className="card-img h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent" />
                <span className="absolute left-4 top-4 rounded-full border border-ivory-2/20 bg-ink/55 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.22em] text-ivory-2/80 backdrop-blur-sm">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="absolute bottom-4 right-4 flex h-9 w-9 translate-y-1 items-center justify-center rounded-full bg-bronze text-ink opacity-0 transition-all duration-400 group-hover:translate-y-0 group-hover:opacity-100">
                  <ArrowUpRight size={16} strokeWidth={2.4} />
                </span>
                <div className="absolute bottom-4 left-4">
                  <h3 className="font-display text-[24px] font-semibold leading-tight text-ivory">
                    {c.name}
                  </h3>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-ivory-2/55">
                    Bronz 87 · Caggiati
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
