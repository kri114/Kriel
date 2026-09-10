"use client";

import { useMemo, useState } from "react";
import { Search, ArrowUpDown, PackageSearch, ChevronDown, Tag } from "lucide-react";
import { Reveal, Eyebrow } from "./Reveal";
import ProductCard from "./ProductCard";
import type { Category, Product } from "@/lib/types";

const REVEAL_STEP = 6;

export default function ProductsSection({
  categories,
  products,
  onOpen,
  activeCat,
  setActiveCat,
}: {
  categories: Category[];
  products: Product[];
  onOpen: (p: Product) => void;
  activeCat: string;
  setActiveCat: (c: string) => void;
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"def" | "asc" | "desc">("def");
  const [revealCount, setRevealCount] = useState(0);

  const categoryOrderMap = useMemo(() => {
    const m: Record<number, number> = {};
    categories.forEach((c) => (m[c.id] = c.sortOrder));
    return m;
  }, [categories]);

  const categoryBySlug = useMemo(() => {
    const m: Record<string, Category> = {};
    categories.forEach((c) => (m[c.slug] = c));
    return m;
  }, [categories]);

  const fullSorted = useMemo(() => {
    return [...products].sort((a, b) => {
      const catA = a.categoryId != null ? categoryOrderMap[a.categoryId] ?? 999 : 999;
      const catB = b.categoryId != null ? categoryOrderMap[b.categoryId] ?? 999 : 999;
      if (catA !== catB) return catA - catB;
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.id - b.id;
    });
  }, [products, categoryOrderMap]);

  const featured = useMemo(() => {
    return products
      .filter((p) => p.featured)
      .sort((a, b) => a.featuredOrder - b.featuredOrder || a.id - b.id)
      .slice(0, 3);
  }, [products]);

  const saleProducts = useMemo(
    () => fullSorted.filter((p) => (p.salePct ?? 0) > 0),
    [fullSorted]
  );

  const featuredIds = useMemo(() => new Set(featured.map((p) => p.id)), [featured]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: products.length };
    products.forEach((p) => {
      const cat = categories.find((cc) => cc.id === p.categoryId);
      if (cat) c[cat.slug] = (c[cat.slug] || 0) + 1;
    });
    return c;
  }, [products, categories]);

  const searchActive = q.trim() !== "";
  const catActive = activeCat !== "all";
  const isDefaultView = !searchActive && !catActive && sort === "def";

  const filteredList = useMemo(() => {
    let list = fullSorted.filter((p) => {
      const cat = categories.find((c) => c.id === p.categoryId);
      const matchesCat = activeCat === "all" || cat?.slug === activeCat;
      const matchesQ =
        !searchActive || (p.name + " " + p.code).toLowerCase().includes(q.trim().toLowerCase());
      return matchesCat && matchesQ;
    });
    if (sort === "asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "desc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [fullSorted, activeCat, categories, searchActive, q, sort]);

  const remainingAfterFeatured = useMemo(
    () => fullSorted.filter((p) => !featuredIds.has(p.id)),
    [fullSorted, featuredIds]
  );

  const displayed = isDefaultView
    ? [...featured, ...remainingAfterFeatured.slice(0, revealCount)]
    : filteredList;

  const canShowMore = isDefaultView && revealCount < remainingAfterFeatured.length;
  const showFeaturedBadgeIds = isDefaultView ? featuredIds : new Set<number>();

  return (
    <section id="katalogu" className="relative py-20 sm:py-28 bg-ink-2/40">
      <div className="hairline absolute top-0 inset-x-6" />
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="text-center">
          <Reveal><Eyebrow>Katalogu</Eyebrow></Reveal>
          <Reveal delay={0.08}>
            <h2 className="mt-4 font-display text-4xl sm:text-[52px] font-medium leading-[1.02] text-ivory">
              Të preferuarat nga <em className="text-bronze-grad not-italic font-semibold">klientët tanë</em>
            </h2>
          </Reveal>
          <Reveal delay={0.14}>
            <p className="mx-auto mt-4 max-w-xl text-[14.5px] leading-relaxed text-ivory-2/80 font-light">
              Fillojmë me produktet më të kërkuara — shtypni &ldquo;Shfaq më shumë&rdquo; për të parë
              gjithë katalogun, kategori pas kategorie. Çmimet janë orientuese, me TVSH të përfshirë.
            </p>
          </Reveal>
        </div>

        {saleProducts.length > 0 && (
          <Reveal delay={0.12}>
            <div className="mt-11 rounded-[24px] border border-bronze/40 bg-gradient-to-br from-bronze/[0.09] via-transparent to-transparent p-4 sm:p-6">
              <div className="mb-4 flex items-center gap-3 px-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#e8b56a] via-bronze to-bronze-2 px-3.5 py-1.5 text-[11px] font-bold tracking-[0.2em] uppercase text-ink shadow-[0_6px_20px_rgba(201,163,92,0.35)]">
                  <Tag size={12} strokeWidth={2.4} /> Ofertat
                </span>
                <span className="hairline h-px flex-1" />
                <span className="text-[11px] tracking-[0.14em] uppercase text-ivory-2/60">
                  {saleProducts.length} {saleProducts.length === 1 ? "produkt" : "produkte"} në ulje
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {saleProducts.map((p, i) => (
                  <ProductCard key={p.id} product={p} onOpen={onOpen} index={i} />
                ))}
              </div>
            </div>
          </Reveal>
        )}

        <Reveal delay={0.2}>
          <div className="sticky top-16 z-30 -mx-5 sm:mx-0 mt-10 px-5 sm:px-0 py-3 bg-ink/85 backdrop-blur-xl sm:rounded-2xl sm:border sm:border-line">
            <div className="flex gap-2 items-center">
              <div className="relative flex-1 min-w-0">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bronze/70" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Kërko emër ose kod…"
                  className="w-full rounded-full border border-line bg-ink-3/60 py-2.5 pl-10 pr-4 text-[13.5px] text-ivory placeholder:text-ivory-2/40 transition-colors"
                />
              </div>
              <div className="relative shrink-0">
                <ArrowUpDown size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-bronze/70 pointer-events-none" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                  className="appearance-none rounded-full border border-line bg-ink-3/60 py-2.5 pl-8 pr-8 text-[12.5px] font-semibold text-ivory-2"
                >
                  <option value="def">Renditja</option>
                  <option value="asc">Çmimi: ulët → lartë</option>
                  <option value="desc">Çmimi: lartë → ulët</option>
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-bronze/60 pointer-events-none" />
              </div>
            </div>
            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-0.5">
              <Chip active={activeCat === "all"} onClick={() => setActiveCat("all")} label="Të gjitha" count={counts.all} />
              {categories.map((c) => (
                <Chip
                  key={c.id}
                  active={activeCat === c.slug}
                  onClick={() => setActiveCat(c.slug)}
                  label={c.name}
                  count={counts[c.slug] || 0}
                />
              ))}
            </div>
          </div>
        </Reveal>

        <div className="mt-6 flex items-baseline justify-between px-1">
          <p className="text-[11.5px] tracking-[0.22em] uppercase text-ivory-2/60">
            {isDefaultView
              ? `${displayed.length} nga ${products.length} produkte`
              : `${displayed.length} produkte ${catActive ? `· ${categoryBySlug[activeCat]?.name ?? ""}` : ""}`}
          </p>
          {q && (
            <button onClick={() => setQ("")} className="text-[11.5px] text-bronze underline underline-offset-4">
              Pastro kërkimin
            </button>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {displayed.map((p, i) => (
            <ProductCard
              key={p.id}
              product={p}
              onOpen={onOpen}
              index={i}
              featuredBadge={showFeaturedBadgeIds.has(p.id)}
            />
          ))}
        </div>

        {displayed.length === 0 && (
          <div className="mt-16 flex flex-col items-center text-center gap-3 text-ivory-2/70">
            <PackageSearch size={34} strokeWidth={1.4} className="text-bronze/60" />
            <p className="font-display text-2xl text-ivory">Asnjë produkt nuk u gjet</p>
            <p className="text-sm font-light">Provoni një tjetër term kërkimi ose kategori.</p>
          </div>
        )}

        {canShowMore && (
          <div className="mt-10 flex justify-center">
            <button
              onClick={() => setRevealCount((n) => n + REVEAL_STEP)}
              className="inline-flex items-center gap-2 rounded-full border border-bronze/45 px-8 py-3.5 text-[13.5px] font-bold text-bronze hover:bg-bronze hover:text-ink transition-all duration-300"
            >
              Shfaq më shumë
              <ChevronDown size={16} strokeWidth={2.4} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function Chip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-semibold tracking-wide transition-all duration-300 ${
        active
          ? "bg-gradient-to-r from-[#ecd9a8] via-bronze to-bronze-2 text-ink shadow-[0_6px_20px_rgba(201,163,92,0.35)]"
          : "border border-line bg-ink-3/50 text-ivory-2 hover:border-bronze/40 hover:text-bronze"
      }`}
    >
      {label}
      <span className={`text-[10px] font-bold ${active ? "text-ink/70" : "text-bronze/60"}`}>{count}</span>
    </button>
  );
}
