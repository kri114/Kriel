/**
 * Data-access layer used by the public site and the admin panel.
 *
 * It replaces the former Next.js API routes (/api/categories, /api/products,
 * /api/orders, /api/admin/*) which required a running Node server. Everything
 * now talks to Supabase directly from the browser:
 *
 *   - reads of categories/products      -> allowed for everyone (RLS)
 *   - writes of categories/products     -> only authenticated admin (RLS)
 *   - creating an order                 -> `create_order` RPC (validated in SQL)
 *   - reading / updating / deleting orders -> only authenticated admin (RLS)
 *   - order e-mail                      -> `order-email` Edge Function (secrets stay server-side)
 *   - photos                            -> Supabase Storage bucket
 */
import { getSupabase, isSupabaseConfigured, MEDIA_BUCKET, requireSupabase } from "./supabase";
import { SEED_CATEGORIES, SEED_PRODUCTS } from "./seed-data";
import type { Category, Order, OrderItemPayload, OrderStatus, Product } from "./types";

/* ------------------------------------------------------------------ */
/* Row mappers (snake_case DB columns -> camelCase app types)          */
/* ------------------------------------------------------------------ */

type CategoryRow = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  sort_order: number | null;
};

type ProductRow = {
  id: number;
  category_id: number | null;
  name: string;
  code: string | null;
  price: number | string | null;
  dims: string | null;
  material: string | null;
  description: string | null;
  image: string | null;
  sort_order: number | null;
  featured: boolean | null;
  featured_order: number | null;
  customizable: boolean | null;
  active: boolean | null;
};

type OrderRow = {
  id: number;
  customer_name: string;
  phone: string;
  address: string;
  notes: string | null;
  items: OrderItemPayload[] | null;
  total: number | string | null;
  status: string;
  email_sent: boolean | null;
  created_at: string;
};

export function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    image: row.image ?? "",
    sortOrder: row.sort_order ?? 0,
  };
}

export function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    code: row.code ?? "",
    price: Number(row.price ?? 0),
    dims: row.dims ?? "",
    material: row.material ?? "",
    description: row.description ?? "",
    image: row.image ?? "",
    sortOrder: row.sort_order ?? 0,
    featured: Boolean(row.featured),
    featuredOrder: row.featured_order ?? 0,
    customizable: Boolean(row.customizable),
    active: row.active ?? true,
  };
}

export function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    customerName: row.customer_name,
    phone: row.phone,
    address: row.address,
    notes: row.notes ?? "",
    items: (row.items ?? []) as OrderItemPayload[],
    total: Number(row.total ?? 0),
    status: row.status as OrderStatus,
    emailSent: Boolean(row.email_sent),
    createdAt: row.created_at,
  };
}

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export async function getCategories(): Promise<Category[]> {
  const sb = getSupabase();
  if (!sb) return SEED_CATEGORIES;
  const { data, error } = await sb
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as CategoryRow[]).map(toCategory);
}

function slugify(input: string): string {
  return (
    input
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") || `kategori-${Date.now()}`
  );
}

export type CategoryInput = Partial<Pick<Category, "name" | "description" | "image" | "sortOrder" | "slug">>;

function categoryPatch(body: CategoryInput) {
  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string") patch.name = body.name.trim();
  if (typeof body.description === "string") patch.description = body.description;
  if (typeof body.image === "string") patch.image = body.image;
  if (typeof body.sortOrder === "number") patch.sort_order = body.sortOrder;
  if (typeof body.slug === "string" && body.slug.trim()) patch.slug = slugify(body.slug);
  return patch;
}

export async function createCategory(body: CategoryInput): Promise<Category> {
  const sb = requireSupabase();
  if (!body.name || !body.name.trim()) throw new Error("Emri i kategorisë është i domosdoshëm.");

  const existing = await getCategories();
  const nextOrder = existing.length ? Math.max(...existing.map((c) => c.sortOrder)) + 1 : 0;
  const baseSlug = slugify(body.slug && body.slug.trim() ? body.slug : body.name);

  let slug = baseSlug;
  let attempt = 1;
  // Retry on unique-slug collisions (same behaviour as the old API route).
  for (;;) {
    const { data, error } = await sb
      .from("categories")
      .insert({
        slug,
        name: body.name.trim(),
        description: body.description ?? "",
        image: body.image ?? "",
        sort_order: typeof body.sortOrder === "number" ? body.sortOrder : nextOrder,
      })
      .select("*")
      .single();
    if (!error) return toCategory(data as CategoryRow);
    if (error.code === "23505" && attempt < 20) {
      slug = `${baseSlug}-${attempt++}`;
      continue;
    }
    throw new Error(error.message);
  }
}

