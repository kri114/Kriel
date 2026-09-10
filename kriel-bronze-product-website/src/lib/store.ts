import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";
import { roundCents } from "./constants";
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
  price: number | string;
  dims: string | null;
  material: string | null;
  description: string | null;
  image: string | null;
  images: unknown;
  sort_order: number;
  featured: boolean;
  featured_order: number;
  customizable: boolean;
  active: boolean;
  discount_percent: number | string | null;
};

type VariantRow = {
  id: number;
  product_id: number;
  color: string | null;
  size: string | null;
  price: number | string | null;
  image: string | null;
  sort_order: number;
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
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    sortOrder: row.sort_order,
    featured: row.featured,
    featuredOrder: row.featured_order,
    customizable: row.customizable,
    active: row.active,
    discountPercent:
      row.discount_percent === null || row.discount_percent === undefined
        ? null
        : Number(row.discount_percent),
  };
}

function toVariant(row: VariantRow): ProductVariant {
  return {
    id: row.id,
    productId: row.product_id,
    color: row.color ?? "",
    size: row.size ?? "",
    price: row.price === null || row.price === undefined ? null : Number(row.price),
    image: row.image ?? "",
    sortOrder: row.sort_order,
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

/**
 * True when a Postgrest/Supabase error means "this column/table doesn't
 * exist yet" (error codes 42703 = undefined_column, 42P01 = undefined_table,
 * PGRST205 = schema-cache miss for a relation). This happens when the app's
 * code was updated (new features: multi-photo gallery, color/size variants,
 * "Ulje" discounts) but `supabase/setup.sql` hasn't been re-run yet on the
 * live database. In that case we degrade gracefully instead of discarding
 * the ENTIRE live catalog — see fetchProducts/fetchVariants below.
 */
function isMissingSchemaError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "42703" || error.code === "42P01" || error.code === "PGRST205") return true;
  const msg = error.message || "";
  return /column .* does not exist|relation .* does not exist|could not find the table/i.test(msg);
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

const PRODUCT_BASE_SELECT =
  "id, category_id, name, code, price, dims, material, description, image, sort_order, featured, featured_order, customizable, active";
const PRODUCT_FULL_SELECT = `${PRODUCT_BASE_SELECT}, images, discount_percent`;

export async function fetchProducts(options?: {
  onlyActive?: boolean;
}): Promise<Product[]> {
  const runQuery = (selectStr: string) => {
    let query = getSupabase()
      .from("products")
      .select(selectStr)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });
    if (options?.onlyActive) query = query.eq("active", true);
    return query;
  };

  let { data, error } = await runQuery(PRODUCT_FULL_SELECT);

  if (error && isMissingSchemaError(error)) {
    // The live database predates the "images"/"discount_percent" columns
    // (supabase/setup.sql hasn't been re-run yet). Retry with the original
    // column set so the REAL catalog still loads — new-feature fields just
    // default to "none" via toProduct() below — instead of throwing and
    // falling back to the tiny bundled placeholder catalog.
    console.warn(
      "products.images/discount_percent nuk ekzistojnë ende në bazën e të dhënave — " +
        "ekzekutoni sërish supabase/setup.sql për të aktivizuar galerinë e fotove dhe uljet. " +
        "Duke vazhduar me katalogun aktual pa këto veçori.",
      error
    );
    ({ data, error } = await runQuery(PRODUCT_BASE_SELECT));
  }

  if (error) fail("Nuk u ngarkuan produktet.", error);
  return (data as unknown as ProductRow[]).map(toProduct);
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
  images?: string[];
  categoryId: number | null;
  customizable: boolean;
  active: boolean;
  featured?: boolean;
  featuredOrder?: number;
  sortOrder?: number;
  /** Sale/"Ulje" percentage (0-100). null/undefined = no discount. */
  discountPercent?: number | null;
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
      images: Array.isArray(input.images) ? input.images : [],
      sort_order:
        typeof input.sortOrder === "number" ? input.sortOrder : nextOrder,
      featured: Boolean(input.featured),
      featured_order:
        typeof input.featuredOrder === "number" ? input.featuredOrder : 0,
      customizable: Boolean(input.customizable),
      active: input.active === undefined ? true : Boolean(input.active),
      discount_percent:
        input.discountPercent === undefined ? null : input.discountPercent,
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
  if (Array.isArray(patch.images)) updates.images = patch.images;
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
  if (patch.discountPercent === null) {
    updates.discount_percent = null;
  } else if (typeof patch.discountPercent === "number") {
    updates.discount_percent = patch.discountPercent;
  }

  const { error } = await getSupabase()
    .from("products")
    .update(updates)
    .eq("id", id);
  if (error) fail("Nuk u ruajt produkti.", error);
}

