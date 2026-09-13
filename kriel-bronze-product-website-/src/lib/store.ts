import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";
import type {
  Category,
  Order,
  OrderItemPayload,
  OrderStatus,
  Product,
  ProductVariant,
} from "./types";

/**
 * Client-side data layer.
 *
 * This module replaces the old Next.js API routes + Drizzle queries with
 * direct calls to the Supabase (Postgres) REST API using the publishable
 * anon key. Security is enforced by Row Level Security policies in the
 * database (see supabase/setup.sql) — no secrets exist in the browser.
 *
 * Public (RLS: role `anon`):
 *   - read categories, read active products, create orders
 * Admin (RLS: role `authenticated`, i.e. logged-in panel user):
 *   - full create / update / delete on categories, products, orders
 */

/* ------------------------------ row mappers ------------------------------ */
/* DB columns stay snake_case (identical to the old Drizzle schema); API     */
/* types stay camelCase so no UI component needs to change.                  */

type CategoryRow = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  sort_order: number;
};

type ProductRow = {
  id: number;
  category_id: number | null;
  name: string;
  code: string | null;
  color_codes?: unknown;
  price: number | string;
  dims: string | null;
  material: string | null;
  description: string | null;
  image: string | null;
  images: unknown;
  sizes: unknown;
  colors: unknown;
  variants: unknown;
  sale_pct: number | null;
  sort_order: number;
  featured: boolean;
  featured_order: number;
  customizable: boolean;
  active: boolean;
  set_name: string | null;
  set_names?: unknown;
};

/** jsonb variants[] safety net — keeps only well-shaped { color, size, price>0 }. */
function toVariants(value: unknown): ProductVariant[] {
  let raw: unknown = value;
  if (typeof raw === "string" && raw.startsWith("[")) {
    try {
      raw = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw)) return [];
  const out: ProductVariant[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const v = item as Record<string, unknown>;
    const price = Number(v.price);
    if (!Number.isFinite(price) || price <= 0) continue;
    out.push({
      color: typeof v.color === "string" ? v.color : "",
      size: typeof v.size === "string" ? v.size : "",
      price,
    });
  }
  return out;
}

/** jsonb text[] safety net — accepts arrays, JSON strings, anything else → []. */
function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string" && v.length > 0);
  }
  if (typeof value === "string" && value.startsWith("[")) {
    try {
      return toStringArray(JSON.parse(value));
    } catch {
      return [];
    }
  }
  return [];
}

type OrderRow = {
  id: number;
  customer_name: string;
  phone: string;
  address: string;
  notes: string | null;
  items: OrderItemPayload[];
  total: number | string;
  status: string;
  email_sent: boolean;
  created_at: string;
};

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    image: row.image ?? "",
    sortOrder: row.sort_order,
  };
}

function toColorCodes(value: unknown): Record<string, string> {
  let raw: unknown = value;
  if (typeof raw === "string" && raw.startsWith("{")) {
    try {
      raw = JSON.parse(raw);
    } catch {
      return {};
    }
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "string" && v.trim()) {
      out[k] = v.trim();
    }
  }
  return out;
}

function toSetNames(row: ProductRow): string[] {
  const fromSetNames = toStringArray(row.set_names);
  if (fromSetNames.length > 0) return fromSetNames;
  if (row.set_name && row.set_name.trim()) return [row.set_name.trim()];
  return [];
}

function toProduct(row: ProductRow): Product {
  const image = row.image ?? "";
  const images = toStringArray(row.images);
  const setNames = toSetNames(row);
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    code: row.code ?? "",
    colorCodes: toColorCodes(row.color_codes),
    price: Number(row.price),
    dims: row.dims ?? "",
    material: row.material ?? "",
    description: row.description ?? "",
    image,
    images: images.length ? images : image ? [image] : [],
    sizes: toStringArray(row.sizes),
    colors: toStringArray(row.colors),
    variants: toVariants(row.variants),
    salePct: typeof row.sale_pct === "number" ? row.sale_pct : Number(row.sale_pct ?? 0) || 0,
    sortOrder: row.sort_order,
    featured: row.featured,
    featuredOrder: row.featured_order,
    customizable: row.customizable,
    active: row.active,
    setName: row.set_name || setNames[0] || null,
    setNames,
  };
}

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    customerName: row.customer_name,
    phone: row.phone,
    address: row.address,
    notes: row.notes ?? "",
    items: row.items,
    total: Number(row.total),
    status: row.status as OrderStatus,
    emailSent: row.email_sent,
    createdAt: row.created_at,
  };
}

