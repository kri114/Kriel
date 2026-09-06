import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownWideNarrow, ArrowUpWideNarrow, ChevronRight, Minus, Plus, Search, SearchX, Sparkles } from "lucide-react";
import { GROUP_ORDER, fmtPrice, waLink, type Product } from "../data/catalog";
import { useAdmin } from "../store/admin";
import ProductImage from "./ProductImage";
import Reveal from "./Reveal";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ── Small product card ─────────────────────────────────── */
function Card({ p, onOpen, i }: { p: Product; onOpen: (p: Product) => void; i: number }) {
  return (
    <motion.button
      layout
      onClick={() => onOpen(p)}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      viewport={{ once: true, margin: "-4% 0px" }}
      transition={{ duration: 0.55, delay: Math.min(i % 8, 4) * 0.05, ease: EASE }}
      className="group relative overflow-hidden rounded-[18px] border border-line bg-ink-2 text-left transition-all duration-500 hover:border-bronze/50 hover:shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
    >
      <div className="relative aspect-[4/4.5] overflow-hidden">
        <ProductImage src={p.img} alt={p.name} code={p.code} imgClassName="card-img" />
        <span className="absolute bottom-3 right-3 flex h-8 w-8 translate-y-1.5 items-center justify-center rounded-full bg-bronze text-ink opacity-0 transition-all duration-400 group-hover:translate-y-0 group-hover:opacity-100">
          <ChevronRight size={15} strokeWidth={2.6} />
        </span>
      </div>
      <div className="px-3.5 pb-3.5 pt-3 sm:px-4">
        <h3 className="line-clamp-1 font-display text-[16.5px] font-semibold leading-snug text-ivory sm:text-[18px]">
          {p.name}
        </h3>
        {p.code ? (
          <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-[0.16em] text-ivory-2/50 sm:text-[10.5px]">
            {p.code}
          </p>
        ) : null}
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-[15px] font-bold tracking-wide text-bronze-grad">
            {fmtPrice(p.price)}
          </span>
          <span className="text-[9.5px] uppercase tracking-[0.18em] text-ivory-2/50">ME TVSH</span>
        </div>
      </div>
    </motion.button>
  );
}

