"use client";

import { useMemo } from "react";
import { Reveal, Eyebrow } from "./Reveal";
import ProductCard from "./ProductCard";
import type { Product } from "@/lib/types";

/**
 * "Oferta" — sale/deals section shown to visitors.
 *
 * Fully self-hiding: if no active product currently has a discount set
 * (product.discountPercent > 0), this component renders nothing at all —
 * no empty section, no heading, nothing in the DOM.
 */
export default function Deals({
  products,
  onOpen,
}: {
  products: Product[];
  onOpen: (p: Product) => void;
}) {
  const deals = useMemo(
    () =>
      products
        .filter((p) => p.active && p.discountPercent && p.discountPercent > 0)
        .sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0)),
    [products]
  );

  if (deals.length === 0) return null;

  return (
    <section id="oferta" className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="text-center">
          <Reveal><Eyebrow>Kohë e kufizuar</Eyebrow></Reveal>
          <Reveal delay={0.08}>
            <h2 className="mt-4 font-display text-4xl sm:text-[48px] font-medium leading-[1.02] text-ivory">
              Oferta <em className="text-bronze-grad not-italic font-semibold">speciale</em>
            </h2>
          </Reveal>
          <Reveal delay={0.14}>
            <p className="mx-auto mt-4 max-w-lg text-[14.5px] leading-relaxed text-ivory-2/80 font-light">
              Produkte të zgjedhura me çmim të ulur — për kohë të kufizuar.
            </p>
          </Reveal>
        </div>

        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
          {deals.map((p, i) => (
            <Reveal key={p.id} delay={0.06 * (i % 4)}>
              <ProductCard product={p} onOpen={onOpen} index={i} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