export async function updateCategory(id: number, body: CategoryInput): Promise<Category> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("categories")
    .update(categoryPatch(body))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return toCategory(data as CategoryRow);
}

export async function deleteCategory(id: number): Promise<void> {
  const sb = requireSupabase();
  // products.category_id has ON DELETE SET NULL, matching the previous schema.
  const { error } = await sb.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

export async function getProducts(options?: { onlyActive?: boolean }): Promise<Product[]> {
  const sb = getSupabase();
  if (!sb) return options?.onlyActive ? SEED_PRODUCTS.filter((p) => p.active) : SEED_PRODUCTS;
  let query = sb.from("products").select("*");
  if (options?.onlyActive) query = query.eq("active", true);
  const { data, error } = await query
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as ProductRow[]).map(toProduct);
}

export type ProductInput = Partial<Omit<Product, "id">>;

function productPatch(body: ProductInput) {
  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string") patch.name = body.name.trim();
  if (typeof body.code === "string") patch.code = body.code;
  if (typeof body.price === "number") patch.price = Number(body.price.toFixed(2));
  if (typeof body.dims === "string") patch.dims = body.dims;
  if (typeof body.material === "string") patch.material = body.material;
  if (typeof body.description === "string") patch.description = body.description;
  if (typeof body.image === "string") patch.image = body.image;
  if (typeof body.sortOrder === "number") patch.sort_order = body.sortOrder;
  if (typeof body.featured === "boolean") patch.featured = body.featured;
  if (typeof body.featuredOrder === "number") patch.featured_order = body.featuredOrder;
  if (typeof body.customizable === "boolean") patch.customizable = body.customizable;
  if (typeof body.active === "boolean") patch.active = body.active;
  if (body.categoryId === null || typeof body.categoryId === "number") patch.category_id = body.categoryId;
  return patch;
}

export async function createProduct(body: ProductInput): Promise<Product> {
  const sb = requireSupabase();
  if (!body.name || !body.name.trim()) throw new Error("Emri i produktit është i domosdoshëm.");

  const existing = await getProducts();
  const nextOrder = existing.length ? Math.max(...existing.map((p) => p.sortOrder)) + 1 : 0;

  const values = {
    category_id: typeof body.categoryId === "number" ? body.categoryId : null,
    name: body.name.trim(),
    code: body.code ?? "",
    price: typeof body.price === "number" ? Number(body.price.toFixed(2)) : 0,
    dims: body.dims ?? "",
    material: body.material ?? "",
    description: body.description ?? "",
    image: body.image ?? "",
    sort_order: typeof body.sortOrder === "number" ? body.sortOrder : nextOrder,
    featured: Boolean(body.featured),
    featured_order: typeof body.featuredOrder === "number" ? body.featuredOrder : 0,
    customizable: Boolean(body.customizable),
    active: body.active === undefined ? true : Boolean(body.active),
  };

  const { data, error } = await sb.from("products").insert(values).select("*").single();
  if (error) throw new Error(error.message);
  return toProduct(data as ProductRow);
}

export async function updateProduct(id: number, body: ProductInput): Promise<Product> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("products")
    .update(productPatch(body))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return toProduct(data as ProductRow);
}

export async function deleteProduct(id: number): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

export type CreateOrderInput = {
  customerName: string;
  phone: string;
  address: string;
  notes: string;
  items: OrderItemPayload[];
};

/**
 * Public checkout. Inserts through the `create_order` SQL function
 * (SECURITY DEFINER) so anonymous visitors can create orders without being
 * able to read anybody else's order. Then asks the Edge Function to e-mail
 * the shop – if that isn't deployed yet the order is still saved.
 */