/* ── Large featured card (the owner's pick) ─────────────── */
function FeaturedCard({ p, onOpen, i }: { p: Product; onOpen: (p: Product) => void; i: number }) {
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

/* ── The catalog — FEATURE: 3 owner picks + progressive ─── */
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

  // Pamja e sheshtë kur filtrohet/kërkohet
  const flat = useMemo(() => {
    const g = GROUP_ORDER.find((x) => x.id === group);
    let list = products.filter(
      (p) =>
        (group === "all" || (g ? g.cats.includes(p.cat) : p.cat === group)) &&
        (!searching || (p.name + " " + p.code).toLowerCase().includes(query.trim().toLowerCase()))
    );
    if (sort === "asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "desc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, group, query, searching, sort]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: products.length };
    for (const g of GROUP_ORDER)
      c[g.id] = products.filter((p) => g.cats.includes(p.cat)).length;
    return c;
  }, [products]);

  const shownGroups = groups.slice(0, revealed);
  const shownCount =
    featured.length + shownGroups.reduce((n, g) => n + g.items.length, 0);
  const total = products.length;
  const allShown = revealed >= groups.length;

  const activeGroupDef = GROUP_ORDER.find((x) => x.id === group);

  return (
    <section id="katalogu" className="relative border-t border-line py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <Reveal>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.3em] text-bronze/80">
            Katalog 2025 · Me çmime
          </p>
          <h2 className="mt-3 font-display text-[38px] font-medium leading-[1.05] text-ivory sm:text-[52px]">
            Katalogu i <span className="text-bronze-grad">plotë</span>
          </h2>
          <p className="mt-4 max-w-xl text-[14.5px] font-light leading-relaxed text-ivory-2/75">
            Gama e plotë Caggiati — secili material zgjidhet për të përballuar dekadat në ambient të
            hapur, pa humbur asnjë pikë shkëlqimi.
          </p>
        </Reveal>

        {/* ── Controls: search + sort ─────────────────── */}
        <Reveal delay={0.08} className="mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-bronze/70" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Kërko emër ose kod…"
                className="w-full rounded-full border border-line bg-ink-3/60 py-2.5 pl-10 pr-4 text-[13.5px] text-ivory transition-colors placeholder:font-normal placeholder:text-ivory-2/40"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSort(sort === "asc" ? "def" : "asc")}
                title="Çmimi: më i ulëti"
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                  sort === "asc" ? "border-bronze/60 text-bronze" : "border-line text-ivory-2/60 hover:text-bronze"
                }`}
              >
                <ArrowUpWideNarrow size={15} />
              </button>
              <button
                onClick={() => setSort(sort === "desc" ? "def" : "desc")}
                title="Çmimi: më i larti"
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                  sort === "desc" ? "border-bronze/60 text-bronze" : "border-line text-ivory-2/60 hover:text-bronze"
                }`}
              >
                <ArrowDownWideNarrow size={15} />
              </button>
            </div>
          </div>

          {/* ── Category chips ─────────────────────────── */}
          <div className="no-scrollbar -mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0">
            <button
              onClick={() => setGroup("all")}
              className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition-all ${
                group === "all"
                  ? "border-bronze bg-bronze text-ink shadow-[0_6px_20px_rgba(201,163,92,0.35)]"
                  : "border-line text-ivory-2/70 hover:border-bronze/45 hover:text-bronze"
              }`}
            >
              Të gjitha · {counts.all}
            </button>
            {GROUP_ORDER.map((g) => {
              const n = counts[g.id] ?? 0;
              const active = group === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => setGroup(g.id)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition-all ${
                    active
                      ? "border-bronze bg-bronze text-ink shadow-[0_6px_20px_rgba(201,163,92,0.35)]"
                      : n === 0
                        ? "border-line/60 text-ivory-2/35 hover:border-bronze/40 hover:text-bronze/80"
                        : "border-line text-ivory-2/70 hover:border-bronze/45 hover:text-bronze"
                  }`}
                >
                  {g.label} · {n === 0 ? "së shpejti" : n}
                </button>
              );
            })}
          </div>
        </Reveal>

        {(filtering || group !== "all") ? (
          /* ══ Pamja e filtruar: rrjetë e sheshtë ══ */
          <div className="mt-6">
            <div className="flex items-baseline justify-between px-1">
              <p className="text-[11.5px] uppercase tracking-[0.22em] text-ivory-2/60">
                {flat.length} produkte
                {group !== "all" && activeGroupDef ? ` · ${activeGroupDef.label}` : ""}
              </p>
              {searching && (
                <button
                  onClick={() => setQuery("")}
                  className="text-[11.5px] text-bronze underline underline-offset-4"
                >
                  Pastro kërkimin
                </button>
              )}
            </div>
            <motion.div layout className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {flat.map((p, i) => (
                  <Card key={p.id} p={p} i={i} onOpen={onOpen} />
                ))}
              </AnimatePresence>
            </motion.div>
            {flat.length === 0 && (
              <div className="mt-16 flex flex-col items-center gap-3 text-center text-ivory-2/70">
                <SearchX size={34} strokeWidth={1.4} className="text-bronze/60" />
                <p className="font-display text-2xl text-ivory">Asnjë produkt nuk u gjet.</p>
                <p className="max-w-sm text-[13px] font-light leading-relaxed">
                  {counts[group] === 0 && group !== "all"
                    ? "Produktet e kësaj kategorie shtohen së shpejti — na kontaktoni për katalogun e plotë 2025."
                    : "Provoni një emër ose kod tjetër, ose na kontaktoni — katalogu 2025 ka qindra modele të tjera."}
                </p>
                <a
                  href={waLink("Përshëndetje Kriel! Po kërkoj një produkt nga katalogu i plotë 2025.")}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 rounded-full border border-bronze/45 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-bronze transition-colors hover:bg-bronze hover:text-ink"
                >
                  Pyet në WhatsApp
                </a>
              </div>
            )}
          </div>
        ) : (
          /* ══ Pamja kryesore: 3 të përzgjedhura + "Shfaq më shumë" ══ */
          <div className="mt-10">
            {/* 3 produktet e zgjedhura nga pronari */}
            <div className="flex items-center gap-3">
              <Sparkles size={15} className="text-bronze" />
              <h3 className="text-[11.5px] font-bold uppercase tracking-[0.26em] text-ivory-2/80">
                Të përzgjedhura për ju
              </h3>
              <span className="hairline flex-1" />
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {featured.map((p, i) => (
                <FeaturedCard key={p.id} p={p} i={i} onOpen={onOpen} />
              ))}
            </div>

            {/* Grupet e zbuluara — një kategori për çdo klik */}
            {shownGroups.map((g, gi) => (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 34 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: EASE }}
                className="mt-14"
              >
                <div className="flex items-end gap-4">
                  <span className="font-display text-[38px] font-semibold leading-none text-bronze/30">
                    {String(gi + 1).padStart(2, "0")}
                  </span>
                  <div className="pb-1">
                    <h3 className="font-display text-[26px] font-semibold leading-none text-ivory">
                      {g.label}
                    </h3>
                    <p className="mt-1.5 text-[10px] uppercase tracking-[0.22em] text-ivory-2/50">
                      {g.items.length} produkte · Bronz 87
                    </p>
                  </div>
                  <span className="hairline mb-3 flex-1" />
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {g.items.map((p, i) => (
                    <Card key={p.id} p={p} i={i} onOpen={onOpen} />
                  ))}
                </div>
              </motion.div>
            ))}

            {/* ── BUTONI "SHFAQ MË SHUMË" ──────────────── */}
            <div className="mt-14 flex flex-col items-center gap-3">
              <button
                onClick={() => {
                  if (allShown) {
                    setRevealed(0);
                    document.getElementById("katalogu")?.scrollIntoView({ behavior: "smooth" });
                  } else {
                    setRevealed((r) => r + 1);
                  }
                }}
                className="group inline-flex items-center gap-2.5 rounded-full border border-bronze/45 bg-bronze/10 px-8 py-4 text-[12.5px] font-bold uppercase tracking-[0.18em] text-bronze transition-all duration-300 hover:bg-bronze hover:text-ink hover:shadow-[0_14px_45px_rgba(201,163,92,0.45)]"
              >
                {allShown ? (
                  <>
                    <Minus size={15} strokeWidth={2.6} className="transition-transform group-hover:-translate-y-0.5" />
                    Shfaq më pak
                  </>
                ) : (
                  <>
                    <Plus size={15} strokeWidth={2.6} className="transition-transform group-hover:rotate-90 duration-300" />
                    Shfaq më shumë
                  </>
                )}
              </button>
              <p className="text-[10.5px] uppercase tracking-[0.22em] text-ivory-2/45">
                Duke shfaqur {shownCount} nga {total} produkte
                {!allShown && groups[revealed] ? ` · Vijon: ${groups[revealed].label}` : ""}
              </p>
            </div>
          </div>
        )}

        <p className="mt-14 text-center text-[11px] font-light leading-relaxed text-ivory-2/45">
          Çmimet e publikuara janë orientuese dhe përfshijnë TVSH. Për konfirmim të
          disponueshmërisë, modele të tjera nga katalogu i plotë 2025 dhe porosi të personalizuara,
          na kontaktoni.
        </p>
      </div>
    </section>
  );
}
