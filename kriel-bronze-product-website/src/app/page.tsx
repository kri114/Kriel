import { getCategories, getProducts } from "@/lib/data";
import Site from "@/components/Site";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ onlyActive: true }),
  ]);

  return <Site categories={categories} products={products} />;
}
