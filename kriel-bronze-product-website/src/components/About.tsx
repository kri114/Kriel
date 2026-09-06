import { BadgeCheck, Globe2, PackageCheck } from "lucide-react";
import Reveal from "./Reveal";

export default function About() {
  return (
    <section id="rreth" className="relative border-t border-line py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <div className="order-2 lg:order-1">
          <Reveal>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.3em] text-bronze/80">
              Rreth nesh
            </p>
            <h2 className="mt-3 font-display text-[36px] font-medium leading-[1.06] text-ivory sm:text-[48px]">
              Nga Parma, në <span className="text-bronze-grad">Shqipëri</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 text-[15px] font-light leading-relaxed text-ivory-2/85">
              Në zemër të Parmës, fonderia Caggiati — sot pjesë e Matthews International — është
              referenca europiane e artit përkujtimor në bronz. Kriel e sjell këtë trashëgimi në
              Shqipëri: çdo produkt vjen direkt nga katalogu zyrtar, me kode të gjurmueshme dhe
              certifikim origjine.
            </p>
          </Reveal>
          <Reveal delay={0.16}>
            <blockquote className="mt-7 border-l-2 border-bronze pl-5 font-display text-[22px] font-medium italic leading-snug text-ivory-2/90">
              “I japim vlerë emocioneve”
              <span className="mt-2 block font-sans text-[11px] font-normal not-italic uppercase tracking-[0.2em] text-ivory-2/50">
                — motoja e fonderisë që nga viti 1960
              </span>
            </blockquote>
          </Reveal>

          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            {[
              { Icon: BadgeCheck, t: "Certifikim origjine", d: "Çdo vepër me kod të gjurmueshëm nga fonderia." },
              { Icon: PackageCheck, t: "Direkt nga katalogu", d: "Modele zyrtare Caggiati 2025, pa ndërmjetës." },
              { Icon: Globe2, t: "E gjithë Evropa", d: "Porosi të personalizuara me transport të sigurt." },
            ].map(({ Icon, t, d }, i) => (
              <Reveal key={t} delay={0.2 + i * 0.07} className="h-full">
                <div className="h-full rounded-2xl border border-line bg-ink-2/60 p-4">
                  <span className="text-bronze">
                    <Icon size={18} strokeWidth={1.9} />
                  </span>
                  <h3 className="mt-2.5 font-display text-[17px] font-semibold leading-snug text-ivory">
                    {t}
                  </h3>
                  <p className="mt-1 text-[11.5px] font-light leading-relaxed text-ivory-2/65">
                    {d}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={0.08} className="order-1 lg:order-2">
          <div className="relative mx-auto max-w-md lg:max-w-none">
            <div className="overflow-hidden rounded-[28px] border border-line">
              <img
                src="/images/still.jpg"
                alt="Detaje bronzi Caggiati"
                loading="lazy"
                className="h-[340px] w-full object-cover sm:h-[460px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-6 left-6 rounded-2xl border border-bronze/25 bg-ink-2/95 px-6 py-4 backdrop-blur-md">
              <p className="font-display text-[24px] font-semibold leading-none text-bronze-grad">
                Bronz 87
              </p>
              <p className="mt-1 text-[9.5px] uppercase tracking-[0.2em] text-ivory-2/60">
                alysja origjinale e fonderisë
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
