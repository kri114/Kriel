import type { NextConfig } from "next";

/**
 * This project is a pure STATIC site.
 *
 * `npm run build` always exports the fully prerendered site into the
 * `out/` directory — standard HTML/CSS/JS that any static host can serve.
 * For a Render Static Site use:
 *
 *   Build Command:      npm install && npm run build
 *   Publish Directory:  out
 *
 * The app contains NO server-side routes, server actions, dynamic database
 * queries or request-time rendering. All dynamic data (catalog, orders,
 * admin) is fetched in the browser from the external Supabase backend, and
 * the only API route (/api/health) is prerendered as a static file.
 *
 * `npm run start` serves the generated `out/` folder locally (see
 * scripts/serve-static.mjs); `npm run dev` runs the Next.js dev server.
 */
const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
