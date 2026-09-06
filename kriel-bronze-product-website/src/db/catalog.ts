import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { SEED_CATEGORIES, SEED_PRODUCTS } from "@/db/seed-data";
import type { CatalogPayload } from "@/lib/types";

// ── Seed fillestar (vetëm nëse tabelat janë bosh) ───────────
let seedPromise: Promise<void> | null = null;

async function ensureSeeded() {
  const [{ value: catCount }] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(categories);
  if (catCount > 0) return;

  if (!seedPromise) {
    seedPromise = (async () => {
      await db
        .insert(categories)
        .values(SEED_CATEGORIES.map((c) => ({ ...c, cover: `/images/categories/${c.id}.jpg` })))
        .onConflictDoNothing();
      // fut produktet në pjesë për të shmangur batch shumë të mëdha
      const CHUNK = 40;
      for (let i = 0; i < SEED_PRODUCTS.length; i += CHUNK) {
        await db
          .insert(products)
          .values(SEED_PRODUCTS.slice(i, i + CHUNK))
          .onConflictDoNothing();
      }
    })().finally(() => {
      seedPromise = null;
    });
  }
  await seedPromise;
}

// ── Katalogu i plotë publik ──────────────────────────────────
export async function getCatalog(): Promise<CatalogPayload> {
  await ensureSeeded();

  const [cats, prods] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.sort), asc(categories.id)),
    db.select().from(products).orderBy(asc(products.createdAt), asc(products.id)),
  ]);

  const counts = new Map<string, number>();
  for (const p of prods) counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1);

  return {
    categories: cats.map((c) => ({
      id: c.id,
      name: c.name,
      cover: c.cover,
      sort: c.sort,
      count: counts.get(c.id) ?? 0,
    })),
    products: prods.map((p) => ({
      id: p.id,
      categoryId: p.categoryId,
      name: p.name,
      code: p.code,
      price: p.price,
      dims: p.dims,
      mat: p.mat,
      img: p.img,
      featured: p.featured,
      featuredOrder: p.featuredOrder,
    })),
  };
}

// ── Produktet "Më të pëlqyerat" ──────────────────────────────
export async function getFeatured(): Promise<CatalogPayload["products"]> {
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.featured, true))
    .orderBy(asc(products.featuredOrder), desc(products.createdAt));
  return rows.map((p) => ({ ...p }));
}

export async function setFeaturedIds(ids: string[]) {
  await db.update(products).set({ featured: false, featuredOrder: 0 });
  if (ids.length === 0) return;
  await db
    .update(products)
    .set({
      featured: true,
      featuredOrder: sql`array_position(ARRAY[${sql.join(
        ids.map((id) => sql`${id}`),
        sql`, `
      )}]::text[], ${products.id})`,
    })
    .where(inArray(products.id, ids));
}