/**
 * Bulk-adjusts ALL prices belonging to a single product by a percentage —
 * the product's base price plus every one of its variants that has its own
 * explicit price override (variants that inherit the base price need no
 * change, since they automatically scale with it). Only this product is
 * affected; nothing else in the catalog changes.
 *
 * `percent` is signed: e.g. 10 increases prices by 10%, -15 decreases them
 * by 15%.
 */
export async function adjustProductPricesByPercent(
  product: Product,
  productVariants: ProductVariant[],
  percent: number
): Promise<void> {
  if (!Number.isFinite(percent) || percent === 0) return;
  const factor = 1 + percent / 100;
  const newBasePrice = Math.max(0, roundCents(product.price * factor));
  await updateProduct(product.id, { price: newBasePrice });
  const withOwnPrice = productVariants.filter((v) => v.price !== null);
  await Promise.all(
    withOwnPrice.map((v) =>
      updateVariant(v.id, { price: Math.max(0, roundCents((v.price as number) * factor)) })
    )
  );
}

export async function deleteProduct(id: number): Promise<void> {
  const { error } = await getSupabase().from("products").delete().eq("id", id);
  if (error) fail("Nuk u fshi produkti.", error);
}

/* ----------------------------- product variants --------------------------- */
/* Color/size options — each row can override the product's base price and   */
/* optionally show its own photo. See supabase/setup.sql (product_variants). */

export type VariantInput = {
  productId: number;
  color: string;
  size: string;
  /** null = inherit the product's base price */
  price: number | null;
  image: string;
  sortOrder?: number;
};

/**
 * Fetches ALL variants in one call (small catalog — cheaper than N+1 queries
 * per product). Public visitors only see variants belonging to active
 * products (enforced by RLS); the admin panel sees everything.
 *
 * If the `product_variants` table doesn't exist yet (live database predates
 * this feature — supabase/setup.sql hasn't been re-run), this returns an
 * empty list instead of throwing, so it never takes down the rest of the
 * catalog (categories/products) with it.
 */
