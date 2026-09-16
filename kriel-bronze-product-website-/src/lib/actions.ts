"use server";

import { db } from "@/db";
import { categories, products, orders } from "@/db/schema";
import { eq, inArray, desc, asc, and } from "drizzle-orm";
import type {
  Category,
  Product,
  Order,
  ProductVariant,
  OrderItemPayload,
  OrderStatus,
} from "./types";
import { revalidatePath } from "next/cache";

/* ------------------------------ row mappers ------------------------------ */

function toProduct(row: any): Product {
  const image = row.image ?? "";
  const images = Array.isArray(row.images) ? row.images : [];
  const setNames = Array.isArray(row.setNames) ? row.setNames : [];
  return {
    ...row,
    price: Number(row.price),
    images: images.length ? images : image ? [image] : [],
    sizes: Array.isArray(row.sizes) ? row.sizes : [],
    colors: Array.isArray(row.colors) ? row.colors : [],
    variants: Array.isArray(row.variants) ? row.variants : [],
    colorCodes: row.colorCodes || {},
    colorImages: row.colorImages || {},
    setNames: setNames,
    setName: row.setName || setNames[0] || null,
  };
}

function toOrder(row: any): Order {
  return {
    ...row,
    total: Number(row.total),
    createdAt: row.createdAt.toISOString(),
  };
}

/* --------------------------------- reads --------------------------------- */

export async function fetchCategories(): Promise<Category[]> {
  const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id));
  return rows.map(r => ({ ...r, description: r.description || "", image: r.image || "" }));
}

export async function fetchProducts(options?: { onlyActive?: boolean }): Promise<Product[]> {
  let query = db.select().from(products);
  if (options?.onlyActive) {
    // @ts-ignore
    query = query.where(eq(products.active, true));
  }
  const rows = await query.orderBy(asc(products.sortOrder), asc(products.id));
  return rows.map(toProduct);
}

export async function fetchOrders(): Promise<Order[]> {
  const rows = await db.select().from(orders).orderBy(desc(orders.id));
  return rows.map(toOrder);
}

/* ------------------------------- categories ------------------------------ */

export async function createCategory(input: any) {
  const [row] = await db.insert(categories).values({
    slug: input.slug || input.name.toLowerCase().replace(/ /g, "-"),
    name: input.name,
    description: input.description || "",
    image: input.image || "",
    sortOrder: input.sortOrder || 0,
  }).returning();
  revalidatePath("/");
  return row;
}

export async function updateCategory(id: number, patch: any) {
  await db.update(categories).set(patch).where(eq(categories.id, id));
  revalidatePath("/");
}

export async function deleteCategory(id: number) {
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/");
}

/* -------------------------------- products ------------------------------- */

export async function createProduct(input: any) {
  const images = Array.isArray(input.images) ? input.images : [];
  const setNames = Array.isArray(input.setNames) ? input.setNames : [];
  
  const [row] = await db.insert(products).values({
    ...input,
    price: (input.price || 0).toString(),
    images,
    setNames,
    setName: input.setName || setNames[0] || null,
    colorCodes: input.colorCodes || {},
    colorImages: input.colorImages || {},
    variants: input.variants || [],
    sizes: input.sizes || [],
    colors: input.colors || [],
  }).returning();
  revalidatePath("/");
  return toProduct(row);
}

export async function updateProduct(id: number, patch: any) {
  const updates: any = { ...patch };
  if (patch.price !== undefined) updates.price = patch.price.toString();
  if (patch.setNames !== undefined) {
    updates.setName = patch.setNames[0] || null;
  }

  await db.update(products).set(updates).where(eq(products.id, id));
  revalidatePath("/");
}

export async function deleteProduct(id: number) {
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/");
}

export async function deleteProducts(ids: number[]) {
  await db.delete(products).where(inArray(products.id, ids));
  revalidatePath("/");
}

/* --------------------------------- orders -------------------------------- */

export async function createOrder(payload: any) {
  const total = payload.items.reduce((sum: number, it: any) => {
    const textCost = (it.customText?.length || 0) * (it.textPricePerCharacter || 0);
    return sum + (it.price + textCost) * it.qty;
  }, 0);

  const [row] = await db.insert(orders).values({
    customerName: payload.customerName,
    phone: payload.phone,
    address: payload.address,
    notes: payload.notes || "",
    items: payload.items,
    total: total.toString(),
    status: "e_re",
    emailSent: false,
  }).returning();
  
  return { order: toOrder(row), emailSent: false };
}

export async function updateOrderStatus(id: number, status: OrderStatus) {
  await db.update(orders).set({ status }).where(eq(orders.id, id));
}

export async function deleteOrder(id: number) {
  await db.delete(orders).where(eq(orders.id, id));
}

/* ------------------------------ admin auth ------------------------------- */

export async function signInAdmin(email: string, password: string) {
  // Simple mock: any login works for the sandbox
  return { user: { email } };
}

export async function signOutAdmin() {
  return;
}

export async function getAdminSession() {
  // Always logged in for sandbox admin panel
  return { user: { email: "admin@kriel.com" } };
}

