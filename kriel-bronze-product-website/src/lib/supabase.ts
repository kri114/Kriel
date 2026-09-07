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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isBackendConfigured(): boolean {
  return supabaseUrl.startsWith("http") && supabaseAnonKey.length > 20;
}

let browserClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!isBackendConfigured()) {
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
