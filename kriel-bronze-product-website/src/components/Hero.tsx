"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowDown, Award, ShieldCheck, Landmark } from "lucide-react";

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  return (
    <section id="kreu" ref={ref} className="relative min-h-[100svh] flex flex-col overflow-hidden">
      {/* background */}
      <motion.div style={{ y: yBg, scale }} className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero.jpg"
          alt="Trëndafil bronzi Caggiati"
          className="h-full w-full object-cover object-center brightness-[1.1] saturate-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/78 via-ink/38 to-ink" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/55 via-transparent to-ink/35" />
      </motion.div>

      {/* content */}
      <motion.div style={{ opacity }} className="relative z-10 flex-1 flex flex-col justify-end mx-auto w-full max-w-6xl px-5 sm:px-6 pb-10 pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2.5 self-start rounded-full border border-bronze/35 bg-ink/45 backdrop-blur-md px-4 py-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-bronze animate-pulse" />
          <span className="text-[10.5px] sm:text-[11.5px] font-semibold tracking-[0.26em] uppercase text-ivory-2">
            Shpërndarës zyrtar <span className="text-bronze">Caggiati</span> · Parma, Itali
          </span>
        </motion.div>

        <h1 className="mt-6 font-display font-medium text-ivory text-[13.5vw] sm:text-7xl lg:text-[86px] leading-[0.98] tracking-[-0.01em] max-w-3xl">
          {["Arti i bronzit", "që i bën nder"].map((line, i) => (
            <span key={line} className="block overflow-hidden">
              <motion.span
                className="block"
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ delay: 0.35 + i * 0.13, duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
              >
                {line === "që i bën nder" ? (
                  <>
                    që i bën nder <em className="text-bronze-grad not-italic font-semibold">kujtimit</em>.
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
          transition={{ delay: 0.75, duration: 0.9 }}
          className="mt-5 max-w-xl text-[15px] sm:text-[16.5px] leading-relaxed text-ivory-2/90 font-light"
        >
          Statuja, kryqe, llampa dhe kompozime përkujtimore origjinale nga fonderia
          Caggiati — mjeshtëri italiane që ruajt historitë e të dashurve tuaj, bukuri
          që i bën ballë kohës.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.9 }}
          className="mt-8 flex flex-wrap items-center gap-3"
        >
          <a
            href="#katalogu"
            className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#ecd9a8] via-bronze to-bronze-2 px-7 py-3.5 text-ink font-bold text-[14.5px] tracking-wide shadow-[0_10px_40px_rgba(201,163,92,0.35)] hover:shadow-[0_14px_50px_rgba(201,163,92,0.5)] transition-shadow"
          >
            Shfleto katalogun
            <ArrowDown size={16} strokeWidth={2.5} className="transition-transform group-hover:translate-y-0.5" />
          </a>
          <a
            href="#kontakt"
            className="inline-flex items-center rounded-full border border-ivory/25 bg-ink/30 backdrop-blur-sm px-7 py-3.5 text-[14.5px] font-semibold text-ivory hover:border-bronze/60 hover:text-bronze transition-colors"
          >
            Na kontaktoni
          </a>
        </motion.div>

        {/* stats */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05, duration: 1 }}
          className="mt-12 grid grid-cols-3 divide-x divide-line border-y border-line/70"
        >
          {[
            { icon: Award, n: "60+", t: "vjet tradicioni italiane" },
            { icon: Landmark, n: "150+", t: "produkte origjinale" },
            { icon: ShieldCheck, n: "Bronz 87", t: "garanci për përjetësi" },
          ].map((s) => (
            <div key={s.t} className="px-4 sm:px-6 py-5 sm:py-6">
              <s.icon size={18} className="text-bronze" strokeWidth={1.8} />
              <p className="mt-2 font-display text-[24px] sm:text-[30px] font-semibold text-ivory leading-none">{s.n}</p>
              <p className="mt-1.5 text-[9.5px] sm:text-[10.5px] tracking-[0.2em] uppercase text-ivory-2/60">{s.t}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
