import type { Category, Product } from "./types";

/**
 * Initial catalogue (same content as scripts/seed.cjs and supabase/schema.sql).
 * Used as a fallback when the site is built without Supabase credentials so
 * the static export always succeeds and the design is visible.
 */
export const SEED_CATEGORIES: Category[] = [
  { id: 1, slug: "germa", name: "Gërma", description: "Gërma bronzi për emra dhe fjali të personalizuara mbi përkujtimore.", image: "/images/categories/germa.jpg", sortOrder: 0 },
  { id: 2, slug: "korniza", name: "Korniza Bronzi", description: "Korniza elegante bronzi për fotografi përkujtimore.", image: "/images/categories/korniza.jpg", sortOrder: 1 },
  { id: 3, slug: "kryqe", name: "Kryqe Bronzi", description: "Kryqe të punuara në bronz, me finitim të artë ose të errët.", image: "/images/categories/kryqe.jpg", sortOrder: 2 },
  { id: 4, slug: "lule", name: "Lule Bronzi", description: "Kompozime lulesh në bronz, të qëndrueshme ndaj kohës.", image: "/images/categories/lule.jpg", sortOrder: 3 },
  { id: 5, slug: "mbajtese", name: "Llampa & Mbajtëse", description: "Llampa dhe mbajtëse qiriri në bronz për përkujtimore.", image: "/images/categories/mbajtese.jpg", sortOrder: 4 },
  { id: 6, slug: "vazo", name: "Vazo Bronzi", description: "Vazo bronzi klasike dhe moderne.", image: "/images/categories/vazo.jpg", sortOrder: 5 },
  { id: 7, slug: "statuja", name: "Statuja Bronzi", description: "Statuja fetare dhe artistike të derdhura në bronz.", image: "/images/categories/statuja.jpg", sortOrder: 6 },
  { id: 8, slug: "targa", name: "Targa Bronzi", description: "Targa përkujtimore me gdhendje teksti dhe motive dekorative.", image: "/images/categories/targa.jpg", sortOrder: 7 },
];

type SeedProduct = Partial<Product> & { name: string; price: number };

const bySlug: Record<string, SeedProduct[]> = {
  germa: [
    { name: "Gërma kursive e artë", price: 12.9, dims: "Lartësia 6 cm", material: "Bronz i artë", customizable: true, featured: true, featuredOrder: 0 },
    { name: "Gërma klasike bronzi", price: 10.9, dims: "Lartësia 5 cm", material: "Bronz 87", customizable: true },
    { name: "Fjali e personalizuar në bronz", price: 39.9, dims: "Gjatësia deri 40 cm", material: "Bronz i punuar dorë", customizable: true },
  ],
  korniza: [
    { name: "Kornizë ovale me lule", price: 58.9, dims: "18 x 24 cm", material: "Bronz i artë" },
    { name: "Kornizë klasike rrethore", price: 46.9, dims: "Diametri 16 cm", material: "Bronz 87" },
    { name: "Kornizë moderne minimaliste", price: 41.9, dims: "13 x 18 cm", material: "Bronz i errët" },
  ],
  kryqe: [
    { name: "Kryq modern i errët", price: 47.9, dims: "Lartësia 16 cm", material: "Bronz 87 — patinë e errët" },
    { name: "Kryq i artë trekëndor", price: 73.9, dims: "Lartësia 35 cm", material: "Bronz 87 — finish i artë" },
    { name: "Kryqëzim klasik me Krishtin", price: 46.9, dims: "Lartësia 15 cm", material: "Bronz 87 — patinë artistike" },
    { name: "Kryq me kristal dielli", price: 53.9, dims: "Lartësia 20 cm", material: "Bronz 87 — finish i artë" },
  ],
  lule: [
    { name: "Trëndafil me kërcell të gjatë", price: 78.9, dims: "Lartësia 51 cm", material: "Bronz i punuar dorë", featured: true, featuredOrder: 1 },
    { name: "Luledielli Bronzi", price: 80.9, dims: "Lartësia 53 cm", material: "Bronz i punuar dorë" },
    { name: "Zambak (Giglio)", price: 46.9, dims: "Lartësia 23 cm", material: "Bronz i punuar dorë" },
  ],
  mbajtese: [
    { name: "Llampë qiriri klasike", price: 64.9, dims: "Lartësia 22 cm", material: "Bronz me xham mbrojtës" },
    { name: "Mbajtëse qiriri moderne", price: 52.9, dims: "Lartësia 18 cm", material: "Bronz 87" },
  ],
  vazo: [
    { name: "Vazo me gdhendje floreale", price: 69.9, dims: "Lartësia 24 cm", material: "Bronz i artë" },
    { name: "Vazo klasike cilindrike", price: 57.9, dims: "Lartësia 20 cm", material: "Bronz 87" },
  ],
  statuja: [
    { name: "Madonna me duar të bashkuara", price: 402.9, dims: "Lartësia 63 cm", material: "Bronz 87 — patinë artistike", featured: true, featuredOrder: 2 },
    { name: "Madonna në lutje", price: 210.9, dims: "Lartësia 26 cm", material: "Bronz 87 — patinë artistike" },
    { name: "Engjëll mbrojtës", price: 288.9, dims: "Lartësia 41 cm", material: "Bronz 87 — patinë artistike" },
  ],
  targa: [
    { name: "Targë përkujtimore klasike", price: 89.9, dims: "20 x 30 cm", material: "Bronz i artë" },
    { name: "Targë me kornizë dekorative", price: 96.9, dims: "25 x 35 cm", material: "Bronz 87" },
  ],
};

export const SEED_PRODUCTS: Product[] = (() => {
  const list: Product[] = [];
  let id = 1;
  for (const cat of SEED_CATEGORIES) {
    let sortOrder = 0;
    for (const p of bySlug[cat.slug] ?? []) {
      list.push({
        id: id++,
        categoryId: cat.id,
        name: p.name,
        code: p.code ?? "",
        price: p.price,
        dims: p.dims ?? "",
        material: p.material ?? "",
        description: p.description ?? "",
        image: cat.image,
        sortOrder: sortOrder++,
        featured: Boolean(p.featured),
        featuredOrder: p.featuredOrder ?? 0,
        customizable: Boolean(p.customizable),
        active: true,
      });
    }
  }
  return list;
})();
