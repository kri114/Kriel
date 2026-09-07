import { Reveal, Eyebrow } from "./Reveal";

const MATERIALS = [
  {
    n: "Bronz i patinuar",
    d: "Nuanca të gjelbra dhe kafe antike, të punuara me dorë sipas traditës fiorentine.",
    sw: "linear-gradient(135deg,#6b5a3e 0%,#3e4a3a 45%,#7a6a45 100%)",
  },
  {
    n: "Bronz i artë (Lucido)",
    d: "Lustrim klasik me shkëlqim ari — eleganca e përjetshme e bronzit të pastër.",
    sw: "linear-gradient(135deg,#ecd9a8 0%,#c9a35c 45%,#8a6434 100%)",
  },
  {
    n: "Ar 24kt — I Preziosi",
    d: "Veshje e vërtetë ari 24 karat për koleksionin më ekskluziv të fonderisë.",
    sw: "linear-gradient(135deg,#f6e27a 0%,#d4af37 50%,#a67c00 100%)",
  },
  {
    n: "Porselan Capodimonte",
    d: "Lule porselani të modeluara petal pas petali nga artizanët e Napolit.",
    sw: "linear-gradient(135deg,#f2e9e4 0%,#c99a8f 50%,#8f5f57 100%)",
  },
  {
    n: "Mozaik qelqi",
    d: "Tessera veneziane me ngjyra të pashuara, të vendosura një nga një.",
    sw: "linear-gradient(135deg,#92400f 0%,#35507a 45%,#7c2d3e 100%)",
  },
  {
    n: "Çelik Inox",
    d: "Linjat më moderne dhe minimale për arkitekturën bashkëkohore.",
    sw: "linear-gradient(135deg,#e5e7eb 0%,#9ca3af 50%,#4b5563 100%)",
  },
];

export default function Materials() {
  return (
    <section className="relative py-20 sm:py-28 bg-ink-2/40">
      <div className="hairline absolute top-0 inset-x-6" />
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="text-center">
          <Reveal><Eyebrow>Ekselenca e materialit</Eyebrow></Reveal>
          <Reveal delay={0.08}>
            <h2 className="mt-4 font-display text-4xl sm:text-[52px] font-medium leading-[1.02] text-ivory">
              Materialet &amp; <em className="text-bronze-grad not-italic font-semibold">finitimet</em>
            </h2>
          </Reveal>
          <Reveal delay={0.14}>
            <p className="mx-auto mt-4 max-w-xl text-[14.5px] leading-relaxed text-ivory-2/80 font-light">
              Gama e plotë Caggiati — secili material zgjidhet për të përballuar
              dekadat në ambient të hapur, pa humbur asnjë pikë shkëlqimi.
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MATERIALS.map((m, i) => (
            <Reveal key={m.n} delay={(i % 3) * 0.08}>
              <div className="group relative h-full overflow-hidden rounded-[20px] border border-line bg-ink-2 p-6 transition-all duration-500 hover:border-bronze/45 hover:shadow-[0_18px_45px_rgba(0,0,0,0.5)]">
                <div
                  className="h-14 w-14 rounded-2xl border border-white/10 shadow-inner transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6"
                  style={{ background: m.sw }}
                />
                <h3 className="mt-4 font-display text-[22px] font-semibold text-ivory">{m.n}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ivory-2/75 font-light">{m.d}</p>
                <span className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-bronze/10 blur-2xl transition-opacity opacity-0 group-hover:opacity-100" />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
