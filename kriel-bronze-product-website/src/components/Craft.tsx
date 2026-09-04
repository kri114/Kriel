import { Flame, ShieldCheck, Gem, HandMetal } from "lucide-react";
import { Reveal, Eyebrow } from "./Reveal";

const FEATURES = [
  {
    icon: Flame,
    t: "Farkëtim me dyll të humbur",
    d: "Teknika mijëravjeçare që lejon detaje të jashtëzakonshme në çdo statujë e reliev.",
  },
  {
    icon: Gem,
    t: "Alysja Bronz 87",
    d: "Përbërje e pasur me bakër që garanton shkëlqim të ngrohtë dhe jetëgjatësi maksimale.",
  },
  {
    icon: ShieldCheck,
    t: "Finitimi Diamond Shield",
    d: "Shtresë mbrojtëse transparente që e ruan bronzin e paprekur nga moti e vitet.",
  },
  {
    icon: HandMetal,
    t: "Punim manual i patinës",
    d: "Çdo patinë artistike aplikohet me dorë nga mjeshtër — asnjë vepër nuk është identike.",
  },
];

export default function Craft() {
  return (
    <section id="mjeshtria" className="relative py-20 sm:py-28 overflow-hidden">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* image */}
        <Reveal className="relative">
          <div className="relative overflow-hidden rounded-[26px] border border-line">
            <img src="/images/atelier.jpg" alt="Farkëtimi i bronzit në fonderi" className="h-[380px] sm:h-[520px] w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-ink/20" />
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-bronze/25 bg-ink/70 backdrop-blur-md px-5 py-4">
              <p className="font-display italic text-[19px] leading-snug text-ivory">
                “Zjarri shekullor që transformon metalin në kujtim.”
              </p>
              <p className="mt-1.5 text-[10.5px] tracking-[0.26em] uppercase text-bronze">Fonderia Caggiati · Colorno, Parma</p>
            </div>
          </div>
          <div className="pointer-events-none absolute -top-8 -left-8 h-36 w-36 rounded-full border border-bronze/20 spin-slow" />
        </Reveal>

        {/* copy */}
        <div>
          <Reveal><Eyebrow>Mjeshtëria</Eyebrow></Reveal>
          <Reveal delay={0.08}>
            <h2 className="mt-4 font-display text-4xl sm:text-[48px] font-medium leading-[1.05] text-ivory">
              Lindur nga zjarri, <br />
              <em className="text-bronze-grad not-italic font-semibold">punuar nga dora</em>
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-5 text-[15px] leading-relaxed text-ivory-2/85 font-light max-w-lg">
              Prej më shumë se 60 vjetësh, fonderia Caggiati në Parma shkrin bronz 87
              me të njëjtën pasion: çdo vepër kalon nëpër duart e mjeshtrave —
              nga modelet e gdhendura te patina finale — për t'i dhënë kujtimit
              një formë të përjetshme.
            </p>
          </Reveal>
          <div className="mt-9 grid sm:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => (
              <Reveal key={f.t} delay={0.18 + i * 0.07}>
                <div className="group h-full rounded-2xl border border-line bg-ink-2/70 p-5 transition-colors duration-500 hover:border-bronze/40">
                  <span className="inline-flex w-10 h-10 items-center justify-center rounded-xl bg-gradient-to-br from-bronze/25 to-transparent border border-bronze/30 text-bronze">
                    <f.icon size={18} strokeWidth={1.8} />
                  </span>
                  <h3 className="mt-3.5 font-display text-[19px] font-semibold text-ivory leading-tight">{f.t}</h3>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-ivory-2/75 font-light">{f.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
