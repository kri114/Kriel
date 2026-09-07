import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, orders, products } from "@/db/schema";
import type { Category, Order, OrderStatus, Product } from "./types";

function toCategory(row: typeof categories.$inferSelect): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    image: row.image,
    sortOrder: row.sortOrder,
  };
}

function toProduct(row: typeof products.$inferSelect): Product {
  return {
    id: row.id,
    categoryId: row.categoryId,
    name: row.name,
    code: row.code,
    price: Number(row.price),
    dims: row.dims,
    material: row.material,
    description: row.description,
    image: row.image,
    sortOrder: row.sortOrder,
    featured: row.featured,
    featuredOrder: row.featuredOrder,
    customizable: row.customizable,
    active: row.active,
  };
}

function toOrder(row: typeof orders.$inferSelect): Order {
  return {
    id: row.id,
    customerName: row.customerName,
    phone: row.phone,
    address: row.address,
    notes: row.notes,
    items: row.items as Order["items"],
    total: Number(row.total),
    status: row.status as OrderStatus,
    emailSent: row.emailSent,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getCategories(): Promise<Category[]> {
  const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id));
  return rows.map(toCategory);
}

export async function getProducts(options?: { onlyActive?: boolean }): Promise<Product[]> {
  const rows = options?.onlyActive
    ? await db
        .select()
        .from(products)
        .where(eq(products.active, true))
        .orderBy(asc(products.sortOrder), asc(products.id))
    : await db.select().from(products).orderBy(asc(products.sortOrder), asc(products.id));
  return rows.map(toProduct);
}

export async function getOrders(): Promise<Order[]> {
  const rows = await db.select().from(orders).orderBy(asc(orders.id));
  return rows.map(toOrder).reverse();
}

export { toCategory, toProduct, toOrder };
export { and, eq };
