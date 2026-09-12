"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Save, X, Star, ArrowUp, ArrowDown, Search, EyeOff, Eye, PenLine, Percent } from "lucide-react";
import ImagesField from "./ImagesField";
import OptionsField from "./OptionsField";
import VariantMatrix from "./VariantMatrix";
import {
  createProduct as apiCreateProduct,
  deleteProduct,
  updateProduct,
  type ProductInput,
} from "@/lib/store";
import type { Category, Product, ProductVariant } from "@/lib/types";
import { fmtEUR, effectivePrice } from "@/lib/constants";
import { normalizeForSearch } from "@/lib/search";
function showError(err: unknown) {
  alert(err instanceof Error ? err.message : "Diçka shkoi keq. Provoni përsëri.");
}

type Draft = {
  name: string;
  code: string;
  price: number;
  dims: string;
  material: string;
  description: string;
  image: string;
  images: string[];
  sizes: string[];
  colors: string[];
  variants: ProductVariant[];
  categoryId: number | null;
  customizable: boolean;
  active: boolean;
  setName: string;
};

/** Drop variant prices whose color/size no longer exist in the option lists. */
function pruneVariants(d: Draft): ProductVariant[] {
  const colors = d.colors.length ? d.colors : [""];
  const sizes = d.sizes.length ? d.sizes : [""];
  return d.variants.filter(
    (v) => colors.includes(v.color) && sizes.includes(v.size) && v.price > 0
  );
}

function toDraft(p: Product): Draft {
  return {
    name: p.name,
    code: p.code,
    price: p.price,
    dims: p.dims,
    material: p.material,
    description: p.description,
    image: p.image,
    images: p.images.length ? p.images : p.image ? [p.image] : [],
    sizes: p.sizes,
    colors: p.colors,
    variants: p.variants,
    categoryId: p.categoryId,
    customizable: p.customizable,
    active: p.active,
    setName: p.setName ?? "",
  };
}

const emptyDraft: Draft = {
  name: "",
  code: "",
  price: 0,
  dims: "",
  material: "",
  description: "",
  image: "",
  images: [],
  sizes: [],
  colors: [],
  variants: [],
  categoryId: null,
  customizable: false,
  active: true,
  setName: "",
};

