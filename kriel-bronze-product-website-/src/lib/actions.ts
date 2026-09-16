import { getSupabase } from "./supabase";
import type { Category, Product, Order, OrderStatus } from "./types";

/**
 * Static-site data layer.
 *
 * This module intentionally runs in the browser and talks directly to the
 * external Supabase backend. It contains no Next.js Server Actions, Drizzle
 * database connection, or request-time rendering, so the app can be exported
 * with `output: "export"` and hosted as a Render Static Site.
 */

function toCategory(row: any): Category {
  return {
    id: Number(row.id),
    slug: row.slug ?? "",
    name: row.name ?? "",
    description: row.description ?? "",
    image: row.image ?? "",
    sortOrder: Number(row.sort_order ?? 0),
  };
}

function toProduct(row: any): Product {
  const image = row.image ?? "";
  const images = Array.isArray(row.images) ? row.images : [];
  const setNames = Array.isArray(row.set_names) ? row.set_names : [];
  return {
    id: Number(row.id),
    categoryId: row.category_id == null ? null : Number(row.category_id),
    name: row.name ?? "",
    code: row.code ?? "",
    price: Number(row.price ?? 0),
    dims: row.dims ?? "",
    material: row.material ?? "",
    description: row.description ?? "",
    image,
    images: images.length ? images : image ? [image] : [],
    sizes: Array.isArray(row.sizes) ? row.sizes : [],
    colors: Array.isArray(row.colors) ? row.colors : [],
    variants: Array.isArray(row.variants) ? row.variants : [],
    salePct: Number(row.sale_pct ?? 0),
    sortOrder: Number(row.sort_order ?? 0),
    featured: Boolean(row.featured),
    featuredOrder: Number(row.featured_order ?? 0),
    customizable: Boolean(row.customizable),
    active: Boolean(row.active),
    setName: row.set_name ?? setNames[0] ?? null,
    colorCodes: row.color_codes && typeof row.color_codes === "object" ? row.color_codes : {},
    colorImages: row.color_images && typeof row.color_images === "object" ? row.color_images : {},
    setNames,
  };
}

function toOrder(row: any): Order {
  return {
    id: Number(row.id),
    customerName: row.customer_name ?? "",
    phone: row.phone ?? "",
    address: row.address ?? "",
    notes: row.notes ?? "",
    items: Array.isArray(row.items) ? row.items : [],
    total: Number(row.total ?? 0),
    status: row.status as OrderStatus,
    emailSent: Boolean(row.email_sent),
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

const productFields = [
  "categoryId", "name", "code", "price", "dims", "material", "description",
  "image", "images", "sizes", "colors", "variants", "salePct", "sortOrder",
  "featured", "featuredOrder", "customizable", "active", "setName",
  "colorCodes", "colorImages", "setNames",
] as const;

function toProductRow(input: any): Record<string, unknown> {
  const map: Record<string, string> = {
    categoryId: "category_id",
    salePct: "sale_pct",
    sortOrder: "sort_order",
    featuredOrder: "featured_order",
    setName: "set_name",
    colorCodes: "color_codes",
    colorImages: "color_images",
    setNames: "set_names",
  };
  const out: Record<string, unknown> = {};
  for (const key of productFields) {
    if (input[key] !== undefined) {
      out[map[key] ?? key] = input[key];
    }
  }
  if (out.price !== undefined) out.price = Number(out.price || 0);
  if (out.setNames !== undefined && Array.isArray(out.setNames)) {
    out.set_name = out.setNames[0] || null;
  }
  return out;
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await getSupabase()
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toCategory);
}

export async function fetchProducts(options?: { onlyActive?: boolean }): Promise<Product[]> {
  let query = getSupabase()
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  if (options?.onlyActive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toProduct);
}

export async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await getSupabase()
    .from("orders")
    .select("*")
    .order("id", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toOrder);
}

export async function createCategory(input: any) {
  const slug = input.slug || String(input.name ?? "").toLowerCase().replace(/ /g, "-");
  const { data, error } = await getSupabase()
    .from("categories")
    .insert({
      slug,
      name: input.name,
      description: input.description || "",
      image: input.image || "",
      sort_order: Number(input.sortOrder || 0),
    })
    .select()
    .single();
  if (error) throw error;
  return toCategory(data);
}

export async function updateCategory(id: number, patch: any) {
  const updates: Record<string, unknown> = {};
  if (patch.slug !== undefined) updates.slug = patch.slug;
  if (patch.name !== undefined) updates.name = patch.name;
  if (patch.description !== undefined) updates.description = patch.description;
  if (patch.image !== undefined) updates.image = patch.image;
  if (patch.sortOrder !== undefined) updates.sort_order = Number(patch.sortOrder);
  const { error } = await getSupabase().from("categories").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteCategory(id: number) {
  const { error } = await getSupabase().from("categories").delete().eq("id", id);
  if (error) throw error;
}

export async function createProduct(input: any) {
  const row = toProductRow(input);
  if (row.price === undefined) row.price = 0;
  if (row.images === undefined) row.images = [];
  if (row.sizes === undefined) row.sizes = [];
  if (row.colors === undefined) row.colors = [];
  if (row.variants === undefined) row.variants = [];
  if (row.color_codes === undefined) row.color_codes = {};
  if (row.color_images === undefined) row.color_images = {};
  if (row.set_names === undefined) row.set_names = [];
  const { data, error } = await getSupabase().from("products").insert(row).select().single();
  if (error) throw error;
  return toProduct(data);
}

export async function updateProduct(id: number, patch: any) {
  const updates = toProductRow(patch);
  const { error } = await getSupabase().from("products").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteProduct(id: number) {
  const { error } = await getSupabase().from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteProducts(ids: number[]) {
  if (!ids.length) return;
  const { error } = await getSupabase().from("products").delete().in("id", ids);
  if (error) throw error;
}

export async function createOrder(payload: any) {
  const items = Array.isArray(payload.items) ? payload.items : [];
  // Custom text pricing replaces the normal product/variant price.
  // No custom text means the normal stored product/variant price applies.
  const total = items.reduce((sum: number, it: any) => {
    const customText = typeof it.customText === "string" ? it.customText.trim() : "";
    const unitPrice = customText
      ? customText.length * (Number(it.textPricePerCharacter) || 0)
      : Number(it.price);
    return sum + unitPrice * Number(it.qty || 0);
  }, 0);

  const { data, error } = await getSupabase()
    .from("orders")
    .insert({
      customer_name: payload.customerName,
      phone: payload.phone,
      address: payload.address,
      notes: payload.notes || "",
      items,
      total,
      status: "e_re",
      email_sent: false,
    })
    .select()
    .single();
  if (error) throw error;
  return { order: toOrder(data), emailSent: false };
}

export async function updateOrderStatus(id: number, status: OrderStatus) {
  const { error } = await getSupabase().from("orders").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteOrder(id: number) {
  const { error } = await getSupabase().from("orders").delete().eq("id", id);
  if (error) throw error;
}

export async function signInAdmin(email: string, password: string) {
  const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { user: data.user };
}

export async function signOutAdmin() {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw error;
}

export async function getAdminSession() {
  const { data, error } = await getSupabase().auth.getSession();
  if (error) throw error;
  return { user: data.session?.user ?? null };
}

export function onAdminAuthChange(callback: (session: any) => void): () => void {
  const { data } = getSupabase().auth.onAuthStateChange((_event, session) => {
    callback(session ? { user: session.user } : null);
  });
  return () => data.subscription.unsubscribe();
}
