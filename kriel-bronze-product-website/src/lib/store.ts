import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";
import type {
  Category,
  Order,
  OrderItemPayload,
  OrderStatus,
  Product,
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
  price: number | string;
  dims: string | null;
  material: string | null;
  description: string | null;
  image: string | null;
  sort_order: number;
  featured: boolean;
  featured_order: number;
  customizable: boolean;
  active: boolean;
};

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

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    code: row.code ?? "",
    price: Number(row.price),
    dims: row.dims ?? "",
    material: row.material ?? "",
    description: row.description ?? "",
    image: row.image ?? "",
    sortOrder: row.sort_order,
    featured: row.featured,
    featuredOrder: row.featured_order,
    customizable: row.customizable,
    active: row.active,
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
      "id, category_id, name, code, price, dims, material, description, image, sort_order, featured, featured_order, customizable, active"
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
  price: number;
  dims: string;
  material: string;
  description: string;
  image: string;
  categoryId: number | null;
  customizable: boolean;
  active: boolean;
  featured?: boolean;
  featuredOrder?: number;
  sortOrder?: number;
};

export async function createProduct(input: ProductInput): Promise<Product> {
  const name = input.name.trim();
  if (!name) fail("Emri i produktit është i domosdoshëm.");

  const existing = await fetchProducts();
  const nextOrder = existing.length
    ? Math.max(...existing.map((p) => p.sortOrder)) + 1
    : 0;

  const { data, error } = await getSupabase()
    .from("products")
    .insert({
      category_id: input.categoryId,
      name,
      code: input.code ?? "",
      price: (input.price ?? 0).toFixed(2),
      dims: input.dims ?? "",
      material: input.material ?? "",
      description: input.description ?? "",
      image: input.image ?? "",
      sort_order:
        typeof input.sortOrder === "number" ? input.sortOrder : nextOrder,
      featured: Boolean(input.featured),
      featured_order:
        typeof input.featuredOrder === "number" ? input.featuredOrder : 0,
      customizable: Boolean(input.customizable),
      active: input.active === undefined ? true : Boolean(input.active),
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
  if (typeof patch.price === "number") updates.price = patch.price.toFixed(2);
  if (typeof patch.dims === "string") updates.dims = patch.dims;
  if (typeof patch.material === "string") updates.material = patch.material;
  if (typeof patch.description === "string") updates.description = patch.description;
  if (typeof patch.image === "string") updates.image = patch.image;
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
 * Email notification (optional) is sent asynchronously by the Supabase
 * database webhook + edge function (see supabase/functions/) — so `emailSent`
 * is reported as false here, exactly like the old API when SMTP was not
 * configured.
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

  const order: Order = {
    id: data as number,
    customerName,
    phone,
    address,
    notes,
    items,
    total,
    status: "e_re",
    emailSent: false,
    createdAt: new Date().toISOString(),
  };
  return { order, emailSent: false };
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
