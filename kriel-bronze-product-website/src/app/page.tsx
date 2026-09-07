import { getCategories, getProducts } from "@/lib/data";
import LiveCatalog from "@/components/LiveCatalog";

// Pre-rendered once at `next build` (static export); refreshed live in the browser.
export const dynamic = "force-static";

export default async function HomePage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ onlyActive: true }),
  ]);

  return <LiveCatalog initialCategories={categories} initialProducts={products} />;
}
