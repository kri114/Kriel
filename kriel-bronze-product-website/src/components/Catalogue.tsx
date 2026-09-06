import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, ArrowUpDown, Plus, PackageSearch } from "lucide-react";
import { CATEGORIES, Product } from "../data/catalogue";
import { Reveal, Eyebrow } from "./Reveal";

const fmtEUR = (n: number) =>
  "€ " + n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Catalogue({
  cat,
  setCat,
  onOpen,
  products,
}: {
  cat: string;
  setCat: (c: string) => void;
  onOpen: (p: Product) => void;
  products: Product[];
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"def" | "asc" | "desc">("def");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: products.length };
    products.forEach((p) => (c[p.cat] = (c[p.cat] || 0) + 1));
    return c;
  }, [products]);

  const list = useMemo(() => {
    let items = products.filter(
      (p) =>
        (cat === "all" || p.cat === cat) &&
        (q.trim() === "" ||
          (p.name + " " + p.code).toLowerCase().includes(q.trim().toLowerCase()))
    );
    if (sort === "asc") items = [...items].sort((a, b) => a.price - b.price);
    if (sort === "desc") items = [...items].sort((a, b) => b.price - a.price);
    return items;
  }, [cat, q, sort, products]);

  return (
    <section id="katalogu" className="relative py-20 sm:py-28 bg-ink-2/40">
      <div className="hairline absolute top-0 inset-x-6" />
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="text-center">
          <Reveal><Eyebrow>Katalogu 2025</Eyebrow></Reveal>
          <Reveal delay={0.08}>
            <h2 className="mt-4 font-display text-4xl sm:text-[52px] font-medium leading-[1.02] text-ivory">
              Çdo vepër, me <em className="text-bronze-grad not-italic font-semibold">çmimin përkatës</em>
            </h2>
          </Reveal>
          <Reveal delay={0.14}>
            <p className="mx-auto mt-4 max-w-xl text-[14.5px] leading-relaxed text-ivory-2/80 font-light">
              Të dhënat dhe fotografitë janë marrë nga katalogu zyrtar Caggiati.
              Çmimet janë me TVSH të përfshirë.
            </p>
          </Reveal>
        </div>

        {/* controls */}
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
                  className="appearance-none rounded-full border border-line bg-ink-3/60 py-2.5 pl-8 pr-4 text-[12.5px] font-semibold text-ivory-2"
                >
                  <option value="def">Renditja</option>
                  <option value="asc">Çmimi: ulët → lartë</option>
                  <option value="desc">Çmimi: lartë → ulët</option>
                </select>
              </div>
            </div>
            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-0.5">
              <Chip active={cat === "all"} onClick={() => setCat("all")} label="Të gjitha" count={counts.all} />
              {CATEGORIES.map((c) => (
                <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)} label={c.name} count={counts[c.id] || 0} />
              ))}
            </div>
          </div>
        </Reveal>

        {/* Large featured card (the owner's pick) */}
