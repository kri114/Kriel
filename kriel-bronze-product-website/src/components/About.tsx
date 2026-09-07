import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { MapPin, CalendarDays, Globe2 } from "lucide-react";
import { Reveal, Eyebrow } from "./Reveal";

export default function About() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);

  return (
    <section id="rreth" ref={ref} className="relative overflow-hidden">
      <motion.div style={{ y }} className="absolute inset-0 scale-125">
        <img src="/images/still.jpg" alt="Kompozim bronzi me qiri" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-ink/80" />
      </motion.div>

      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6 py-24 sm:py-36">
        <div className="max-w-3xl">
          <Reveal><Eyebrow>Partneri ynë italian</Eyebrow></Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-5 font-display text-4xl sm:text-6xl font-medium leading-[1.05] text-ivory">
              Caggiati — <em className="text-bronze-grad not-italic font-semibold">“Diamo valore<br className="sm:hidden" /> alle emozioni”</em>
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-3 font-display italic text-[19px] text-bronze/90">
              — “I japim vlerë emocioneve”, motoja e fonderisë që nga viti 1960.
            </p>
          </Reveal>
          <Reveal delay={0.22}>
            <p className="mt-6 text-[15px] leading-relaxed text-ivory-2/90 font-light">
              Në zemër të Parmës, fonderia Caggiati — sot pjesë e Matthews International —
              është referenca europiane e artit përkujtimor në bronz. Kriel e sjell këtë
              trashëgimi në Shqipëri: çdo produkt vjen direkt nga katalogu zyrtar,
              me kode të gjurmueshme dhe certifikim origjine.
            </p>
          </Reveal>

          <Reveal delay={0.28}>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: CalendarDays, k: "Që nga", v: "Viti 1960" },
                { icon: MapPin, k: "Selia", v: "Colorno, Parma" },
                { icon: Globe2, k: "Praninë", v: "E gjithë Evropa" },
              ].map((s) => (
                <div key={s.k} className="rounded-2xl border border-bronze/25 bg-ink/55 backdrop-blur-md px-5 py-4">
                  <s.icon size={17} className="text-bronze" strokeWidth={1.8} />
                  <p className="mt-2.5 text-[10px] tracking-[0.24em] uppercase text-ivory-2/60">{s.k}</p>
                  <p className="mt-1 font-display text-[21px] font-semibold text-ivory">{s.v}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