function fail(message: string, cause?: unknown): never {
  if (cause) console.error(message, cause);
  throw new Error(message);
}

/* --------------------------------- reads --------------------------------- */

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await getSupabase()
    .from("categories")
    .select("id, slug, name, description, image, sort_order")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  if (error) fail("Nuk u ngarkuan kategoritë.", error);
  return (data as CategoryRow[]).map(toCategory);
}

export async function fetchProducts(options?: {
  onlyActive?: boolean;
}): Promise<Product[]> {
  let query = getSupabase()
    .from("products")
    .select(
      "id, category_id, name, code, color_codes, price, dims, material, description, image, images, sizes, colors, variants, sale_pct, sort_order, featured, featured_order, customizable, active, set_name, set_names"
    )
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  if (options?.onlyActive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) fail("Nuk u ngarkuan produktet.", error);
  return (data as ProductRow[]).map(toProduct);
}

export async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await getSupabase()
    .from("orders")
    .select(
      "id, customer_name, phone, address, notes, items, total, status, email_sent, created_at"
    )
    .order("id", { ascending: false });
  if (error) fail("Nuk u ngarkuan porositë.", error);
  return (data as OrderRow[]).map(toOrder);
}

/* ------------------------------- categories ------------------------------ */

export type CategoryInput = {
  name: string;
  description: string;
  image: string;
  slug?: string;
  sortOrder?: number;
};

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

export async function createCategory(input: CategoryInput): Promise<Category> {
  const name = input.name.trim();
  if (!name) fail("Emri i kategorisë është i domosdoshëm.");

  const supabase = getSupabase();
  const existing = await fetchCategories();
  const nextOrder = existing.length
    ? Math.max(...existing.map((c) => c.sortOrder)) + 1
    : 0;

  const baseSlug = slugify(input.slug?.trim() ? input.slug : name);

  // Same behaviour as the old API: retry with a numeric suffix on slug clash.
  for (let attempt = 0; attempt < 10; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;
    const { data, error } = await supabase
      .from("categories")
      .insert({
        slug,
        name,
        description: input.description ?? "",
        image: input.image ?? "",
        sort_order:
          typeof input.sortOrder === "number" ? input.sortOrder : nextOrder,
      })
      .select()
      .single();
    if (!error) return toCategory(data as CategoryRow);
    if (!error.message.toLowerCase().includes("duplicate") && error.code !== "23505") {
      fail("Gabim gjatë krijimit të kategorisë.", error);
    }
  }
  fail("Gabim gjatë krijimit të kategorisë (slug i zënë).");
}

export async function updateCategory(
  id: number,
  patch: Partial<CategoryInput>
): Promise<void> {
  const updates: Record<string, unknown> = {};
  if (typeof patch.name === "string") updates.name = patch.name.trim();
  if (typeof patch.description === "string") updates.description = patch.description;
  if (typeof patch.image === "string") updates.image = patch.image;
  if (typeof patch.sortOrder === "number") updates.sort_order = patch.sortOrder;
  if (typeof patch.slug === "string" && patch.slug.trim()) updates.slug = patch.slug.trim();

  const { error } = await getSupabase()
    .from("categories")
    .update(updates)
    .eq("id", id);
  if (error) fail("Nuk u ruajt kategoria.", error);
}

export async function deleteCategory(id: number): Promise<void> {
  const { error } = await getSupabase().from("categories").delete().eq("id", id);
  if (error) fail("Nuk u fshi kategoria.", error);
}

/* -------------------------------- products ------------------------------- */

export type ProductInput = {
  name: string;
  code: string;
  colorCodes?: Record<string, string>;
  price: number;
  dims: string;
  material: string;
  description: string;
  image: string;
  images: string[];
  sizes: string[];
  colors: string[];
  variants: ProductVariant[];
  salePct?: number;
  categoryId: number | null;
  customizable: boolean;
  active: boolean;
  featured?: boolean;
  featuredOrder?: number;
  sortOrder?: number;
  setName?: string | null;
  setNames?: string[];
};

