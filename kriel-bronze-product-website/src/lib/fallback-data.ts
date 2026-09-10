import type { Category, Product } from "./types";

/**
 * Bundled default catalog — mirrors scripts/seed.cjs (and supabase/setup.sql).
 *
 * Used when the Supabase backend is not configured yet, so the public site
 * always renders the full design and catalog. As soon as
 * NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are set, live data
 * (including all admin edits) replaces this snapshot at runtime.
 */

type CategorySeed = {
  slug: string;
  name: string;
  description: string;
};

const CATEGORY_SEEDS: CategorySeed[] = [
  {
    slug: "germa",
    name: "Gërma",
    description: "Gërma bronzi për emra dhe fjali të personalizuara mbi përkujtimore.",
  },
  {
    slug: "korniza",
    name: "Korniza Bronzi",
    description: "Korniza elegante bronzi për fotografi përkujtimore.",
  },
  {
    slug: "kryqe",
    name: "Kryqe Bronzi",
    description: "Kryqe të punuara në bronz, me finitim të artë ose të errët.",
  },
  {
    slug: "lule",
    name: "Lule Bronzi",
    description: "Kompozime lulesh në bronz, të qëndrueshme ndaj kohës.",
  },
  {
    slug: "mbajtese",
    name: "Mbajtëse Qirinjsh",
    description: "Llampa dhe mbajtëse qirinjsh në bronz për varreza dhe altare.",
  },
  {
    slug: "vazo",
    name: "Vazo Lulesh",
    description: "Vazo bronzi me gdhendje delikate për lule të freskëta.",
  },
  {
    slug: "statuja",
    name: "Statuja Bronzi",
    description: "Statuja monumentale dhe të vogla, punuar me dorë.",
  },
  {
    slug: "targa",
    name: "Targa Bronzi",
    description: "Targa përkujtimore me gdhendje teksti dhe motive dekorative.",
  },
];

type ProductSeed = {
  name: string;
  price: number;
  dims?: string;
  material?: string;
  customizable?: boolean;
  featured?: boolean;
  featuredOrder?: number;
};

const PRODUCTS_BY_CATEGORY: Record<string, ProductSeed[]> = {
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

function buildFallback(): { categories: Category[]; products: Product[] } {
  const categories: Category[] = CATEGORY_SEEDS.map((c, i) => ({
    id: i + 1,
    slug: c.slug,
    name: c.name,
    description: c.description,
    image: `/images/categories/${c.slug}.jpg`,
    sortOrder: i,
  }));

  const products: Product[] = [];
  let nextId = 1;
  for (const cat of categories) {
    const list = PRODUCTS_BY_CATEGORY[cat.slug] ?? [];
    list.forEach((p, i) => {
      products.push({
        id: nextId++,
        categoryId: cat.id,
        name: p.name,
        code: "",
        price: p.price,
        dims: p.dims ?? "",
        material: p.material ?? "",
        description: "",
        image: cat.image,
        images: [cat.image],
        sizes: [],
        colors: [],
        sortOrder: i,
        featured: Boolean(p.featured),
        featuredOrder: p.featuredOrder ?? 0,
        customizable: Boolean(p.customizable),
        active: true,
      });
    });
  }

  return { categories, products };
}

export const FALLBACK_CATALOG = buildFallback();
