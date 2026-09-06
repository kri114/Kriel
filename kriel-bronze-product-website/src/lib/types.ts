// Llojet e ndara mes serverit dhe klientit
export type CategoryDto = {
  id: string;
  name: string;
  cover: string;
  sort: number;
  count: number;
};

export type ProductDto = {
  id: string;
  categoryId: string;
  name: string;
  code: string;
  price: number;
  dims: string;
  mat: string;
  img: string;
  featured: boolean;
  featuredOrder: number;
};

export type CatalogPayload = {
  categories: CategoryDto[];
  products: ProductDto[];
};

export const fmtEUR = (n: number) =>
  "€ " +
  Number(n || 0).toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const SITE = {
  phone: "+355 69 20 31 315",
  phoneHref: "tel:+355692031315",
  wa: "355692031315",
  email: "infokrielshpk@kriel.com",
  maps: "https://maps.app.goo.gl/VyvyX9iwWCG66DFM7",
  hours: "E Martë – E Dielë · 08:00 – 14:00",
};

export const waLink = (text: string) =>
  "https://wa.me/" + SITE.wa + "?text=" + encodeURIComponent(text);