export async function createProduct(input: ProductInput): Promise<Product> {
  const name = input.name.trim();
  if (!name) fail("Emri i produktit është i domosdoshëm.");

  const existing = await fetchProducts();
  const nextOrder = existing.length
    ? Math.max(...existing.map((p) => p.sortOrder)) + 1
    : 0;

  const images = Array.isArray(input.images) ? input.images : [];
  const setNames = Array.isArray(input.setNames)
    ? input.setNames.filter((s): s is string => typeof s === "string" && Boolean(s.trim()))
    : input.setName?.trim()
    ? [input.setName.trim()]
    : [];
  const setName = setNames[0] ?? input.setName?.trim() ?? null;
  const colorCodes = input.colorCodes ?? {};

  const { data, error } = await getSupabase()
    .from("products")
    .insert({
      category_id: input.categoryId,
      name,
      code: input.code ?? "",
      color_codes: colorCodes,
      price: (input.price ?? 0).toFixed(2),
      dims: input.dims ?? "",
      material: input.material ?? "",
      description: input.description ?? "",
      image: images[0] ?? input.image ?? "",
      images,
      sizes: Array.isArray(input.sizes) ? input.sizes : [],
      colors: Array.isArray(input.colors) ? input.colors : [],
      variants: toVariants(input.variants),
      sale_pct: Math.min(Math.max(Math.round(input.salePct ?? 0), 0), 90),
      sort_order:
        typeof input.sortOrder === "number" ? input.sortOrder : nextOrder,
      featured: Boolean(input.featured),
      featured_order:
        typeof input.featuredOrder === "number" ? input.featuredOrder : 0,
      customizable: Boolean(input.customizable),
      active: input.active === undefined ? true : Boolean(input.active),
      set_name: setName,
      set_names: setNames,
    })
    .select()
    .single();
  if (error) fail("Nuk u krijua produkti.", error);
  return toProduct(data as ProductRow);
}

export async function updateProduct(
  id: number,
  patch: Partial<ProductInput>
): Promise<void> {
  const updates: Record<string, unknown> = {};
  if (typeof patch.name === "string") updates.name = patch.name.trim();
  if (typeof patch.code === "string") updates.code = patch.code;
  if (patch.colorCodes && typeof patch.colorCodes === "object") {
    updates.color_codes = patch.colorCodes;
  }
  if (typeof patch.price === "number") updates.price = patch.price.toFixed(2);
  if (typeof patch.dims === "string") updates.dims = patch.dims;
  if (typeof patch.material === "string") updates.material = patch.material;
  if (typeof patch.description === "string") updates.description = patch.description;
  if (typeof patch.image === "string") updates.image = patch.image;
  if (Array.isArray(patch.images)) {
    updates.images = patch.images;
    updates.image = patch.images[0] ?? "";
  }
  if (Array.isArray(patch.sizes)) updates.sizes = patch.sizes;
  if (Array.isArray(patch.colors)) updates.colors = patch.colors;
  if (Array.isArray(patch.variants)) updates.variants = toVariants(patch.variants);
  if (typeof patch.salePct === "number") {
    updates.sale_pct = Math.min(Math.max(Math.round(patch.salePct), 0), 90);
  }
  if (typeof patch.sortOrder === "number") updates.sort_order = patch.sortOrder;
  if (typeof patch.featured === "boolean") updates.featured = patch.featured;
  if (typeof patch.featuredOrder === "number")
    updates.featured_order = patch.featuredOrder;
  if (typeof patch.customizable === "boolean")
    updates.customizable = patch.customizable;
  if (typeof patch.active === "boolean") updates.active = patch.active;
  if (patch.categoryId === null || typeof patch.categoryId === "number") {
    updates.category_id = patch.categoryId;
  }
  if (Array.isArray(patch.setNames)) {
    const sets = patch.setNames.filter((s): s is string => typeof s === "string" && Boolean(s.trim()));
    updates.set_names = sets;
    updates.set_name = sets[0] ?? null;
  } else if (typeof patch.setName !== "undefined") {
    const s = patch.setName?.trim() || null;
    updates.set_name = s;
    updates.set_names = s ? [s] : [];
  }

  const { error } = await getSupabase()
    .from("products")
    .update(updates)
    .eq("id", id);
  if (error) fail("Nuk u ruajt produkti.", error);
}

export async function deleteProduct(id: number): Promise<void> {
  const { error } = await getSupabase().from("products").delete().eq("id", id);
  if (error) fail("Nuk u fshi produkti.", error);
}

export async function deleteProducts(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await getSupabase().from("products").delete().in("id", ids);
  if (error) fail("Nuk u fshinë produktet.", error);
}

/* --------------------------------- orders -------------------------------- */

