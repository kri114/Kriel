import SiteLoader from "@/components/SiteLoader";

// Fully static homepage — prerendered into out/index.html at build time.
// The catalog itself is loaded client-side from Supabase (or the bundled
// fallback catalog), so no server or database is needed to serve the page.
export default function HomePage() {
  return <SiteLoader />;
}
