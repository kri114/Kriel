"use client";

import { useEffect, useState } from "react";
import Site from "./Site";
import { getCategories, getProducts, isSupabaseConfigured } from "@/lib/api";
import type { Category, Product } from "@/lib/types";

/**
 * Renders the site with the catalogue that was baked in at build time, then
 * refreshes it from Supabase in the browser so that any change made in the
 * admin panel shows up on the public site immediately (no redeploy needed).
 */
export default function LiveCatalog({
  initialCategories,
  initialProducts,
}: {
  initialCategories: Category[];
  initialProducts: Product[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [products, setProducts] = useState(initialProducts);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    (async () => {
      try {
        const [cats, prods] = await Promise.all([getCategories(), getProducts({ onlyActive: true })]);
        if (!cancelled) {
          setCategories(cats);
          setProducts(prods);
        }
      } catch (err) {
        console.warn("[kriel] Live catalogue refresh failed, showing build-time data.", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <Site categories={categories} products={products} />;
}
