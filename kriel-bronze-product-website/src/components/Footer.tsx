import { ArrowUp, MessageCircle } from "lucide-react";
import { SITE, waLink } from "../data/catalog";

export default function Footer() {
  return (
    <>
      {/* Floating WhatsApp */}
      <a
        href={waLink("Përshëndetje Kriel! Dëshiroj informacion mbi produktet Caggiati.")}
        target="_blank"
        rel="noreferrer"
        aria-label="Na shkruani në WhatsApp"
        className="fixed bottom-5 right-5 z-[60] flex h-13 w-13 items-center justify-center rounded-full bg-bronze p-3.5 text-ink shadow-[0_10px_40px_rgba(201,163,92,0.45)] transition-transform hover:scale-110 sm:bottom-6 sm:right-6"
      >
        <MessageCircle size={22} strokeWidth={2.2} />
      </a>

      <footer className="relative border-t border-line bg-ink-2/60 pb-10 pt-14">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-8 sm:flex-row">
            <div className="max-w-sm">
              <div className="flex items-center gap-2.5">
                <span
                  className="font-display italic leading-none"
                  style={{
                    fontSize: 30,
                    background: "linear-gradient(120deg,#ecd9a8,#c9a35c 45%,#8a6434)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  K
                </span>
                <span className="text-[13px] font-extrabold uppercase tracking-[0.34em] text-ivory">
                  Kriel
                </span>
              </div>
              <p className="mt-4 text-[12.5px] font-light leading-relaxed text-ivory-2/65">
                Shpërndarës zyrtar i produkteve Caggiati në Shqipëri — statuja, kryqe, llampa dhe
                kompozime përkujtimore në bronz 87.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-14 gap-y-2.5 text-[12.5px]">
              <div className="flex flex-col gap-2.5">
                {[
                  ["Kreu", "#kreu"],
                  ["Kategoritë", "#kategorite"],
                  ["Katalogu", "#katalogu"],
                  ["Mjeshtëria", "#mjeshtria"],
                ].map(([l, h]) => (
                  <a key={h} href={h} className="font-light text-ivory-2/65 transition-colors hover:text-bronze">
                    {l}
                  </a>
                ))}
              </div>
              <div className="flex flex-col gap-2.5">
                {[
                  ["Rreth nesh", "#rreth"],
                  ["Kontakt", "#kontakt"],
                  ["Telefono", SITE.phoneHref],
                  ["Email", `mailto:${SITE.email}`],
                ].map(([l, h]) => (
                  <a key={h} href={h} className="font-light text-ivory-2/65 transition-colors hover:text-bronze">
                    {l}
                  </a>
                ))}
              </div>
            </div>

            <a
              href="#kreu"
              aria-label="Kthehu lart"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-ivory-2/60 transition-colors hover:border-bronze/50 hover:text-bronze"
            >
              <ArrowUp size={17} />
            </a>
          </div>

          <div className="mt-12 border-t border-line/60 pt-6">
            <p className="text-[10.5px] font-light leading-relaxed text-ivory-2/40">
              Të dhënat dhe fotografitë janë marrë nga katalogu zyrtar Caggiati. Çmimet janë
              orientuese, me TVSH të përfshirë.
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-ivory-2/45">
              <p>© {new Date().getFullYear()} Kriel shpk — Të gjitha të drejtat e rezervuara.</p>
              {/* Paneli i fshehtë i administratorit */}
              <a
                href="#kriel-admin"
                className="tracking-[0.14em] uppercase opacity-40 transition-opacity hover:text-bronze hover:opacity-100"
              >
                Paneli
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
