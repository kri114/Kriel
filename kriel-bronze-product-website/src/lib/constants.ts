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

/** Rounds to the nearest cent — used everywhere prices are computed client-side. */
export function roundCents(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Applies a product's "Ulje" (sale) percentage to a price, if any.
 * `discountPercent` of null/0/negative means "no discount" — returns the
 * price unchanged.
 */
export function applyDiscount(price: number, discountPercent: number | null | undefined): number {
  if (!discountPercent || discountPercent <= 0) return price;
  return Math.max(0, roundCents(price * (1 - discountPercent / 100)));
}
