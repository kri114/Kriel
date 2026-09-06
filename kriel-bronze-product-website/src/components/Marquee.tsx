import { MARQUEE } from "../data/catalog";

export default function Marquee() {
  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center">
      {MARQUEE.map((t) => (
        <span key={key + t} className="flex items-center">
          <span className="px-7 font-display text-[17px] italic tracking-wide text-ivory-2/65">
            {t}
          </span>
          <span className="text-[10px] text-bronze/40">✦</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="relative overflow-hidden border-y border-line bg-ink-2/70 py-4">
      <div className="marquee-track">
        {row("a")}
        {row("b")}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-ink to-transparent" />
    </div>
  );
}