export async function createOrder(input: CreateOrderInput): Promise<{ order: Order; emailSent: boolean }> {
  const sb = requireSupabase();
  const customerName = input.customerName.trim();
  const phone = input.phone.trim();
  const address = input.address.trim();
  if (!customerName || !phone || !address) {
    throw new Error("Emri, telefoni dhe adresa janë të domosdoshme.");
  }
  if (!input.items.length) throw new Error("Shporta është bosh.");

  const items: OrderItemPayload[] = input.items.map((it) => ({
    productId: Number(it.productId) || 0,
    name: it.name ?? "",
    code: it.code ?? "",
    price: Number(it.price) || 0,
    qty: Math.max(1, Number(it.qty) || 1),
    customText: (it.customText ?? "").trim(),
  }));

  const { data, error } = await sb.rpc("create_order", {
    p_customer_name: customerName,
    p_phone: phone,
    p_address: address,
    p_notes: input.notes.trim(),
    p_items: items,
  });
  if (error) throw new Error(error.message || "Diçka shkoi keq. Provoni përsëri.");

  const row = (Array.isArray(data) ? data[0] : data) as OrderRow;
  const order = toOrder(row);

  let emailSent = false;
  try {
    const res = await sb.functions.invoke<{ emailSent?: boolean }>("order-email", {
      body: { orderId: order.id },
    });
    emailSent = Boolean(res.data?.emailSent);
  } catch {
    emailSent = false;
  }

  return { order: { ...order, emailSent }, emailSent };
}

export async function getOrders(): Promise<Order[]> {
  const sb = requireSupabase();
  const { data, error } = await sb.from("orders").select("*").order("id", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as OrderRow[]).map(toOrder);
}

const VALID_STATUSES: OrderStatus[] = ["e_re", "konfirmuar", "perfunduar", "anulluar"];

export async function updateOrderStatus(id: number, status: OrderStatus): Promise<Order> {
  const sb = requireSupabase();
  if (!VALID_STATUSES.includes(status)) throw new Error("Statusi i pavlefshëm.");
  const { data, error } = await sb.from("orders").update({ status }).eq("id", id).select("*").single();
  if (error) throw new Error(error.message);
  return toOrder(data as OrderRow);
}

export async function deleteOrder(id: number): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from("orders").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ------------------------------------------------------------------ */
/* Admin auth (Supabase Auth, e-mail + password)                       */
/* ------------------------------------------------------------------ */

export async function adminLogin(email: string, password: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
  if (error) {
    throw new Error(
      error.message === "Invalid login credentials"
        ? "Përdoruesi ose fjalëkalimi është i gabuar."
        : error.message
    );
  }
}

export async function adminLogout(): Promise<void> {
  const sb = getSupabase();
  if (sb) await sb.auth.signOut();
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { data } = await sb.auth.getSession();
  return Boolean(data.session);
}

export { isSupabaseConfigured };

/* ------------------------------------------------------------------ */
/* Images (Supabase Storage)                                           */
/* ------------------------------------------------------------------ */

function dataUrlToBlob(dataUrl: string): { blob: Blob; ext: string } {
  const [meta, b64] = dataUrl.split(",");
  const mime = /data:(.*?);/.exec(meta)?.[1] || "image/jpeg";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { blob: new Blob([bytes], { type: mime }), ext: mime.split("/")[1] || "jpg" };
}

/**
 * Uploads an (already resized) image data-URL to the public media bucket and
 * returns its public URL. Only authenticated admins may upload (storage RLS).
 */
export async function uploadImage(dataUrl: string, folder = "uploads"): Promise<string> {
  const sb = requireSupabase();
  const { blob, ext } = dataUrlToBlob(dataUrl);
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage.from(MEDIA_BUCKET).upload(path, blob, {
    contentType: blob.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return sb.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Removes a previously uploaded photo from the bucket (ignores external URLs). */
export async function deleteImageIfOwned(url: string): Promise<void> {
  const sb = getSupabase();
  if (!sb || !url) return;
  const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const path = decodeURIComponent(url.slice(idx + marker.length));
  await sb.storage.from(MEDIA_BUCKET).remove([path]);
}