function FeaturedCard({ p, onOpen, i }: { p: Product; onOpen: (p: Product) => void; i: number } {
  return (
    <motion.button
      layout
      onClick={() => onOpen(p)}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-4% 0px" }}
      transition={{ duration: 0.7, delay: i * 0.09, ease: EASE }}
      className="group relative overflow-hidden rounded-[22px] border border-bronze/25 bg-ink-2 text-left transition-all duration-500 hover:border-bronze/60 hover:shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
    >
      <div className="relative aspect-[4/4.2] overflow-hidden">
        <ProductImage src={p.img} alt={p.name} code={p.code} imgClassName="card-img" />
        <span className="absolute left-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-full border border-bronze/40 bg-ink/70 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-bronze backdrop-blur-sm">
          <Sparkles size={10} strokeWidth={2.4} /> E përzgjedhur
        </span>
        <span className="absolute bottom-3.5 right-3.5 flex h-9 w-9 translate-y-1.5 items-center justify-center rounded-full bg-bronze text-ink opacity-0 transition-all duration-400 group-hover:translate-y-0 group-hover:opacity-100">
          <ChevronRight size={16} strokeWidth={2.6} />
        </span>
      </div>
      <div className="px-4 pb-4 pt-3.5 sm:px-5">
        <h3 className="line-clamp-1 font-display text-[19px] font-semibold leading-snug text-ivory">
          {p.name}
        </h3>
        {p.code ? (
          <p className="mt-0.5 truncate text-[10.5px] font-medium uppercase tracking-[0.16em] text-ivory-2/50">
            {p.code}
          </p>
        ) : null}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[17px] font-bold tracking-wide text-bronze-grad">
            {fmtPrice(p.price)}
          </span>
          <span className="text-[9.5px] uppercase tracking-[0.18em] text-ivory-2/50">ME TVSH</span>
        </div>
      </div>
    </motion.button>
  );
}

        {/* The catalog — FEATURE: 3 owner picks + progressive */}
export default function Catalog({
  group,
  setGroup,
  onOpen,
}: {
  group: string;
  setGroup: (g: string) => void;
  onOpen: (p: Product) => void;
}) {
  const { products, featuredIds } = useAdmin();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"def" | "asc" | "desc">("def");
  const [revealed, setRevealed] = useState(0); // sa grupe kategorie të zbuluara

  // Produktet e përzgjedhura nga pronari (3)
  const featuredSet = useMemo(() => new Set(featuredIds), [featuredIds]);
  const featured = useMemo(
    () => featuredIds.map((id) => products.find((p) => p.id === id)).filter(Boolean) as Product[],
    [featuredIds, products]
  );

  // Grupet sipas RENDIT TË KATEGORIVE — "germa" e para; boshat kalohen
  const groups = useMemo(
    () =>
      GROUP_ORDER.map((g) => ({
        ...g,
        items: products.filter((p) => g.cats.includes(p.cat) && !featuredSet.has(p.id)),
      })).filter((g) => g.items.length > 0),
    [products, featuredSet]
  );

  const searching = query.trim() !== "";
  const filtering = group !== "all" || searching || sort !== "def";
        {/* result meta */}
        <div className="mt-6 flex items-baseline justify-between px-1">
          <p className="text-[11.5px] tracking-[0.22em] uppercase text-ivory-2/60">
            {list.length} produkte {cat !== "all" && `· ${CATEGORIES.find((c) => c.id === cat)?.name}`}
          </p>
          {q && (
            <button onClick={() => setQ("")} className="text-[11.5px] text-bronze underline underline-offset-4">
              Pastro kërkimin
            </button>
          )}
        </div>

        {/* grid */}
        <motion.div layout className="mt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          <AnimatePresence mode="popLayout">
            {list.map((p, i) => (
              <motion.button
                layout
                key={p.id}
                onClick={() => onOpen(p)}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                viewport={{ once: true, margin: "-4% 0px" }}
                transition={{ duration: 0.55, delay: Math.min(i % 8, 4) * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="group relative overflow-hidden rounded-[18px] border border-line bg-ink-2 text-left transition-all duration-500 hover:border-bronze/50 hover:shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
              >
                <div className="relative aspect-[4/4.5] overflow-hidden bg-[#cfc8bb]">
                  <img
                    src={p.img}
                    alt={p.name}
                    loading="lazy"
                    className="card-img h-full w-full object-contain object-center"
                  />
                  <span className="absolute right-3 bottom-3 w-8 h-8 rounded-full bg-bronze text-ink flex items-center justify-center opacity-0 translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-400">
                    <Plus size={15} strokeWidth={2.6} />
                  </span>
                </div>
                <div className="px-3.5 sm:px-4 pt-3 pb-3.5">
                  <h3 className="font-display text-[16.5px] sm:text-[18px] font-semibold leading-snug text-ivory line-clamp-1">
                    {p.name}
                  </h3>
                  {p.code ? (
                    <p className="mt-0.5 text-[10px] sm:text-[10.5px] font-medium tracking-[0.16em] uppercase text-ivory-2/50 truncate">
                      {p.code}
                    </p>
                  ) : null}
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[15px] font-bold tracking-wide text-bronze-grad">{fmtEUR(p.price)}</span>
                    <span className="text-[9.5px] tracking-[0.18em] uppercase text-ivory-2/50">ME TVSH</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>

        {list.length === 0 && (
          <div className="mt-16 flex flex-col items-center text-center gap-3 text-ivory-2/70">
            <PackageSearch size={34} strokeWidth={1.4} className="text-bronze/60" />
            <p className="font-display text-2xl text-ivory">Asnjë produkt nuk u gjet</p>
            <p className="text-sm font-light">Provoni një tjetër term kërkimi ose kategori.</p>
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
