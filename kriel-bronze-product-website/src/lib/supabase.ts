import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Public Supabase configuration.
 *
 * Both values are safe to ship to the browser: the anon key can only do what
 * the Row Level Security policies in `supabase/schema.sql` allow.
 * Never put the service_role key or the Postgres connection string here.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const MEDIA_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "kriel-media";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let browserClient: SupabaseClient | null = null;

/** Lazily created singleton (works both in the browser and at build time). */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!browserClient) {
    browserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: typeof window !== "undefined",
        autoRefreshToken: typeof window !== "undefined",
        detectSessionInUrl: false,
      },
    });
  }
  return browserClient;
}

/** Throws a friendly (Albanian) error when the client is not configured. */
export function requireSupabase(): SupabaseClient {
  const client = getSupabase();
  if (!client) {
    throw new Error(
      "Supabase nuk është konfiguruar. Vendosni NEXT_PUBLIC_SUPABASE_URL dhe NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  return client;
}
