import { useRef } from "react";
import { Logo } from "./Reveal";

export default function Footer() {
  // Hyrje sekrete rezervë: 5 prekje të shpejta mbi rreshtin e copyright-it
  const taps = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  const secretTap = () => {
    taps.current += 1;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => (taps.current = 0), 1200);
    if (taps.current >= 5) {
      taps.current = 0;
      window.dispatchEvent(new Event("kriel:open-admin"));
    }
  };

  return (
    <footer className="relative border-t border-line bg-ink-2/60 pb-28 lg:pb-10">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 pt-14">
        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-3">
              <Logo size={40} />
              <span>
                <span className="block font-display text-[24px] font-semibold tracking-[0.18em] text-ivory">KRIEL</span>
                <span className="block text-[9px] tracking-[0.42em] uppercase text-bronze/90">Arti i Bronzit</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-ivory-2/70 font-light">
              Shpërndarës zyrtar i produkteve Caggiati në Shqipëri — statuja, kryqe,
              llampa dhe kompozime përkujtimore në bronz 87.
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.28em] uppercase text-bronze/80">Navigim</p>
            <nav className="mt-4 grid grid-cols-2 gap-2.5 max-w-[260px]">
              {[
                ["#kreu", "Kreu"],
                ["#kategorite", "Kategoritë"],
                ["#katalogu", "Katalogu"],
                ["#mjeshtria", "Mjeshtëria"],
                ["#rreth", "Rreth nesh"],
                ["#kontakt", "Kontakt"],
              ].map(([href, label]) => (
                <a key={href} href={href} className="text-[13.5px] text-ivory-2/75 hover:text-bronze transition-colors">
                  {label}
                </a>
              ))}
            </nav>
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.28em] uppercase text-bronze/80">Informacion</p>
            <p className="mt-4 text-[12.5px] leading-relaxed text-ivory-2/65 font-light">
              Çmimet e publikuara janë orientuese dhe përfshijnë TVSH. Për konfirmim
              të disponueshmërisë, modele të tjera nga katalogu i plotë 2025 dhe
              porosi të personalizuara, na kontaktoni.
            </p>
          </div>
        </div>
        <div className="hairline mt-12" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-6">
          <p
            onClick={secretTap}
            className="text-[11px] tracking-[0.14em] text-ivory-2/50 uppercase select-none cursor-default"
          >
            © {new Date().getFullYear()} Kriel — Të gjitha të drejtat e rezervuara
          </p>
          <p className="text-[10.5px] text-ivory-2/40 tracking-wide text-center sm:text-right">
            Fotot e produkteve: katalogu zyrtar Caggiati® · Matthews International, Colorno (PR), Italia
          </p>
        </div>
      </div>
    </footer>
  );
}