export type NewOrderPayload = {
  customerName: string;
  phone: string;
  address: string;
  notes: string;
  items: OrderItemPayload[];
};

/**
 * Public checkout. The order is created through the `create_order` Postgres
 * function (SECURITY DEFINER — see supabase/setup.sql), which validates the
 * payload, inserts the row and returns only the new id. The anon role can
 * execute that function but can never READ orders, so customer data stays
 * private while the customer still gets their order number — exactly like
 * the old POST /api/orders route.
 *
 * Email notification: after the insert, this function invokes the
 * `send-order-email` edge function directly (it reads the order from the DB
 * and reports the real result). A database webhook on INSERT can be added as
 * an optional backup — the edge function is idempotent and never double-sends.
 */
export async function createOrder(
  payload: NewOrderPayload
): Promise<{ order: Order; emailSent: boolean }> {
  const customerName = payload.customerName.trim();
  const phone = payload.phone.trim();
  const address = payload.address.trim();
  const notes = payload.notes.trim();
  const items = payload.items;

  if (!customerName || !phone || !address) {
    fail("Emri, telefoni dhe adresa janë të domosdoshme.");
  }
  if (!items.length) {
    fail("Shporta është bosh.");
  }

  const total = items.reduce((sum, it) => sum + it.price * it.qty, 0);

  const { data, error } = await getSupabase().rpc("create_order", {
    customer_name: customerName,
    phone,
    address,
    notes,
    items,
    total: Number(total.toFixed(2)),
  });
  if (error || typeof data !== "number") {
    fail(
      "Porosia nuk u regjistrua. Provoni përsëri ose porosisni në WhatsApp.",
      error
    );
  }

  // Ask the email edge function to notify the shop. Best-effort: if the
  // function is not deployed yet (or SMTP is missing) the order still
  // succeeds — the panel badge then shows "Email nuk u dërgua".
  let emailSent = false;
  try {
    const { data: mail } = await getSupabase().functions.invoke(
      "send-order-email",
      { body: { orderId: data } }
    );
    emailSent = Boolean((mail as { sent?: boolean } | null)?.sent);
  } catch (err) {
    console.warn("Order email function unavailable", err);
    emailSent = false;
  }

  const order: Order = {
    id: data as number,
    customerName,
    phone,
    address,
    notes,
    items,
    total,
    status: "e_re",
    emailSent,
    createdAt: new Date().toISOString(),
  };
  return { order, emailSent };
}

export async function updateOrderStatus(
  id: number,
  status: OrderStatus
): Promise<void> {
  const { error } = await getSupabase()
    .from("orders")
    .update({ status })
    .eq("id", id);
  if (error) fail("Nuk u ndryshua statusi i porosisë.", error);
}

export async function deleteOrder(id: number): Promise<void> {
  const { error } = await getSupabase().from("orders").delete().eq("id", id);
  if (error) fail("Nuk u fshi porosia.", error);
}

/* ------------------------------ admin auth ------------------------------- */

export async function getAdminSession(): Promise<Session | null> {
  const { data } = await getSupabase().auth.getSession();
  return data.session;
}

export async function signInAdmin(
  email: string,
  password: string
): Promise<void> {
  const { error } = await getSupabase().auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) {
    const msg = (error.message ?? "").toLowerCase();
    if (
      msg.includes("failed to fetch") ||
      msg.includes("fetch failed") ||
      msg.includes("networkerror")
    ) {
      fail(
        "Nuk u arrit në Supabase. Kontrolloni që NEXT_PUBLIC_SUPABASE_URL të jetë «Project URL» e saktë (p.sh. https://xxxx.supabase.co) dhe të jetë ribuild-uar faqja pas ndryshimit.",
        error
      );
    }
    if (msg.includes("email not confirmed")) {
      fail(
        "Email-i nuk është konfirmuar ende. Te Supabase: Authentication → Users → zgjidhni përdoruesin → konfirmoni email-in.",
        error
      );
    }
    if (msg.includes("invalid login credentials")) {
      fail("Email-i ose fjalëkalimi janë të gabuar.", error);
    }
    fail(`Hyrja dështoi: ${error.message}`, error);
  }
}

export async function signOutAdmin(): Promise<void> {
  await getSupabase().auth.signOut();
}

export function onAdminAuthChange(
  callback: (session: Session | null) => void
): () => void {
  const {
    data: { subscription },
  } = getSupabase().auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => subscription.unsubscribe();
}