export default function ProductsTab({
  categories,
  products,
  reload,
}: {
  categories: Category[];
  products: Product[];
  reload: () => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [newDraft, setNewDraft] = useState<Draft>(emptyDraft);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [filterCat, setFilterCat] = useState("all");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"featured" | "all">("featured");

  const categoryName = (id: number | null) => categories.find((c) => c.id === id)?.name ?? "Pa kategori";

  const featured = useMemo(
    () => [...products].filter((p) => p.featured).sort((a, b) => a.featuredOrder - b.featuredOrder || a.id - b.id),
    [products]
  );

  const filtered = useMemo(() => {
    return products
      .filter((p) => (filterCat === "all" ? true : p.categoryId === Number(filterCat)))
      .filter((p) => !q.trim() || normalizeForSearch(p.name + " " + p.code).includes(normalizeForSearch(q.trim())))
      .sort((a, b) => {
        const catA = a.categoryId ?? 999999;
        const catB = b.categoryId ?? 999999;
        if (catA !== catB) return catA - catB;
        return a.sortOrder - b.sortOrder || a.id - b.id;
      });
  }, [products, filterCat, q]);

  const patch = async (id: number, body: Partial<ProductInput>) => {
    setBusyId(id);
    try {
      await updateProduct(id, body);
      await reload();
    } catch (err) {
      showError(err);
    } finally {
      setBusyId(null);
    }
  };

  const toggleFeatured = async (p: Product) => {
    if (!p.featured) {
      const nextOrder = featured.length ? Math.max(...featured.map((f) => f.featuredOrder)) + 1 : 0;
      await patch(p.id, { featured: true, featuredOrder: nextOrder });
    } else {
      await patch(p.id, { featured: false });
    }
  };

  const moveFeatured = async (p: Product, dir: -1 | 1) => {
    const idx = featured.findIndex((f) => f.id === p.id);
    const swapWith = featured[idx + dir];
    if (!swapWith) return;
    setBusyId(p.id);
    try {
      await Promise.all([
        updateProduct(p.id, { featuredOrder: swapWith.featuredOrder }),
        updateProduct(swapWith.id, { featuredOrder: p.featuredOrder }),
      ]);
      await reload();
    } catch (err) {
      showError(err);
    } finally {
      setBusyId(null);
    }
  };

  const moveWithinCategory = async (p: Product, dir: -1 | 1) => {
    const siblings = filtered.filter((x) => x.categoryId === p.categoryId);
    const idx = siblings.findIndex((x) => x.id === p.id);
    const swapWith = siblings[idx + dir];
    if (!swapWith) return;
    setBusyId(p.id);
    try {
      await Promise.all([
        updateProduct(p.id, { sortOrder: swapWith.sortOrder }),
        updateProduct(swapWith.id, { sortOrder: p.sortOrder }),
      ]);
      await reload();
    } catch (err) {
      showError(err);
    } finally {
      setBusyId(null);
    }
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setDrafts((d) => ({ ...d, [p.id]: toDraft(p) }));
  };
  const cancelEdit = (id: number) => {
    setEditingId(null);
    setDrafts((d) => {
      const next = { ...d };
      delete next[id];
      return next;
    });
  };
  const saveEdit = async (id: number) => {
    const draft = drafts[id];
    if (!draft) return;
    await patch(id, { ...draft, variants: pruneVariants(draft) });
    setEditingId(null);
  };

  const remove = async (id: number) => {
    if (!confirm("Jeni i sigurt që doni ta fshini këtë produkt?")) return;
    setBusyId(id);
    try {
      await deleteProduct(id);
      await reload();
    } catch (err) {
      showError(err);
    } finally {
      setBusyId(null);
    }
  };

  const createProduct = async () => {
    if (!newDraft.name.trim()) return;
    setCreating(true);
    try {
      await apiCreateProduct({ ...newDraft, variants: pruneVariants(newDraft) });
      setNewDraft(emptyDraft);
      await reload();
    } catch (err) {
      showError(err);
    } finally {
      setCreating(false);
    }
  };

  /** Raise/lower base price AND every variant price of ONE product by pct%. */
  const adjustPrices = async (p: Product, pct: number, dir: 1 | -1) => {
    if (!Number.isFinite(pct) || pct <= 0 || pct > 99) return;
    const factor = 1 + (dir * pct) / 100;
    const r2 = (n: number) => Math.max(Math.round(n * 100) / 100, 0.01);
    setBusyId(p.id);
    try {
      await updateProduct(p.id, {
        price: r2(p.price * factor),
        variants: p.variants.map((v) => ({ ...v, price: r2(v.price * factor) })),
      });
      await reload();
    } catch (err) {
      showError(err);
    } finally {
      setBusyId(null);
    }
  };

  const applySale = async (p: Product, pct: number) => {
    setBusyId(p.id);
    try {
      await updateProduct(p.id, { salePct: pct });
      await reload();
    } catch (err) {
      showError(err);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <TabBtn active={tab === "featured"} onClick={() => setTab("featured")}>
          <Star size={13} /> Të preferuarat ({featured.length}/3)
        </TabBtn>
        <TabBtn active={tab === "all"} onClick={() => setTab("all")}>
          Të gjitha produktet ({products.length})
        </TabBtn>
      </div>

      {tab === "featured" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-[13px] text-slate-700 mb-4">
            Këto janë produktet që shfaqen fillimisht (para se vizitori të shtypë &ldquo;Shfaq më shumë&rdquo;).
            Zgjidhni deri në 3 produkte nga tabi &ldquo;Të gjitha produktet&rdquo; duke shtypur ikonën e yllit.
          </p>
          <div className="space-y-2">
            {featured.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image || "/images/categories/germa.jpg"} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-[13.5px] truncate">{p.name}</p>
                  <p className="text-[11.5px] text-slate-700">{categoryName(p.categoryId)} · {fmtEUR(p.price)}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => moveFeatured(p, -1)} disabled={i === 0} className="w-7 h-7 rounded-lg border border-amber-300 flex items-center justify-center text-amber-700 disabled:opacity-30">
                    <ArrowUp size={13} />
                  </button>
                  <button onClick={() => moveFeatured(p, 1)} disabled={i === featured.length - 1} className="w-7 h-7 rounded-lg border border-amber-300 flex items-center justify-center text-amber-700 disabled:opacity-30">
                    <ArrowDown size={13} />
                  </button>
                  <button onClick={() => toggleFeatured(p)} className="w-7 h-7 rounded-lg border border-amber-300 flex items-center justify-center text-amber-700">
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
            {featured.length === 0 && <p className="text-slate-600 text-sm">Ende nuk keni zgjedhur produkte të preferuara.</p>}
          </div>
        </div>
      )}

      {tab === "all" && (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Plus size={16} className="text-amber-600" /> Shto produkt të ri
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Labeled label="Emri">
                <input value={newDraft.name} onChange={(e) => setNewDraft({ ...newDraft, name: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px]" />
              </Labeled>
              <Labeled label="Kodi (opsional)">
                <input value={newDraft.code} onChange={(e) => setNewDraft({ ...newDraft, code: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px]" />
              </Labeled>
              <Labeled label="Çmimi (€)">
                <input type="number" step="0.01" value={newDraft.price} onChange={(e) => setNewDraft({ ...newDraft, price: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px]" />
              </Labeled>
              <Labeled label="Kategoria">
                <select
                  value={newDraft.categoryId ?? ""}
                  onChange={(e) => setNewDraft({ ...newDraft, categoryId: e.target.value ? Number(e.target.value) : null })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px]"
                >
                  <option value="">Pa kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Labeled>
              <Labeled label="Përmasat">
                <input value={newDraft.dims} onChange={(e) => setNewDraft({ ...newDraft, dims: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px]" placeholder="p.sh. Lartësia 40 cm" />
              </Labeled>
              <Labeled label="Materiali">
                <input value={newDraft.material} onChange={(e) => setNewDraft({ ...newDraft, material: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px]" placeholder="p.sh. Bronz i punuar dorë" />
              </Labeled>
              <Labeled label="Emri i Setit (opsional)">
                <input value={newDraft.setName} onChange={(e) => setNewDraft({ ...newDraft, setName: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px]" placeholder="p.sh. Set A, Koleksion Vere…" />
              </Labeled>
            </div>
            <div className="mt-4">
              <Labeled label="Përshkrimi">
                <textarea value={newDraft.description} onChange={(e) => setNewDraft({ ...newDraft, description: e.target.value })} rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px] resize-none" />
              </Labeled>
            </div>
            <div className="mt-4">
              <ImagesField
                value={newDraft.images}
                onChange={(v) => setNewDraft({ ...newDraft, images: v, image: v[0] ?? "" })}
              />
            </div>
            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              <OptionsField
                label="Madhësi të zgjidhshme (opsionale)"
                placeholder="p.sh. Lartësia 35 cm"
                hint="Nëse shtoni madhësi, klienti zgjedh njërën para porosisë."
                value={newDraft.sizes}
                onChange={(v) => setNewDraft({ ...newDraft, sizes: v })}
              />
              <OptionsField
                label="Ngjyra / finitime të zgjidhshme (opsionale)"
                placeholder="p.sh. Finish i artë"
                hint="Nëse shtoni ngjyra, klienti zgjedh njërën para porosisë."
                value={newDraft.colors}
                onChange={(v) => setNewDraft({ ...newDraft, colors: v })}
              />
            </div>
            {(newDraft.colors.length > 0 || newDraft.sizes.length > 0) && (
              <div className="mt-4">
                <VariantMatrix
                  basePrice={newDraft.price}
                  colors={newDraft.colors}
                  sizes={newDraft.sizes}
                  value={newDraft.variants}
                  onChange={(v) => setNewDraft({ ...newDraft, variants: v })}
                />
              </div>
            )}
            <label className="mt-4 flex items-center gap-2 text-[13px] text-slate-700">
              <input type="checkbox" checked={newDraft.customizable} onChange={(e) => setNewDraft({ ...newDraft, customizable: e.target.checked })} />
              <PenLine size={14} className="text-amber-600" /> Ky produkt kërkon tekst/gërma të personalizuara nga klienti
            </label>
            <button
              onClick={createProduct}
              disabled={creating || !newDraft.name.trim()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 via-amber-500 to-amber-700 px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-50"
            >
              <Plus size={15} /> Shto produktin
            </button>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kërko…" className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-[13.5px]" />
            </div>
            <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-[13px]">
              <option value="all">Të gjitha kategoritë</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {filtered.map((p) => {
              const isEditing = editingId === p.id;
              const draft = drafts[p.id];
              const siblings = filtered.filter((x) => x.categoryId === p.categoryId);
              const posInCat = siblings.findIndex((x) => x.id === p.id);
              return (
                <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                  {!isEditing ? (
                    <>
                    <div className="flex items-start gap-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image || "/images/categories/germa.jpg"} alt={p.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-900">{p.name}</p>
                          {p.customizable && <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">Personalizohet</span>}
                          {!p.active && <span className="text-[10px] font-bold uppercase tracking-wide text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded">Fshehur</span>}
                          {p.setName && <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Set: {p.setName}</span>}
                        </div>
                        <p className="text-[12.5px] text-slate-700">{categoryName(p.categoryId)} · {fmtEUR(p.price)} {p.code && `· ${p.code}`}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="flex gap-1.5">
                          <button onClick={() => moveWithinCategory(p, -1)} disabled={posInCat === 0 || busyId === p.id} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-700 disabled:opacity-30">
                            <ArrowUp size={13} />
                          </button>
                          <button onClick={() => moveWithinCategory(p, 1)} disabled={posInCat === siblings.length - 1 || busyId === p.id} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-700 disabled:opacity-30">
                            <ArrowDown size={13} />
                          </button>
                          <button
                            onClick={() => toggleFeatured(p)}
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center ${p.featured ? "border-amber-400 bg-amber-100 text-amber-700" : "border-slate-200 text-slate-600"}`}
                            title="Shto te të preferuarat"
                          >
                            <Star size={13} fill={p.featured ? "currentColor" : "none"} />
                          </button>
                          <button
                            onClick={() => patch(p.id, { active: !p.active })}
                            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-700"
                            title={p.active ? "Fshihe nga faqja" : "Shfaqe në faqe"}
                          >
                            {p.active ? <Eye size={13} /> : <EyeOff size={13} />}
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => startEdit(p)} className="text-[12px] font-semibold text-amber-600">Ndrysho</button>
                          <button onClick={() => remove(p.id)} className="text-slate-600 hover:text-red-500">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <RowTools
                      product={p}
                      busy={busyId === p.id}
                      onBulk={adjustPrices}
                      onSale={applySale}
                    />
                    </>
                  ) : (
                    <div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Labeled label="Emri">
                          <input value={draft?.name ?? ""} onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...d[p.id], name: e.target.value } }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px]" />
                        </Labeled>
                        <Labeled label="Kodi">
                          <input value={draft?.code ?? ""} onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...d[p.id], code: e.target.value } }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px]" />
                        </Labeled>
                        <Labeled label="Çmimi (€)">
                          <input type="number" step="0.01" value={draft?.price ?? 0} onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...d[p.id], price: Number(e.target.value) } }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px]" />
                        </Labeled>
                        <Labeled label="Kategoria">
                          <select
                            value={draft?.categoryId ?? ""}
                            onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...d[p.id], categoryId: e.target.value ? Number(e.target.value) : null } }))}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px]"
                          >
                            <option value="">Pa kategori</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </Labeled>
                        <Labeled label="Përmasat">
                          <input value={draft?.dims ?? ""} onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...d[p.id], dims: e.target.value } }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px]" />
                        </Labeled>
                        <Labeled label="Materiali">
                          <input value={draft?.material ?? ""} onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...d[p.id], material: e.target.value } }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px]" />
                        </Labeled>
                        <Labeled label="Emri i Setit (opsional)">
                          <input value={draft?.setName ?? ""} onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...d[p.id], setName: e.target.value } }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px]" placeholder="p.sh. Set A, Koleksion Vere… (lëreni bosh për të hequr)" />
                        </Labeled>
                      </div>
                      <div className="mt-4">
                        <Labeled label="Përshkrimi">
                          <textarea value={draft?.description ?? ""} onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...d[p.id], description: e.target.value } }))} rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px] resize-none" />
                        </Labeled>
                      </div>
                      <div className="mt-4">
                        <ImagesField
                          value={draft?.images ?? []}
                          onChange={(v) => setDrafts((d) => ({ ...d, [p.id]: { ...d[p.id], images: v, image: v[0] ?? "" } }))}
                        />
                      </div>
                      <div className="mt-4 grid sm:grid-cols-2 gap-4">
                        <OptionsField
                          label="Madhësi të zgjidhshme (opsionale)"
                          placeholder="p.sh. Lartësia 35 cm"
                          value={draft?.sizes ?? []}
                          onChange={(v) => setDrafts((d) => ({ ...d, [p.id]: { ...d[p.id], sizes: v } }))}
                        />
                        <OptionsField
                          label="Ngjyra / finitime të zgjidhshme (opsionale)"
                          placeholder="p.sh. Finish i artë"
                          value={draft?.colors ?? []}
                          onChange={(v) => setDrafts((d) => ({ ...d, [p.id]: { ...d[p.id], colors: v } }))}
                        />
                      </div>
                      {((draft?.colors?.length ?? 0) > 0 || (draft?.sizes?.length ?? 0) > 0) && (
                        <div className="mt-4">
                          <VariantMatrix
                            basePrice={draft?.price ?? 0}
                            colors={draft?.colors ?? []}
                            sizes={draft?.sizes ?? []}
                            value={draft?.variants ?? []}
                            onChange={(v) => setDrafts((d) => ({ ...d, [p.id]: { ...d[p.id], variants: v } }))}
                          />
                        </div>
                      )}
                      <label className="mt-4 flex items-center gap-2 text-[13px] text-slate-700">
                        <input
                          type="checkbox"
                          checked={draft?.customizable ?? false}
                          onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...d[p.id], customizable: e.target.checked } }))}
                        />
                        <PenLine size={14} className="text-amber-600" /> Kërkon tekst/gërma të personalizuara
                      </label>
                      <div className="mt-4 flex gap-2">
                        <button onClick={() => saveEdit(p.id)} disabled={busyId === p.id} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 text-white px-4 py-2 text-[12.5px] font-semibold disabled:opacity-50">
                          <Save size={13} /> Ruaj
                        </button>
                        <button onClick={() => cancelEdit(p.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-[12.5px] font-semibold text-slate-600">
                          <X size={13} /> Anulo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && <p className="text-slate-700 text-sm">Nuk u gjet asnjë produkt.</p>}
          </div>
        </>
      )}
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-700">{label}</span>
      {children}
    </label>
  );
}

/** Per-product quick tools: bulk %-price adjust (base + variants) and sale %. */
function RowTools({
  product,
  busy,
  onBulk,
  onSale,
}: {
  product: Product;
  busy: boolean;
  onBulk: (p: Product, pct: number, dir: 1 | -1) => void;
  onSale: (p: Product, pct: number) => void;
}) {
  const [pctStr, setPctStr] = useState("");
  const [saleStr, setSaleStr] = useState(
    product.salePct > 0 ? String(product.salePct) : ""
  );

  useEffect(() => {
    setSaleStr(product.salePct > 0 ? String(product.salePct) : "");
  }, [product.salePct]);

  const pctNum = Math.abs(Math.round(Number(pctStr))) || 0;

  const commitSale = () => {
    const n = Math.round(Number(saleStr));
    const next =
      saleStr.trim() === "" || !Number.isFinite(n) || n <= 0 ? 0 : Math.min(n, 90);
    if (next !== product.salePct) onSale(product, next);
    setSaleStr(next > 0 ? String(next) : "");
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <Percent size={13} className="text-slate-700" />
        <input
          type="number"
          min={1}
          max={99}
          value={pctStr}
          onChange={(e) => setPctStr(e.target.value)}
          placeholder="%"
          title="Përqindja e ndryshimit të çmimit"
          className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-[12px] text-slate-800"
        />
        <button
          onClick={() => onBulk(product, pctNum, 1)}
          disabled={busy || pctNum === 0}
          className="rounded-lg border border-emerald-400 bg-white px-2.5 py-1 text-[11.5px] font-bold text-emerald-700 disabled:opacity-40"
        >
          Rrit me {pctNum || "…"}%
        </button>
        <button
          onClick={() => onBulk(product, pctNum, -1)}
          disabled={busy || pctNum === 0}
          className="rounded-lg border border-red-300 bg-white px-2.5 py-1 text-[11.5px] font-bold text-red-600 disabled:opacity-40"
        >
          Zbrit me {pctNum || "…"}%
        </button>
        <span className="hidden lg:inline text-[10px] text-slate-700">
          vepron te çmimi bazë + të gjitha variantet, vetëm te ky produkt
        </span>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <span
          className={`text-[11px] font-bold uppercase tracking-wide ${
            product.salePct > 0 ? "text-red-600" : "text-slate-700"
          }`}
        >
          Ulje
        </span>
        <input
          type="number"
          min={0}
          max={90}
          value={saleStr}
          onChange={(e) => setSaleStr(e.target.value)}
          onBlur={commitSale}
          onKeyDown={(e) => e.key === "Enter" && commitSale()}
          placeholder="0"
          title="Përqindja e uljes (0 ose bosh = pa ulje)"
          className="w-14 rounded-lg border border-slate-300 bg-white px-2 py-1 text-[12px] text-slate-800"
        />
        <span className="text-[11px] text-slate-700">%</span>
        {product.salePct > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10.5px] font-bold text-red-700">
            ≈ {fmtEUR(effectivePrice(product.price, product.salePct))}
          </span>
        )}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors ${
        active ? "bg-slate-900 text-white" : "bg-white border border-slate-300 text-slate-600"
      }`}
    >
      {children}
    </button>
  );
}
