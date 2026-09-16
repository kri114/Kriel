// One-off seed script for initial categories & products.
// Run with: node scripts/seed.cjs
require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const categories = [
  {
    slug: "germa",
    name: "Gërma",
    description: "Gërma bronzi për emra dhe fjali të personalizuara mbi përkujtimore.",
    image: "/images/categories/germa.jpg",
    sortOrder: 0,
  },
  {
    slug: "korniza",
    name: "Korniza Bronzi",
    description: "Korniza elegante bronzi për fotografi përkujtimore.",
    image: "/images/categories/korniza.jpg",
    sortOrder: 1,
  },
  {
    slug: "kryqe",
    name: "Kryqe Bronzi",
    description: "Kryqe të punuara në bronz, me finitim të artë ose të errët.",
    image: "/images/categories/kryqe.jpg",
    sortOrder: 2,
  },
  {
    slug: "lule",
    name: "Lule Bronzi",
    description: "Kompozime lulesh në bronz, të qëndrueshme ndaj kohës.",
    image: "/images/categories/lule.jpg",
    sortOrder: 3,
  },
  {
    slug: "mbajtese",
    name: "Mbajtëse Qirinjsh",
    description: "Llampa dhe mbajtëse qirinjsh në bronz për varreza dhe altare.",
    image: "/images/categories/mbajtese.jpg",
    sortOrder: 4,
  },
  {
    slug: "vazo",
    name: "Vazo Lulesh",
    description: "Vazo bronzi me gdhendje delikate për lule të freskëta.",
    image: "/images/categories/vazo.jpg",
    sortOrder: 5,
  },
  {
    slug: "statuja",
    name: "Statuja Bronzi",
    description: "Statuja monumentale dhe të vogla, punuar me dorë.",
    image: "/images/categories/statuja.jpg",
    sortOrder: 6,
  },
  {
    slug: "targa",
    name: "Targa Bronzi",
    description: "Targa përkujtimore me gdhendje teksti dhe motive dekorative.",
    image: "/images/categories/targa.jpg",
    sortOrder: 7,
  },
];

const productsByCategory = {
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

async function main() {
  const client = await pool.connect();
  try {
    const existing = await client.query("SELECT COUNT(*)::int AS n FROM categories");
    if (existing.rows[0].n > 0) {
      console.log("Categories already exist — skipping seed.");
      return;
    }

    const catIdBySlug = {};
    for (const c of categories) {
      const res = await client.query(
        `INSERT INTO categories (slug, name, description, image, sort_order) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [c.slug, c.name, c.description, c.image, c.sortOrder]
      );
      catIdBySlug[c.slug] = res.rows[0].id;
    }

    for (const [slug, list] of Object.entries(productsByCategory)) {
      const catId = catIdBySlug[slug];
      const catImage = categories.find((c) => c.slug === slug).image;
      let sortOrder = 0;
      for (const p of list) {
        await client.query(
          `INSERT INTO products
            (category_id, name, code, price, dims, material, description, image, sort_order, featured, featured_order, customizable, active)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true)`,
          [
            catId,
            p.name,
            p.code || "",
            p.price,
            p.dims || "",
            p.material || "",
            p.description || "",
            catImage,
            sortOrder++,
            Boolean(p.featured),
            p.featuredOrder || 0,
            Boolean(p.customizable),
          ]
        );
      }
    }

    console.log("Seed completed.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
