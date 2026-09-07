/**
 * Build-time data loading for the static export.
 *
 * `next build` runs the server components once and bakes the result into
 * static HTML. We fetch the live catalogue from Supabase here so the exported
 * page already contains the current products (good for SEO / first paint);
 * the browser then re-fetches via <LiveCatalog> so admin changes appear
 * immediately without a rebuild.
 */
import { getCategories as fetchCategories, getProducts as fetchProducts } from "./api";
import { SEED_CATEGORIES, SEED_PRODUCTS } from "./seed-data";
import type { Category, Product } from "./types";

export async function getCategories(): Promise<Category[]> {
  try {
    return await fetchCategories();
  } catch (err) {
    console.warn("[kriel] Could not load categories at build time, using seed data:", err);
    return SEED_CATEGORIES;
  }
}

export async function getProducts(options?: { onlyActive?: boolean }): Promise<Product[]> {
  try {
    return await fetchProducts(options);
  } catch (err) {
    console.warn("[kriel] Could not load products at build time, using seed data:", err);
    return options?.onlyActive ? SEED_PRODUCTS.filter((p) => p.active) : SEED_PRODUCTS;
  }
}
