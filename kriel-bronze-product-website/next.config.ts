import type { NextConfig } from "next";

/**
 * Static export for Render Static Sites.
 *
 * The app contains NO server-side routes, server actions, dynamic database
 * queries or request-time rendering — every page is prerendered and all
 * dynamic data (catalog, orders, admin) is fetched in the browser from the
 * external Supabase backend.
 *
 * Building with STATIC_EXPORT=1 (`STATIC_EXPORT=1 npm run build`, the Render
 * build command) emits a pure static site into `out/` that any static host
 * can serve. A plain `npm run build` produces the same prerendered pages in
 * a Node-startable form, which is useful for local preview/healthchecks;
 * the shipped runtime code is identical either way.
 */
const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(staticExport ? { output: "export" as const } : {}),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
