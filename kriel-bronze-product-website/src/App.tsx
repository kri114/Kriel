import { useCallback, useEffect, useState } from "react";
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
import { CatalogAdminProvider, useCatalogAdmin } from "./admin/CatalogAdmin";
import { Product } from "./data/catalogue";

function Site() {
  const { products } = useCatalogAdmin();
  const [cat, setCat] = useState("all");
  const [selected, setSelected] = useState<Product | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);

  // Hyrja sekrete:  juaj-faqja/#kriel-admin   ose  eventi "kriel:open-admin"
  useEffect(() => {
    const fromHash = () => {
      if (window.location.hash === "#kriel-admin") setAdminOpen(true);
    };
    fromHash();
    const viaEvent = () => setAdminOpen(true);
    window.addEventListener("hashchange", fromHash);
    window.addEventListener("kriel:open-admin", viaEvent);
    return () => {
      window.removeEventListener("hashchange", fromHash);
      window.removeEventListener("kriel:open-admin", viaEvent);
    };
  }, []);

  const closeAdmin = useCallback(() => {
    setAdminOpen(false);
    if (window.location.hash === "#kriel-admin") {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  // Nëse produkti i hapur u ndryshua nga admini, rifresko të dhënat e tij
  useEffect(() => {
    if (selected) {
      const fresh = products.find((p) => p.id === selected.id) ?? null;
      if (JSON.stringify(fresh) !== JSON.stringify(selected)) setSelected(fresh);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

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
        <Categories products={products} onPick={pickCategory} />
        <Catalogue cat={cat} setCat={setCat} onOpen={setSelected} products={products} />
        <Craft />
        <Materials />
        <About />
        <Contact />
      </main>
      <Footer />
      <BottomNav />
      <ProductSheet p={selected} onClose={() => setSelected(null)} />
      <AdminPanel open={adminOpen} onClose={closeAdmin} />
    </div>
  );
}

export default function App() {
  return (
    <CatalogAdminProvider>
      <Site />
    </CatalogAdminProvider>
  );
}
