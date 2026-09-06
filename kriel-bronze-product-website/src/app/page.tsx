import { getCatalog } from "@/db/catalog";
import HomeClient from "@/components/HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const catalog = await getCatalog();
  return <HomeClient catalog={catalog} />;
}
