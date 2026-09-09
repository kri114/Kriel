import { Reveal, Eyebrow } from "./Reveal";

export default function About() {
  return (
    <section id="rreth" className="relative py-20 sm:py-28 bg-ink-2/40">
      <div className="hairline absolute top-0 inset-x-6" />
      <div className="mx-auto max-w-4xl px-5 sm:px-6 text-center">
        <Reveal><Eyebrow>Rreth nesh</Eyebrow></Reveal>
        <Reveal delay={0.08}>
          <h2 className="mt-4 font-display text-4xl sm:text-[52px] font-medium leading-[1.05] text-ivory">
            KRIEL — kujdes, respekt <br />
            dhe <em className="text-bronze-grad not-italic font-semibold">mjeshtëri</em> në çdo kujtim
          </h2>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="mt-6 text-[15px] leading-relaxed text-ivory-2/85 font-light max-w-2xl mx-auto">
            Jemi një ekip i përkushtuar që sjell krijime origjinale në bronz për kujtim dhe
            përkujtim — statuja, kryqe, korniza, lule, vazo, targa dhe gërma të personalizuara.
            Çdo produkt zgjidhet dhe kontrollohet me kujdes, për t&apos;i dhënë familjes tuaj një
            simbol dinjitoz dhe të qëndrueshëm në kohë. Ne jemi më të mirët në treg për punimin e:
    "Aksesorë Bronzi",
    "Artikuj Bronzi",
    "Aksesorë për varre",
    "Artikuj për varre",
    "Gërma për varre",
    "Korniza për varre",
    "Kryqe për varre",
    "Vend qiriu",
    "Vazo lulesh",
    "Materiale mermeri dhe graniti",
    "Ngjitës mermeri dhe graniti",
    "Gur lucidimi mermer granit",
    "Disk mermer granit".
          </p>
        </Reveal>
      </div>
    </section>
  );
}
