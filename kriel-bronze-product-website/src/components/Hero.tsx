import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, MapPin } from "lucide-react";
import { useRef } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  return (
    <section id="kreu" ref={ref} className="relative flex min-h-[100svh] flex-col overflow-hidden">
      <motion.div style={{ y, scale }} className="absolute inset-0">
        <img
          src="/images/hero.jpg"
          alt="Trëndafil bronzi Caggiati"
          className="h-full w-full object-cover object-center brightness-[1.1] saturate-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/78 via-ink/38 to-ink" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/55 via-transparent to-ink/35" />
      </motion.div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-5 pb-10 pt-32 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.9, ease: EASE }}
          className="inline-flex items-center gap-2.5 self-start rounded-full border border-bronze/35 bg-ink/45 px-4 py-2 backdrop-blur-md"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-bronze" />
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.26em] text-ivory-2 sm:text-[11.5px]">
            Shpërndarës zyrtar <span className="text-bronze">Caggiati</span> · Colorno, Itali
          </span>
        </motion.div>

        <h1 className="mt-6 max-w-3xl font-display text-[13.5vw] font-medium leading-[0.98] tracking-[-0.01em] text-ivory sm:text-7xl lg:text-[86px]">
          {["Arti i bronzit", "që i bën nder"].map((line, i) => (
            <span key={line} className="block overflow-hidden">
              <motion.span
                className="block"
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ delay: 0.35 + i * 0.13, duration: 1.05, ease: EASE }}
              >
                {line === "që i bën nder" ? (
                  <>
                    I japim vlerë{" "}
                    <em className="text-bronze-grad not-italic font-semibold">emocioneve</em> tuaja.
                  </>
                ) : (
                  line
                )}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.9, ease: EASE }}
          className="mt-5 max-w-xl text-[15px] font-light leading-relaxed text-ivory-2/85 sm:text-[16.5px]"
        >
          Statuja, kryqe, llampa dhe kompozime përkujtimore origjinale nga fonderia Caggiati —
          mjeshtëri italiane që ruan historitë e të dashurve tuaj, bukuri që i bën ballë kohës.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.9, ease: EASE }}
          className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
        >
          <a
            href="#katalogu"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-bronze px-7 py-3.5 text-[12px] font-bold uppercase tracking-[0.16em] text-ink shadow-[0_10px_40px_rgba(201,163,92,0.35)] transition-all hover:shadow-[0_14px_50px_rgba(201,163,92,0.5)]"
          >
            Shiko katalogun
            <ArrowDown size={15} strokeWidth={2.6} />
          </a>
          <a
            href="#kontakt"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-ivory-2/25 px-7 py-3.5 text-[12px] font-bold uppercase tracking-[0.16em] text-ivory-2 transition-all hover:border-bronze/60 hover:text-bronze"
          >
            Na kontaktoni
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.15, duration: 1 }}
          className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-line/60 pt-6 text-ivory-2/60"
        >
          {[
            ["60+", "vjet trashëgimi fonderie"],
            ["150+", "produkte në katalog 2025"],
            ["87", "alisja e bronzit Caggiati"],
          ].map(([n, l]) => (
            <div key={l} className="flex items-baseline gap-2">
              <span className="font-display text-[26px] font-semibold text-bronze-grad">{n}</span>
              <span className="text-[10.5px] uppercase tracking-[0.18em]">{l}</span>
            </div>
          ))}
          <div className="ml-auto hidden items-center gap-1.5 text-[10.5px] uppercase tracking-[0.18em] sm:flex">
            <MapPin size={12} className="text-bronze/70" /> Colorno, Parma → Shqipëri
          </div>
        </motion.div>
      </div>
    </section>
  );
}
