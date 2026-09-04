import { Product } from "../data/catalogue";

export type ProductOverride = {
  key: string;
  name?: string;
  code?: string;
  price?: number;
  img?: string;
};

export const OVERRIDES_STORAGE_KEY = "kriel-product-overrides-v1";

export function productKey(product: Product) {
  return `${product.id}|${product.img}`;
}

export function mergeOverrides(products: Product[], overrides: ProductOverride[]) {
  const byKey = new Map(overrides.map((item) => [item.key, item]));
  return products.map((product) => {
    const override = byKey.get(productKey(product));
    if (!override) return product;
    return {
      ...product,
      name: override.name?.trim() || product.name,
      code: override.code?.trim() || product.code,
      price: typeof override.price === "number" ? override.price : product.price,
      img: override.img?.trim() || product.img,
    };
  });
}

export function readStoredOverrides(): ProductOverride[] {
  try {
    const raw = localStorage.getItem(OVERRIDES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeStoredOverrides(overrides: ProductOverride[]) {
  localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
}

export async function loadPublishedOverrides(): Promise<ProductOverride[]> {
  try {
    const response = await fetch("/admin-overrides.json", { cache: "no-store" });
    if (!response.ok) return [];
    const parsed = await response.json();
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function upsertOverride(overrides: ProductOverride[], next: ProductOverride) {
  const cleaned = {
    ...next,
    name: next.name?.trim(),
    code: next.code?.trim(),
    img: next.img?.trim(),
  };
  const without = overrides.filter((item) => item.key !== next.key);
  return [...without, cleaned];
}