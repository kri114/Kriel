export const SITE_NAME = "KRIEL";
export const SITE_TAGLINE = "Arti i Bronzit";

export const PHONE_DISPLAY = "+355 69 20 31 315";
export const PHONE_TEL = "+355692031315";
export const WHATSAPP_NUMBER = "355692031315";

export const CONTACT_EMAIL = "infokrielshpk@gmail.com";
export const ORDER_EMAIL_TO = "infokrielshpk@gmail.com";

export const ADDRESS = "Rruga Taxhedin Baholli Nr. 21, Tiranë 1008, Albania";
export const HOURS = "E Martë – E Dielë · 08:00 – 14:00";

export const FACEBOOK_URL = "https://www.facebook.com/aksesore/";
export const INSTAGRAM_URL = "https://www.instagram.com/kriel_sh.p.k/";

export function fmtEUR(n: number): string {
  return (
    "€ " +
    n.toLocaleString("it-IT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function waLink(text: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

import type { Product, ProductVariant } from "./types";

/** Price after applying a percent discount (0 or invalid → unchanged). */
export function effectivePrice(base: number, salePct?: number | null): number {
  const pct = Number(salePct ?? 0);
  if (!Number.isFinite(pct) || pct <= 0) return base;
  const clamped = Math.min(pct, 95);
  return Math.round(base * (100 - clamped)) / 100;
}

/** Get specific product code for selected color/variant, falling back to base product code. */
export function getProductCode(
  product: Product,
  selectedColor?: string,
  selectedVariant?: ProductVariant
): string {
  if (selectedVariant?.code && selectedVariant.code.trim()) {
    return selectedVariant.code.trim();
  }
  if (selectedColor && product.colorCodes && product.colorCodes[selectedColor]?.trim()) {
    return product.colorCodes[selectedColor].trim();
  }
  return product.code || "";
}

/** Get list of all set names a product belongs to (0, 1, or multiple). */
export function getProductSets(product: Product): string[] {
  if (Array.isArray(product.setNames) && product.setNames.length > 0) {
    return product.setNames.filter((s) => Boolean(s && typeof s === "string" && s.trim()));
  }
  if (product.setName && product.setName.trim()) {
    return [product.setName.trim()];
  }
  return [];
}
