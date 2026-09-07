import type { NextConfig } from "next";

/**
 * The public KRIEL site is exported as pure static HTML/CSS/JS ("out/" folder)
 * so it can be hosted on Render as a Static Site. All dynamic data
 * (categories, products, orders, images) lives in Supabase and is accessed
 * from the browser with the public anon key + Row Level Security.
 *
 * Static export is ON by default. Only a local preview that must run
 * `next start` (e.g. a Node sandbox) sets NEXT_STATIC_EXPORT=false in its
 * own .env — never set that on Render.
 */
const staticExport = process.env.NEXT_STATIC_EXPORT !== "false";

const nextConfig: NextConfig = {
  ...(staticExport ? { output: "export" as const } : {}),
  // Produces /admin/index.html etc. so every static host resolves the routes.
  trailingSlash: true,
  images: {
    // next/image optimisation needs a server – disable for static export.
    unoptimized: true,
  },
};

export default nextConfig;
