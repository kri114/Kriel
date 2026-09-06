"use client";

import { useCallback, useMemo, useState } from "react";
import Header from "./Header";
import Hero from "./Hero";
import Marquee from "./Marquee";
import Featured from "./Featured";
import Categories from "./Categories";
import Catalogue from "./Catalogue";
import ProductSheet from "./ProductSheet";
import Craft from "./Craft";
import Materials from "./Materials";
import About from "./About";
import Contact from "./Contact";
import Footer from "./Footer";
import BottomNav from "./BottomNav";
import type { CatalogPayload, ProductDto } from "@/lib/types";

export default function HomeClient({ catalog }: { catalog: CatalogPayload }) {
  const [cat, setCat] = useState("all");
  const [selected, setSelected] = useState<ProductDto | null>(null);

  const pickCategory = useCallback((c: string) => {
    setCat(c);
    requestAnimationFrame(() => {
      document.getElementById("katalogu")?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  const selectedCategoryName = useMemo(
    () => catalog.categories.find((c) => c.id === selected?.categoryId)?.name ?? "",
    [catalog.categories, selected]
  );

  return (
    <div className="grain min-h-screen bg-ink text-ivory">
      <Header />
      <main>
        <Hero />
        <Marquee />
        <Featured products={catalog.products} categories={catalog.categories} onOpen={setSelected} />
        <Categories categories={catalog.categories} onPick={pickCategory} />
        <Catalogue
          cat={cat}
          setCat={setCat}
          onOpen={setSelected}
          products={catalog.products}
          categories={catalog.categories}
        />
        <Craft />
        <Materials />
        <About />
        <Contact />
      </main>
      <Footer />
      <BottomNav />
      <ProductSheet p={selected} categoryName={selectedCategoryName} onClose={() => setSelected(null)} />
    </div>
  );
}
