import { Reveal, Eyebrow } from "./Reveal";

const MATERIALS = [
  {
    n: "Bronz i patinuar",
    d: "Nuanca të gjelbra dhe kafe antike, të punuara me dorë sipas traditës klasike.",
    sw: "linear-gradient(135deg,#6b5a3e 0%,#3e4a3a 45%,#7a6a45 100%)",
  },
  {
    n: "Bronz i artë (Lucido)",
    d: "Lustrim klasik me shkëlqim ari — eleganca e përjetshme e bronzit të pastër.",
    sw: "linear-gradient(135deg,#ecd9a8 0%,#c9a35c 45%,#8a6434 100%)",
  },
  {
    n: "Finitim i errët",
    d: "Nuancë e thellë, moderne, që përshtatet me kompozime minimaliste.",
    sw: "linear-gradient(135deg,#2b2620 0%,#463c2c 50%,#6b5a3e 100%)",
  },
];

export default function Materials() {
  return (
    <section className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="text-center">
          <Reveal><Eyebrow>Materialet</Eyebrow></Reveal>
          <Reveal delay={0.08}>
            <h2 className="mt-4 font-display text-4xl sm:text-[48px] font-medium leading-[1.02] text-ivory">
              Nuanca dhe <em className="text-bronze-grad not-italic font-semibold">finitime</em>
            </h2>
          </Reveal>
        </div>
        <div className="mt-10 grid sm:grid-cols-3 gap-5">
          {MATERIALS.map((m, i) => (
            <Reveal key={m.n} delay={0.1 + i * 0.08}>
              <div className="rounded-2xl border border-line bg-ink-2/70 overflow-hidden">
                <div className="h-28" style={{ background: m.sw }} />
                <div className="p-5">
                  <h3 className="font-display text-[19px] font-semibold text-ivory">{m.n}</h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-ivory-2/75 font-light">{m.d}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
