import { useState } from "react";
import { AdminProvider } from "./store/admin";
import type { Product } from "./data/catalog";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import Categories from "./components/Categories";
import Catalog from "./components/Catalog";
import Craft from "./components/Craft";
import About from "./components/About";
import Contact from "./components/Contact";
import Admin from "./components/Admin";
import Footer from "./components/Footer";
import Sheet from "./components/Sheet";

export default function App() {
  const [group, setGroup] = useState("all");
  const [open, setOpen] = useState<Product | null>(null);

  const pickCategory = (groupId: string) => {
    setGroup(groupId);
    document.getElementById("katalogu")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <AdminProvider>
      <div className="grain min-h-screen bg-ink text-ivory antialiased">
        <Nav />
        <main>
          <Hero />
          <Marquee />
          <Categories onPick={pickCategory} />
          <Catalog group={group} setGroup={setGroup} onOpen={setOpen} />
          <Craft />
          <About />
          <Contact />
          <Admin />
        </main>
        <Footer />
        <Sheet p={open} onClose={() => setOpen(null)} />
      </div>
    </AdminProvider>
  );
}