export async function fetchVariants(): Promise<ProductVariant[]> {
  const { data, error } = await getSupabase()
    .from("product_variants")
    .select("id, product_id, color, size, price, image, sort_order")
    .order("product_id", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  if (error) {
    if (isMissingSchemaError(error)) {
      console.warn(
        "Tabela product_variants nuk ekziston ende — ekzekutoni sërish " +
          "supabase/setup.sql për të aktivizuar opsionet ngjyrë/përmasë. " +
          "Duke vazhduar pa variante.",
        error
      );
      return [];
    }
    fail("Nuk u ngarkuan variantet e produkteve.", error);
  }
  return (data as VariantRow[]).map(toVariant);
}

export async function createVariant(input: VariantInput): Promise<ProductVariant> {
  const { data, error } = await getSupabase()
    .from("product_variants")
    .insert({
      product_id: input.productId,
      color: input.color.trim(),
      size: input.size.trim(),
      price: input.price === null ? null : input.price.toFixed(2),
      image: input.image ?? "",
      sort_order: input.sortOrder ?? 0,
    })
    .select()
    .single();
  if (error) fail("Nuk u krijua opsioni (ngjyrë/madhësi).", error);
  return toVariant(data as VariantRow);
}

export async function updateVariant(
  id: number,
  patch: Partial<VariantInput>
): Promise<void> {
  const updates: Record<string, unknown> = {};
  if (typeof patch.color === "string") updates.color = patch.color.trim();
  if (typeof patch.size === "string") updates.size = patch.size.trim();
  if (patch.price === null) updates.price = null;
  else if (typeof patch.price === "number") updates.price = patch.price.toFixed(2);
  if (typeof patch.image === "string") updates.image = patch.image;
  if (typeof patch.sortOrder === "number") updates.sort_order = patch.sortOrder;

  const { error } = await getSupabase()
    .from("product_variants")
    .update(updates)
    .eq("id", id);
  if (error) fail("Nuk u ruajt opsioni (ngjyrë/madhësi).", error);
}

export async function deleteVariant(id: number): Promise<void> {
  const { error } = await getSupabase().from("product_variants").delete().eq("id", id);
  if (error) fail("Nuk u fshi opsioni (ngjyrë/madhësi).", error);
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

export type TestOrderEmailResult = {
  sent: boolean;
  reason?: string;
  error?: string;
  orderId?: number;
};

const EMAIL_REASON_LABEL: Record<string, string> = {
  order_not_found: "Nuk u gjet porosi me këtë ID në bazën e të dhënave.",
  missing_order_id: "Përgjigja e funksionit s'kishte ID porosie — kontrolloni Logs.",
  resend_not_configured: "RESEND_API_KEY nuk është vendosur te Secrets e funksionit.",
  resend_error: "Resend refuzoi dërgimin — shihni detajet dhe Logs (shpesh 403 = domain i paverifikuar).",
  unrecognized_payload: "Payload i panjohur — kontrolloni Logs.",
  method_not_allowed: "Metodë e pavlefshme kërkese.",
  invalid_json: "JSON i pavlefshëm u dërgua te funksioni.",
  unexpected_error: "Gabim i papritur brenda funksionit — shihni Logs.",
};

/**
 * Manually invokes the send-order-email Edge Function for a given order id
 * — used by the admin panel's "Test Email" button. Unlike the automatic
 * Database Webhook (server-to-server), this call happens from the browser,
 * so it requires the Edge Function to answer CORS preflight requests
 * correctly (see supabase/functions/send-order-email/index.ts).
 */
export async function sendTestOrderEmail(
  orderId: number
): Promise<TestOrderEmailResult> {
  const { data, error } = await getSupabase().functions.invoke(
    "send-order-email",
    { body: { orderId } }
  );

  if (error) {
    const message = error.message || "";
    const looksLikeNetworkFailure =
      error.name === "FunctionsFetchError" ||
      error.name === "FunctionsRelayError" ||
      /failed to fetch|failed to send a request|network/i.test(message);

    if (looksLikeNetworkFailure) {
      fail(
        'Funksioni nuk u thirr (Failed to send a request to the Edge Function). Kontrolloni: ' +
          '1) funksioni "send-order-email" është deploy-uar me kodin më të ri (duhet të trajtojë ' +
          'CORS/OPTIONS — shih supabase/functions/send-order-email/index.ts), 2) "Enforce JWT ' +
          'Verification" është OFF te cilësimet e funksionit, 3) NEXT_PUBLIC_SUPABASE_URL dhe ' +
          'NEXT_PUBLIC_SUPABASE_ANON_KEY janë të sakta dhe faqja është ribuild-uar në Render.',
        error
      );
    }
    fail(message || "Testimi i email-it dështoi.", error);
  }

  const result = (data ?? { sent: false }) as TestOrderEmailResult;
  if (!result.sent && result.reason && EMAIL_REASON_LABEL[result.reason]) {
    result.error = result.error
      ? `${EMAIL_REASON_LABEL[result.reason]} (${result.error})`
      : EMAIL_REASON_LABEL[result.reason];
  }
  return result;
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
    // "Invalid path specified in request URL" (and similar low-level fetch
    // errors) mean NEXT_PUBLIC_SUPABASE_URL is misconfigured — not that the
    // email/password are wrong. Surface a message that points at the real
    // problem instead of misleading the admin into retyping credentials.
    const raw = error.message || "";
    if (/invalid path|failed to fetch|networkerror|invalid url/i.test(raw)) {
      fail(
        "Lidhja me Supabase dështoi — NEXT_PUBLIC_SUPABASE_URL duket i pasaktë. Duhet të jetë vetëm https://xxxx.supabase.co (pa /rest/v1, pa slash në fund, nga Project Settings → Data API).",
        error
      );
    }
    fail("Email-i ose fjalëkalimi janë të gabuar.", error);
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
