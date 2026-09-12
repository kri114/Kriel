import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client.
 *
 * The URL and the anon (publishable) key are NOT secrets — they are designed
 * to be embedded in client-side code. All authorization is enforced by
 * Postgres Row Level Security policies on the Supabase project itself:
 *
 *   - anyone           -> read categories, read ACTIVE products, create orders
 *   - authenticated    -> full access (the admin account created in Supabase)
 *
 * When the env vars are missing the site runs in "offline catalog" mode:
 * the public site renders the bundled default catalog and the admin panel
 * shows setup instructions instead of a login form.
 */

const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const rawKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

/**
 * Normalizes the configured project URL.
 *
 * Also repairs the two most common copy-paste mistakes instead of failing
 * with cryptic auth errors later:
 *   1. A Supabase DASHBOARD url ("https://supabase.com/dashboard/project/<ref>")
 *      is converted into the API url ("https://<ref>.supabase.co").
 *   2. An API url with an accidental path/query (e.g. "...supabase.co/auth/v1")
 *      is stripped back to the origin.
 *
 * Returns null when the value cannot be understood at all.
 */
export function normalizeSupabaseUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;

    if (url.hostname === "supabase.com" || url.hostname === "www.supabase.com" || url.hostname === "app.supabase.com") {
      const ref = url.pathname.match(/\/(?:dashboard\/)?project\/([a-z0-9]{6,40})/i)?.[1];
      return ref ? `https://${ref.toLowerCase()}.supabase.co` : null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

const supabaseUrl = normalizeSupabaseUrl(rawUrl) ?? "";
const supabaseAnonKey = rawKey;

export function isBackendConfigured(): boolean {
  return supabaseUrl.startsWith("http") && supabaseAnonKey.length > 20;
}

/** The Supabase project the browser bundle talks to ("" when offline-mode). */
export function getSupabasePublicUrl(): string {
  return supabaseUrl;
}

let browserClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!isBackendConfigured()) {
    if (rawUrl && !supabaseUrl) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL ka vlerë të pavlefshme. Ajo duhet të jetë «Project URL» nga Supabase (Project Settings → Data API), p.sh. https://abcdefgh.supabase.co"
      );
    }
    throw new Error(
      "Supabase nuk është konfiguruar. Vendosni NEXT_PUBLIC_SUPABASE_URL dhe NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return browserClient;
}
