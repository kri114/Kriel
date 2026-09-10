"use client";

import { useMemo, useRef, useState } from "react";
import { Plus, Trash2, Save, X, Star, ArrowUp, ArrowDown, Search, EyeOff, Eye, PenLine, ImagePlus, Tag, Percent } from "lucide-react";
import ImageField from "./ImageField";
import ImageGalleryField from "./ImageGalleryField";
import { resizeImageFile } from "@/lib/image";
import {
  adjustProductPricesByPercent,
  createProduct as apiCreateProduct,
  createVariant,
  deleteProduct,
  deleteVariant,
  updateProduct,
  updateVariant,
  type ProductInput,
} from "@/lib/store";
import type { Category, Product, ProductVariant } from "@/lib/types";
import { applyDiscount, fmtEUR } from "@/lib/constants";

function showError(err: unknown) {
  alert(err instanceof Error ? err.message : "Diçka shkoi keq. Provoni përsëri.");
}

type VariantDraft = {
  id?: number;
  color: string;
  size: string;
  /** Kept as text so the field can be empty ("inherit base price"). */
  price: string;
  image: string;
};

type Draft = {
  name: string;
  code: string;
  price: number;
  dims: string;
  material: string;
  description: string;
  image: string;
  images: string[];
  categoryId: number | null;
  customizable: boolean;
  active: boolean;
  variants: VariantDraft[];
  /** Kept as text so the field can be empty ("no discount"). */
  discountPercent: string;
};

function toDraft(p: Product, productVariants: ProductVariant[]): Draft {
  return {
    name: p.name,
    code: p.code,
    price: p.price,
    dims: p.dims,
    material: p.material,
    description: p.description,
    image: p.image,
    images: p.images ?? [],
    categoryId: p.categoryId,
    customizable: p.customizable,
    active: p.active,
    variants: productVariants.map((v) => ({
      id: v.id,
      color: v.color,
      size: v.size,
      price: v.price === null ? "" : String(v.price),
      image: v.image,
    })),
    discountPercent: p.discountPercent == null ? "" : String(p.discountPercent),
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
  categoryId: null,
  customizable: false,
  active: true,
  variants: [],
  discountPercent: "",
};

/** Creates/updates/deletes variant rows so the DB matches the draft list exactly. */
async function syncVariants(productId: number, drafts: VariantDraft[], original: ProductVariant[]) {
  const draftIds = new Set(drafts.filter((d) => d.id != null).map((d) => d.id as number));
  for (const o of original) {
    if (!draftIds.has(o.id)) await deleteVariant(o.id);
  }
  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i];
    if (!d.color.trim() && !d.size.trim()) continue; // skip fully empty rows
    const price = d.price.trim() === "" ? null : Number(d.price);
    if (d.id != null) {
      await updateVariant(d.id, { color: d.color, size: d.size, price, image: d.image, sortOrder: i });
    } else {
      await createVariant({ productId, color: d.color, size: d.size, price, image: d.image, sortOrder: i });
    }
  }
}

