import type { NextConfig } from "next";

/**
 * Kriel — Bronze Product Website
 *
 * This app runs as a Next.js server (not static export) so it can be served
 * by the platform's build_and_start and /api/health healthcheck works.
 *
 * All dynamic data (catalog, orders, admin) is still fetched client-side
 * from the external Supabase backend — no server-side database queries
 * are made at request time.
 */
const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
