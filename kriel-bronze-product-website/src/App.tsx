import { useState } from "react";
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
import { Product } from "./data/catalogue";

export default function App() {
  const [cat, setCat] = useState("all");
  const [selected, setSelected] = useState<Product | null>(null);

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
        <Catalogue cat={cat} setCat={setCat} onOpen={setSelected} />
        <Craft />
        <Materials />
        <About />
        <Contact />
      </main>
      <Footer />
      <BottomNav />
      <ProductSheet p={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