export default function ProductsTab({
  categories,
  products,
  variants,
  reload,
}: {
  categories: Category[];
  products: Product[];
  variants: ProductVariant[];
  reload: () => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [newDraft, setNewDraft] = useState<Draft>(emptyDraft);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [filterCat, setFilterCat] = useState("all");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"sale" | "featured" | "all">("featured");

  const variantsByProduct = useMemo(() => {
    const m: Record<number, ProductVariant[]> = {};
    for (const v of variants) {
      (m[v.productId] ??= []).push(v);
    }
    return m;
  }, [variants]);

  const categoryName = (id: number | null) => categories.find((c) => c.id === id)?.name ?? "Pa kategori";

  const featured = useMemo(
    () => [...products].filter((p) => p.featured).sort((a, b) => a.featuredOrder - b.featuredOrder || a.id - b.id),
    [products]
  );

  const onSale = useMemo(
    () =>
      [...products]
        .filter((p) => p.discountPercent && p.discountPercent > 0)
        .sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0)),
    [products]
  );

  const filtered = useMemo(() => {
    return products
      .filter((p) => (filterCat === "all" ? true : p.categoryId === Number(filterCat)))
      .filter((p) => !q.trim() || (p.name + " " + p.code).toLowerCase().includes(q.trim().toLowerCase()))
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
    setDrafts((d) => ({ ...d, [p.id]: toDraft(p, variantsByProduct[p.id] ?? []) }));
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
    setBusyId(id);
    try {
      const discountPercent = draft.discountPercent.trim() === "" ? null : Number(draft.discountPercent);
      await updateProduct(id, {
        name: draft.name,
        code: draft.code,
        price: draft.price,
        dims: draft.dims,
        material: draft.material,
        description: draft.description,
        image: draft.image,
        images: draft.images,
        categoryId: draft.categoryId,
        customizable: draft.customizable,
        active: draft.active,
        discountPercent,
      });
      await syncVariants(id, draft.variants, variantsByProduct[id] ?? []);
      await reload();
      setEditingId(null);
    } catch (err) {
      showError(err);
    } finally {
      setBusyId(null);
    }
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
      const discountPercent = newDraft.discountPercent.trim() === "" ? null : Number(newDraft.discountPercent);
      const created = await apiCreateProduct({ ...newDraft, discountPercent });
      await syncVariants(created.id, newDraft.variants, []);
      setNewDraft(emptyDraft);
      await reload();
    } catch (err) {
      showError(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        <TabBtn active={tab === "sale"} onClick={() => setTab("sale")}>
          <Tag size={13} /> Oferta ({onSale.length})
        </TabBtn>
        <TabBtn active={tab === "featured"} onClick={() => setTab("featured")}>
          <Star size={13} /> Të preferuarat ({featured.length}/3)
        </TabBtn>
        <TabBtn active={tab === "all"} onClick={() => setTab("all")}>
          Të gjitha produktet ({products.length})
        </TabBtn>
      </div>

      {tab === "sale" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-[13px] text-slate-600 mb-4">
            Këta produkte shfaqen automatikisht te ndarja &ldquo;Oferta&rdquo; në faqen publike, me çmimin e ulur —
            e dukshme për vizitorët vetëm kur ka të paktën 1 produkt këtu. Për të vendosur ose hequr uljen e një
            produkti, hapni &ldquo;Ndrysho&rdquo; te tabi &ldquo;Të gjitha produktet&rdquo; dhe plotësoni/fshini
            fushën &ldquo;Ulje (%)&rdquo;.
          </p>
          <div className="space-y-2">
            {onSale.map((p) => {
              const salePrice = applyDiscount(p.price, p.discountPercent);
              return (
                <div key={p.id} className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image || "/images/categories/germa.jpg"} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-[13.5px] truncate">{p.name}</p>
                    <p className="text-[11.5px] text-slate-600">
                      {categoryName(p.categoryId)} ·{" "}
                      <span className="line-through text-slate-400">{fmtEUR(p.price)}</span>{" "}
                      <span className="font-bold text-red-700">{fmtEUR(salePrice)}</span>{" "}
                      <span className="font-semibold text-red-700">(-{Math.round(p.discountPercent as number)}%)</span>
                    </p>
                  </div>
                  <button
                    onClick={() => patch(p.id, { discountPercent: null })}
                    disabled={busyId === p.id}
                    className="shrink-0 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    Hiq uljen
                  </button>
                </div>
              );
            })}
            {onSale.length === 0 && (
              <p className="text-slate-500 text-sm">
                Ende asnjë produkt në ofertë. Vendosni një përqindje uljeje te fusha &ldquo;Ulje (%)&rdquo; e një
                produkti (tek &ldquo;Të gjitha produktet&rdquo; → Ndrysho) që të shfaqet këtu dhe në faqen publike.
              </p>
            )}
          </div>
        </div>
      )}

      {tab === "featured" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-[13px] text-slate-500 mb-4">
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
                  <p className="text-[11.5px] text-slate-500">{categoryName(p.categoryId)} · {fmtEUR(p.price)}</p>
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
            {featured.length === 0 && <p className="text-slate-500 text-sm">Ende nuk keni zgjedhur produkte të preferuara.</p>}
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
                <input value={newDraft.name} onChange={(e) => setNewDraft({ ...newDraft, name: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px] text-slate-900 placeholder:text-slate-400 bg-white" />
              </Labeled>
              <Labeled label="Kodi (opsional)">
                <input value={newDraft.code} onChange={(e) => setNewDraft({ ...newDraft, code: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px] text-slate-900 placeholder:text-slate-400 bg-white" />
              </Labeled>
              <Labeled label="Çmimi bazë (€)">
                <input type="number" step="0.01" value={newDraft.price} onChange={(e) => setNewDraft({ ...newDraft, price: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px] text-slate-900 placeholder:text-slate-400 bg-white" />
              </Labeled>
              <Labeled label="Ulje (%) — bosh = pa ulje">
                <input
                  type="number"
                  step="0.01"
                  value={newDraft.discountPercent}
                  onChange={(e) => setNewDraft({ ...newDraft, discountPercent: e.target.value })}
                  placeholder="p.sh. 15"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px] text-slate-900 placeholder:text-slate-400 bg-white"
                />
              </Labeled>
              <Labeled label="Kategoria">
                <select
                  value={newDraft.categoryId ?? ""}
                  onChange={(e) => setNewDraft({ ...newDraft, categoryId: e.target.value ? Number(e.target.value) : null })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px] text-slate-900 placeholder:text-slate-400 bg-white"
                >
                  <option value="">Pa kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Labeled>
              <Labeled label="Përmasat (tekst i lirë, p.sh. për specifikimin e përgjithshëm)">
                <input value={newDraft.dims} onChange={(e) => setNewDraft({ ...newDraft, dims: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px] text-slate-900 placeholder:text-slate-400 bg-white" placeholder="p.sh. Lartësia 40 cm" />
              </Labeled>
              <Labeled label="Materiali">
                <input value={newDraft.material} onChange={(e) => setNewDraft({ ...newDraft, material: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px] text-slate-900 placeholder:text-slate-400 bg-white" placeholder="p.sh. Bronz i punuar dorë" />
              </Labeled>
            </div>
            <div className="mt-4">
              <Labeled label="Përshkrimi">
                <textarea value={newDraft.description} onChange={(e) => setNewDraft({ ...newDraft, description: e.target.value })} rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px] text-slate-900 placeholder:text-slate-400 resize-none bg-white" />
              </Labeled>
            </div>
            <div className="mt-4">
              <ImageField label="Foto kryesore" value={newDraft.image} onChange={(v) => setNewDraft({ ...newDraft, image: v })} />
            </div>
            <div className="mt-4">
              <ImageGalleryField value={newDraft.images} onChange={(v) => setNewDraft({ ...newDraft, images: v })} />
            </div>
            <label className="mt-4 flex items-center gap-2 text-[13px] text-slate-700">
              <input type="checkbox" checked={newDraft.customizable} onChange={(e) => setNewDraft({ ...newDraft, customizable: e.target.checked })} />
              <PenLine size={14} className="text-amber-600" /> Ky produkt kërkon tekst/gërma të personalizuara nga klienti
            </label>
            <VariantsEditor variants={newDraft.variants} onChange={(v) => setNewDraft({ ...newDraft, variants: v })} />
            <button
              onClick={createProduct}
              disabled={creating || !newDraft.name.trim()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-50 transition-colors"
            >
              <Plus size={15} /> Shto produktin
            </button>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kërko…" className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-[13.5px] text-slate-900 placeholder:text-slate-400 bg-white" />
            </div>
            <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-[13px] text-slate-900 bg-white">
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
              const pVariants = variantsByProduct[p.id] ?? [];
              return (
                <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                  {!isEditing ? (
                    <div className="flex items-start gap-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image || "/images/categories/germa.jpg"} alt={p.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-900">{p.name}</p>
                          {p.customizable && <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">Personalizohet</span>}
                          {pVariants.length > 0 && (
                            <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                              {pVariants.length} opsion{pVariants.length > 1 ? "e" : ""}
                            </span>
                          )}
                          {p.images && p.images.length > 0 && (
                            <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                              +{p.images.length} foto
                            </span>
                          )}
                          {!p.active && <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">Fshehur</span>}
                          {Boolean(p.discountPercent && p.discountPercent > 0) && (
                            <span className="text-[10px] font-bold uppercase tracking-wide text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                              -{Math.round(p.discountPercent as number)}% Ulje
                            </span>
                          )}
                        </div>
                        <p className="text-[12.5px] text-slate-500">
                          {categoryName(p.categoryId)} ·{" "}
                          {p.discountPercent && p.discountPercent > 0 ? (
                            <>
                              <span className="line-through">{fmtEUR(p.price)}</span>{" "}
                              <span className="font-semibold text-red-700">{fmtEUR(applyDiscount(p.price, p.discountPercent))}</span>
                            </>
                          ) : (
                            fmtEUR(p.price)
                          )}{" "}
                          {p.code && `· ${p.code}`}
                        </p>
                        <div className="mt-2">
                          <PriceBulkAdjust product={p} productVariants={pVariants} onApplied={reload} />
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="flex gap-1.5">
                          <button onClick={() => moveWithinCategory(p, -1)} disabled={posInCat === 0 || busyId === p.id} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 disabled:opacity-30">
                            <ArrowUp size={13} />
                          </button>
                          <button onClick={() => moveWithinCategory(p, 1)} disabled={posInCat === siblings.length - 1 || busyId === p.id} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 disabled:opacity-30">
                            <ArrowDown size={13} />
                          </button>
                          <button
                            onClick={() => toggleFeatured(p)}
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center ${p.featured ? "border-amber-400 bg-amber-100 text-amber-700" : "border-slate-200 text-slate-400"}`}
                            title="Shto te të preferuarat"
                          >
                            <Star size={13} fill={p.featured ? "currentColor" : "none"} />
                          </button>
                          <button
                            onClick={() => patch(p.id, { active: !p.active })}
                            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500"
                            title={p.active ? "Fshihe nga faqja" : "Shfaqe në faqe"}
                          >
                            {p.active ? <Eye size={13} /> : <EyeOff size={13} />}
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => startEdit(p)} className="text-[12px] font-semibold text-amber-600">Ndrysho</button>
                          <button onClick={() => remove(p.id)} className="text-slate-400 hover:text-red-500">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Labeled label="Emri">
                          <input value={draft?.name ?? ""} onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...d[p.id], name: e.target.value } }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px] text-slate-900 placeholder:text-slate-400 bg-white" />
                        </Labeled>
                        <Labeled label="Kodi">
                          <input value={draft?.code ?? ""} onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...d[p.id], code: e.target.value } }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px] text-slate-900 placeholder:text-slate-400 bg-white" />
                        </Labeled>
                        <Labeled label="Çmimi bazë (€)">
                          <input type="number" step="0.01" value={draft?.price ?? 0} onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...d[p.id], price: Number(e.target.value) } }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px] text-slate-900 placeholder:text-slate-400 bg-white" />
                        </Labeled>
                        <Labeled label="Ulje (%) — bosh = pa ulje">
                          <input
                            type="number"
                            step="0.01"
                            value={draft?.discountPercent ?? ""}
                            onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...d[p.id], discountPercent: e.target.value } }))}
                            placeholder="p.sh. 15"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px] text-slate-900 placeholder:text-slate-400 bg-white"
                          />
                        </Labeled>
                        <Labeled label="Kategoria">
                          <select
                            value={draft?.categoryId ?? ""}
                            onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...d[p.id], categoryId: e.target.value ? Number(e.target.value) : null } }))}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px] text-slate-900 placeholder:text-slate-400 bg-white"
                          >
                            <option value="">Pa kategori</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </Labeled>
                        <Labeled label="Përmasat">
                          <input value={draft?.dims ?? ""} onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...d[p.id], dims: e.target.value } }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px] text-slate-900 placeholder:text-slate-400 bg-white" />
                        </Labeled>
                        <Labeled label="Materiali">
                          <input value={draft?.material ?? ""} onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...d[p.id], material: e.target.value } }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px] text-slate-900 placeholder:text-slate-400 bg-white" />
                        </Labeled>
                      </div>
                      <div className="mt-4">
                        <Labeled label="Përshkrimi">
                          <textarea value={draft?.description ?? ""} onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...d[p.id], description: e.target.value } }))} rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px] text-slate-900 placeholder:text-slate-400 resize-none bg-white" />
                        </Labeled>
                      </div>
                      <div className="mt-4">
                        <ImageField label="Foto kryesore" value={draft?.image ?? ""} onChange={(v) => setDrafts((d) => ({ ...d, [p.id]: { ...d[p.id], image: v } }))} />
                      </div>
                      <div className="mt-4">
                        <ImageGalleryField
                          value={draft?.images ?? []}
                          onChange={(v) => setDrafts((d) => ({ ...d, [p.id]: { ...d[p.id], images: v } }))}
                        />
                      </div>
                      <label className="mt-4 flex items-center gap-2 text-[13px] text-slate-700">
                        <input
                          type="checkbox"
                          checked={draft?.customizable ?? false}
                          onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...d[p.id], customizable: e.target.checked } }))}
                        />
                        <PenLine size={14} className="text-amber-600" /> Kërkon tekst/gërma të personalizuara
                      </label>
                      <VariantsEditor
                        variants={draft?.variants ?? []}
                        onChange={(v) => setDrafts((d) => ({ ...d, [p.id]: { ...d[p.id], variants: v } }))}
                      />
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
            {filtered.length === 0 && <p className="text-slate-500 text-sm">Nuk u gjet asnjë produkt.</p>}
          </div>
        </>
      )}
    </div>
  );
}

function VariantsEditor({
  variants,
  onChange,
}: {
  variants: VariantDraft[];
  onChange: (next: VariantDraft[]) => void;
}) {
  const addRow = () => onChange([...variants, { color: "", size: "", price: "", image: "" }]);
  const updateRow = (i: number, patch: Partial<VariantDraft>) => {
    const next = [...variants];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const removeRow = (i: number) => onChange(variants.filter((_, idx) => idx !== i));

  return (
    <div className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
          Ngjyra &amp; Përmasa (opsionale)
        </span>
        <button type="button" onClick={addRow} className="inline-flex items-center gap-1 text-[12px] font-semibold text-indigo-700 hover:text-indigo-900">
          <Plus size={13} /> Shto opsion
        </button>
      </div>
      <p className="text-[11.5px] text-indigo-700/70 mb-3 leading-relaxed">
        Shtoni një rresht për çdo kombinim ngjyrë/përmasë që klienti mund të zgjedhë (p.sh. &ldquo;E artë&rdquo; + &ldquo;M&rdquo;).
        Lini &ldquo;Ngjyra&rdquo; ose &ldquo;Përmasa&rdquo; bosh nëse produkti ka vetëm njërën prej tyre. Lini &ldquo;Çmimi&rdquo; bosh që
        ai kombinim të përdorë çmimin bazë të produktit — ose vendosni një çmim tjetër vetëm për të.
      </p>
      {variants.length === 0 && (
        <p className="text-[12px] text-indigo-700/50 italic">Ende pa opsione — produkti do të shfaqet me çmim dhe foto të vetme.</p>
      )}
      <div className="space-y-2">
        {variants.map((v, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center rounded-xl border border-indigo-200 bg-white p-2.5">
            <input
              value={v.color}
              onChange={(e) => updateRow(i, { color: e.target.value })}
              placeholder="Ngjyra (p.sh. E artë)"
              className="col-span-3 rounded-lg border border-slate-300 px-2 py-1.5 text-[12.5px] text-slate-900 placeholder:text-slate-400 bg-white"
            />
            <input
              value={v.size}
              onChange={(e) => updateRow(i, { size: e.target.value })}
              placeholder="Përmasa (p.sh. M)"
              className="col-span-3 rounded-lg border border-slate-300 px-2 py-1.5 text-[12.5px] text-slate-900 placeholder:text-slate-400 bg-white"
            />
            <input
              type="number"
              step="0.01"
              value={v.price}
              onChange={(e) => updateRow(i, { price: e.target.value })}
              placeholder="Çmimi (bosh = bazë)"
              className="col-span-3 rounded-lg border border-slate-300 px-2 py-1.5 text-[12.5px] text-slate-900 placeholder:text-slate-400 bg-white"
            />
            <div className="col-span-2 flex justify-center">
              <MiniImagePicker value={v.image} onChange={(img) => updateRow(i, { image: img })} />
            </div>
            <button type="button" onClick={() => removeRow(i)} className="col-span-1 h-8 w-8 flex items-center justify-center text-slate-400 hover:text-red-500">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniImagePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await resizeImageFile(file));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-300 bg-white flex items-center justify-center shrink-0">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImagePlus size={12} className="text-slate-400" />
        )}
      </div>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={busy}
        className="text-[10.5px] font-semibold text-slate-500 hover:text-amber-600 whitespace-nowrap"
        title="Foto e veçantë për këtë opsion (jo e detyrueshme)"
      >
        {busy ? "…" : value ? "Ndrysho" : "Foto"}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

function PriceBulkAdjust({
  product,
  productVariants,
  onApplied,
}: {
  product: Product;
  productVariants: ProductVariant[];
  onApplied: () => Promise<void>;
}) {
  const [percent, setPercent] = useState("");
  const [busy, setBusy] = useState(false);

  const hasOwnVariantPrices = productVariants.some((v) => v.price !== null);

  const apply = async () => {
    const n = Number(percent);
    if (!percent.trim() || !Number.isFinite(n) || n === 0) return;
    const direction = n > 0 ? "rritur" : "zbritur";
    const scope = hasOwnVariantPrices
      ? "çmimi bazë + të gjitha opsionet (ngjyra/përmasa) me çmim të vetin"
      : "çmimi bazë";
    if (
      !confirm(
        `${scope} i produktit "${product.name}" do të ${direction} me ${Math.abs(n)}%. Kjo prek VETËM këtë produkt. Vazhdoni?`
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await adjustProductPricesByPercent(product, productVariants, n);
      setPercent("");
      await onApplied();
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 whitespace-nowrap">
        <Percent size={11} className="text-slate-500" /> Rrit/zbrit me:
      </span>
      <input
        type="number"
        step="1"
        value={percent}
        onChange={(e) => setPercent(e.target.value)}
        placeholder="p.sh. 10 ose -10"
        className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-[12px] text-slate-900 placeholder:text-slate-400 bg-white"
      />
      <span className="text-[11px] text-slate-500">%</span>
      <button
        type="button"
        onClick={apply}
        disabled={busy || !percent.trim()}
        className="rounded-lg bg-slate-800 text-white px-2.5 py-1 text-[11.5px] font-semibold hover:bg-slate-900 disabled:opacity-40"
      >
        {busy ? "…" : "Apliko"}
      </button>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
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
