const ITEMS = [
  "Origjinal Caggiati®",
  "Bronz 87",
  "Made in Italy",
  "Farkëtim me dyll të humbur",
  "Finitim Diamond Shield",
  "Katalog 2025",
  "Art & Mjeshtëri",
];

export default function Marquee() {
  const row = (
    <div className="flex shrink-0 items-center">
      {ITEMS.map((t) => (
        <span key={t} className="flex items-center">
          <span className="font-display italic text-[17px] sm:text-[19px] text-bronze/90 whitespace-nowrap px-7">
            {t}
          </span>
          <span className="text-bronze/40 text-[10px]">✦</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="relative border-y border-line bg-ink-2/70 py-4 overflow-hidden">
      <div className="marquee-track">
        {row}
        {row}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-ink to-transparent" />
    </div>
  );
}
