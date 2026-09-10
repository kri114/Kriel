"use client";

import { useState } from "react";
import Header from "./Header";
import Hero from "./Hero";
import Marquee from "./Marquee";
import Deals from "./Deals";
import Categories from "./Categories";
import ProductsSection from "./ProductsSection";
import ProductSheet from "./ProductSheet";
import Craft from "./Craft";
import Materials from "./Materials";
import About from "./About";
import Contact from "./Contact";
import Footer from "./Footer";
import BottomNav from "./BottomNav";
import CartDrawer from "./CartDrawer";
import { CartProvider } from "./CartContext";
import type { Category, Product, ProductVariant } from "@/lib/types";

export default function Site({
  categories,
  products,
  variants,
}: {
  categories: Category[];
  products: Product[];
  variants: ProductVariant[];
}) {
  const [activeCat, setActiveCat] = useState("all");
  const [selected, setSelected] = useState<Product | null>(null);

  const pickCategory = (slug: string) => {
    setActiveCat(slug);
    requestAnimationFrame(() => {
      document.getElementById("katalogu")?.scrollIntoView({ behavior: "smooth" });
    });
  };

  const selectedCategory = selected
    ? categories.find((c) => c.id === selected.categoryId) ?? null
    : null;
  const selectedVariants = selected ? variants.filter((v) => v.productId === selected.id) : [];

  return (
    <CartProvider>
      <div className="grain min-h-screen bg-ink text-ivory">
        <Header />
        <main>
          <Hero />
          <Marquee />
          <Deals products={products} onOpen={setSelected} />
          <Categories categories={categories} products={products} onPick={pickCategory} />
          <ProductsSection
            categories={categories}
            products={products}
            onOpen={setSelected}
            activeCat={activeCat}
            setActiveCat={setActiveCat}
          />
          <Craft />
          <Materials />
          <About />
          <Contact />
        </main>
        <Footer />
        <BottomNav />
        <ProductSheet
          p={selected}
          category={selectedCategory}
          variants={selectedVariants}
          onClose={() => setSelected(null)}
        />
        <CartDrawer />
      </div>
    </CartProvider>
  );
}
