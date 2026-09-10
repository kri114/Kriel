"use client";

import { useEffect, useState } from "react";
import Site from "./Site";
import { FALLBACK_CATALOG } from "@/lib/fallback-data";
import { isBackendConfigured } from "@/lib/supabase";
import { fetchCategories, fetchProducts, fetchVariants } from "@/lib/store";
import type { Category, Product, ProductVariant } from "@/lib/types";

type Catalog = { categories: Category[]; products: Product[]; variants: ProductVariant[] };

/**
 * Public catalog loader.
 *
 * The exported page is a static HTML shell. When the Supabase backend is
 * configured, the live catalog (including every admin edit) is fetched in
 * the browser at runtime — so changes appear instantly with no rebuild.
 * Without a backend (local preview), the bundled default catalog is shown.
 */
export default function SiteLoader() {
  const [catalog, setCatalog] = useState<Catalog | null>(
    isBackendConfigured() ? null : FALLBACK_CATALOG
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isBackendConfigured()) return;
    let cancelled = false;

    (async () => {
      try {
        // Categories + products are the real catalog — if either fails
        // (bad Supabase URL/key, network down, etc.) we genuinely have no
        // live data and must fall back to the bundled placeholder catalog.
        const [categories, products] = await Promise.all([
          fetchCategories(),
          fetchProducts({ onlyActive: true }),
        ]);

        // Variants (color/size options) are an optional enhancement. If
        // fetching them fails for any unexpected reason beyond what
        // fetchVariants() already tolerates internally, don't let it wipe
        // out the real, successfully-loaded catalog — just show the
        // catalog without variant selectors.
        let variants: ProductVariant[] = [];
        try {
          variants = await fetchVariants();
        } catch (err) {
          console.error("Variants load failed — continuing without color/size options", err);
        }

        if (!cancelled) setCatalog({ categories, products, variants });
      } catch (err) {
        console.error("Catalog load failed", err);
        if (!cancelled) {
          setCatalog(FALLBACK_CATALOG);
          setFailed(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!catalog) {
    return (
      <div className="grain min-h-screen bg-ink text-ivory flex flex-col items-center justify-center gap-5">
        <p className="font-display text-4xl font-semibold text-bronze-grad tracking-wide">KRIEL</p>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-bronze animate-pulse" />
          <span className="w-1.5 h-1.5 rounded-full bg-bronze animate-pulse [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-bronze animate-pulse [animation-delay:300ms]" />
        </div>
        <p className="text-[11px] tracking-[0.3em] uppercase text-ivory-2/60">Arti i Bronzit</p>
      </div>
    );
  }

  return (
    <>
      {failed && (
        <div className="fixed top-3 inset-x-0 z-[80] mx-auto w-fit rounded-full border border-bronze/40 bg-ink/90 px-4 py-1.5 text-[11.5px] text-ivory-2">
          Katalogu live nuk u ngarkua — po shfaqet versioni bazë.
        </div>
      )}
      <Site categories={catalog.categories} products={catalog.products} variants={catalog.variants} />
    </>
  );
}
