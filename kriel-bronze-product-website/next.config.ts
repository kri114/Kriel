import type { NextConfig } from "next";

/**
 * Static export for Render Static Sites — auto-detected, zero extra config.
 *
 * Render automatically sets `RENDER=true` for every build on its platform
 * (documented default environment variable, present for Static Sites too:
 * https://render.com/docs/environment-variables). We use that signal to
 * enable `output: "export"` automatically, so your existing Render Build
 * Command — `npm install && npm run build` — always produces the static
 * `out/` directory with NO extra environment variable required.
 *
 * Locally (or in any environment without RENDER=true) the app builds/starts
 * as a normal Next.js server, which is convenient for local development and
 * previews. The app has no server-side routes, server actions, or dynamic
 * database queries either way — all pages are fully prerenderable and every
 * dynamic feature (catalog, admin, orders) runs client-side against the
 * external Supabase backend — so both build modes ship identical UI code.
 */
const isRenderBuild = process.env.RENDER === "true";

const nextConfig: NextConfig = {
  ...(isRenderBuild
    ? {
        output: "export" as const,
        // Export "/admin/index.html" instead of "/admin.html" so static
        // hosts resolve "/admin" and "/admin/" to the right file with zero
        // custom rewrite rules.
        trailingSlash: true,
      }
    : {}),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
