import { Droplets, Flame, Hand, ShieldCheck } from "lucide-react";
import Reveal from "./Reveal";

const ITEMS = [
  {
    icon: Flame,
    t: "Farkëtim me dyll të humbur",
    d: "Teknika mijëravjeçare që lejon detaje të jashtëzakonshme në çdo statujë e reliev.",
  },
  {
    icon: Droplets,
    t: "Alysja Bronz 87",
    d: "Përbërje e pasur me bakër që garanton shkëlqim të ngrohtë dhe jetëgjatësi maksimale.",
  },
  {
    icon: ShieldCheck,
    t: "Finitimi Diamond Shield",
    d: "Shtresë mbrojtëse transparente që e ruan bronzin e paprekur nga moti e vitet.",
  },
  {
    icon: Hand,
    t: "Punim manual i patinës",
    d: "Çdo patinë artistike aplikohet me dorë nga mjeshtër — asnjë vepër nuk është identike.",
  },
];

export default function Craft() {
  return (
    <section id="mjeshtria" className="relative overflow-hidden border-t border-line py-20 sm:py-28">
      <span className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-bronze/8 blur-3xl" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <Reveal className="relative">
          <div className="relative overflow-hidden rounded-[28px] border border-line">
            <img
              src="/images/atelier.jpg"
              alt="Farkëtimi i bronzit në fonderi"
              loading="lazy"
              className="h-[380px] w-full object-cover sm:h-[520px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
            <p className="absolute bottom-5 left-5 right-5 text-[10.5px] uppercase tracking-[0.24em] text-ivory-2/80">
              Farkëtimi i bronzit në fonderi · Colorno, Parma
            </p>
          </div>
          <div className="floaty absolute -bottom-5 -right-3 hidden rounded-2xl border border-bronze/30 bg-ink-2/95 px-5 py-4 backdrop-blur-md sm:block">
            <p className="font-display text-[24px] font-semibold leading-none text-bronze-grad">1960</p>
            <p className="mt-1 text-[9.5px] uppercase tracking-[0.2em] text-ivory-2/60">
              viti i themelimit
            </p>
          </div>
        </Reveal>

        <div>
          <Reveal>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.3em] text-bronze/80">
              Art & Mjeshtëri
            </p>
            <h2 className="mt-3 font-display text-[36px] font-medium leading-[1.06] text-ivory sm:text-[48px]">
              Mjeshtëria që i bën ballë <span className="text-bronze-grad">kohës</span>
            </h2>
            <p className="mt-5 max-w-lg text-[15px] font-light leading-relaxed text-ivory-2/85">
              Prej më shumë se 60 vjetësh, fonderia Caggiati në Parma shkrin bronz 87 me të njëjtën
              pasion: çdo vepër kalon nëpër duart e mjeshtrave — nga modelet e gdhendura te patina
              finale — për t'i dhënë kujtimit një formë të përjetshme.
            </p>
          </Reveal>

          <div className="mt-9 grid gap-5 sm:grid-cols-2">
            {ITEMS.map((it, i) => (
              <Reveal key={it.t} delay={0.12 + i * 0.07} className="h-full">
                <div className="group h-full rounded-2xl border border-line bg-ink-2/70 p-5 transition-all duration-500 hover:border-bronze/45 hover:bg-ink-3/60">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-bronze/30 bg-bronze/10 text-bronze transition-transform duration-500 group-hover:rotate-6">
                    <it.icon size={17} strokeWidth={1.9} />
                  </span>
                  <h3 className="mt-4 font-display text-[19px] font-semibold leading-snug text-ivory">
                    {it.t}
                  </h3>
                  <p className="mt-1.5 text-[12.5px] font-light leading-relaxed text-ivory-2/70">
                    {it.d}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
