import { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import Categories from "./components/Categories";
import Catalogue from "./components/Catalogue";
import ProductSheet from "./components/ProductSheet";
import Craft from "./components/Craft";
import Materials from "./components/Materials";
import About from "./components/About";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import BottomNav from "./components/BottomNav";
import AdminPanel from "./components/AdminPanel";
import { PRODUCTS, Product } from "./data/catalogue";
import { ADMIN_HASH } from "./lib/adminConfig";
import { loadPublishedOverrides, mergeOverrides, ProductOverride, readStoredOverrides } from "./lib/catalogueOverrides";

export default function App() {
  const [cat, setCat] = useState("all");
  const [selected, setSelected] = useState<Product | null>(null);
  const [showAdmin, setShowAdmin] = useState(() => window.location.hash === ADMIN_HASH);
  const [overrides, setOverrides] = useState<ProductOverride[]>(() => readStoredOverrides());

  useEffect(() => {
    const syncHash = () => setShowAdmin(window.location.hash === ADMIN_HASH);
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    loadPublishedOverrides().then((published) => {
      if (published.length) setOverrides((local) => [...published, ...local]);
    });
  }, []);

  const products = useMemo(() => mergeOverrides(PRODUCTS, overrides), [overrides]);

  const pickCategory = (c: string) => {
    setCat(c);
    requestAnimationFrame(() => {
      document.getElementById("katalogu")?.scrollIntoView({ behavior: "smooth" });
    });
  };

  return (
    <div className="grain min-h-screen bg-ink text-ivory">
      <Header />
      <main>
        <Hero />
        <Marquee />
        <Categories onPick={pickCategory} />
        <Catalogue cat={cat} setCat={setCat} products={products} onOpen={setSelected} />
        <Craft />
        <Materials />
        <About />
        <Contact />
      </main>
      <Footer />
      <BottomNav />
      <ProductSheet p={selected} onClose={() => setSelected(null)} />
      {showAdmin && (
        <AdminPanel
          baseProducts={PRODUCTS}
          displayProducts={products}
          overrides={overrides}
          onOverridesChange={setOverrides}
          onClose={() => {
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
            setShowAdmin(false);
          }}
        />
      )}
    </div>
  );
}
