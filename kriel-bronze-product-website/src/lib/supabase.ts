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

/**
 * Normalize a pasted Supabase "Project URL" down to its bare origin.
 *
 * A very common configuration mistake (and the cause of the Supabase SDK
 * error "Invalid path specified in request URL") is setting
 * NEXT_PUBLIC_SUPABASE_URL to something other than the bare project URL —
 * e.g. pasting the REST endpoint (".../rest/v1"), the SQL editor URL, a
 * value with a trailing slash, or one with stray quotes/whitespace. The
 * Supabase client appends its own paths (/auth/v1/..., /rest/v1/...) to
 * whatever we give it, so any extra path segment produces a malformed,
 * doubled path. We defensively strip everything except protocol + host.
 */
function normalizeSupabaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/^['"]|['"]$/g, "");
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "";
  }
}

const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

export function isBackendConfigured(): boolean {
  return supabaseUrl.startsWith("http") && supabaseAnonKey.length > 20;
}

let browserClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!isBackendConfigured()) {
    throw new Error(
      "Supabase nuk është konfiguruar. Vendosni NEXT_PUBLIC_SUPABASE_URL (vetëm https://xxxx.supabase.co, pa /rest/v1 apo shtesa të tjera) dhe NEXT_PUBLIC_SUPABASE_ANON_KEY."
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
