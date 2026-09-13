"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Save,
  X,
  Star,
  ArrowUp,
  ArrowDown,
  Search,
  EyeOff,
  Eye,
  PenLine,
  Percent,
  Loader2,
  CheckSquare,
  Square,
  AlertCircle,
  Check,
} from "lucide-react";
import ImagesField from "./ImagesField";
import OptionsField from "./OptionsField";
import VariantMatrix from "./VariantMatrix";
import {
  createProduct as apiCreateProduct,
  deleteProduct,
  deleteProducts,
  updateProduct,
  type ProductInput,
} from "@/lib/store";
import type { Category, Product, ProductVariant } from "@/lib/types";
import { fmtEUR, effectivePrice, getProductSets } from "@/lib/constants";
import { normalizeForSearch } from "@/lib/search";

function showError(err: unknown) {
  alert(err instanceof Error ? err.message : "Diçka shkoi keq. Provoni përsëri.");
}

type Draft = {
  name: string;
  code: string;
  colorCodes: Record<string, string>;
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
  setNames: string[];
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
  const sets = getProductSets(p);
  return {
    name: p.name,
    code: p.code,
    colorCodes: p.colorCodes ? { ...p.colorCodes } : {},
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
    setName: sets[0] ?? p.setName ?? "",
    setNames: sets,
  };
}

function isDraftModified(original: Product, draft?: Draft): boolean {
  if (!draft) return false;
  const origDraft = toDraft(original);
  return JSON.stringify(origDraft) !== JSON.stringify(draft);
}

const emptyDraft: Draft = {
  name: "",
  code: "",
  colorCodes: {},
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
  setNames: [],
};

function ColorCodesField({
  colors,
  colorCodes,
  baseCode,
  onChange,
}: {
  colors: string[];
  colorCodes: Record<string, string>;
  baseCode: string;
  onChange: (colorCodes: Record<string, string>) => void;
}) {
  if (colors.length === 0) return null;
  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
      <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-700 mb-1">
        Kodet sipas ngjyrës (opsionale)
      </span>
      <p className="text-[11px] text-slate-600 mb-2.5">
        Vendosni kod unik për secilën ngjyrë. Nëse lihet bosh, përdoret kodi bazë i produktit ({baseCode ? `"${baseCode}"` : "pa kod"}).
      </p>
      <div className="grid sm:grid-cols-2 gap-2.5">
        {colors.map((c) => (
          <div key={c} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
            <span className="text-[12px] font-semibold text-slate-800 min-w-[90px] truncate">{c}</span>
            <input
              type="text"
              value={colorCodes[c] ?? ""}
              onChange={(e) => {
                onChange({ ...colorCodes, [c]: e.target.value });
              }}
              placeholder={baseCode || "Kodi p.sh. COD. 101-A"}
              className="w-full rounded border border-slate-300 px-2 py-1 text-[12px]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProductsTab({
  categories,
  products,
  reload,
}: {
  categories: Category[];
  products: Product[];
  reload: () => Promise<void>;
}) {
  // Multi-editing state
  const [editingIds, setEditingIds] = useState<Set<number>>(new Set());
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});

  // Multi-addition pending drafts
  const [pendingNewDrafts, setPendingNewDrafts] = useState<Draft[]>([]);
  const [newDraft, setNewDraft] = useState<Draft>(emptyDraft);

  // Selection state for multi-delete
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Action / UI states
  const [savingAll, setSavingAll] = useState(false);
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [filterCat, setFilterCat] = useState("all");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"featured" | "all">("featured");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  // Compute modified product IDs
  const modifiedProductIds = useMemo(() => {
    return products.filter((p) => drafts[p.id] && isDraftModified(p, drafts[p.id])).map((p) => p.id);
  }, [products, drafts]);

  const hasActiveNewDraft = Boolean(newDraft.name.trim());
  const totalNewCount = pendingNewDrafts.length + (hasActiveNewDraft ? 1 : 0);
  const totalChangesCount = modifiedProductIds.length + totalNewCount;

  // Single patch helper
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

  // Toggle edit for single product
  const toggleEdit = (p: Product) => {
    setEditingIds((prev) => {
      const next = new Set(prev);
      if (next.has(p.id)) {
        next.delete(p.id);
      } else {
        next.add(p.id);
        setDrafts((d) => ({ ...d, [p.id]: d[p.id] ?? toDraft(p) }));
      }
      return next;
    });
  };

  // Toggle edit for all filtered products at once
  const toggleEditAll = () => {
    const visibleIds = filtered.map((p) => p.id);
    const allEditing = visibleIds.length > 0 && visibleIds.every((id) => editingIds.has(id));
    if (allEditing) {
      setEditingIds((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      const nextEditing = new Set(editingIds);
      const nextDrafts = { ...drafts };
      filtered.forEach((p) => {
        nextEditing.add(p.id);
        if (!nextDrafts[p.id]) {
          nextDrafts[p.id] = toDraft(p);
        }
      });
      setEditingIds(nextEditing);
      setDrafts(nextDrafts);
    }
  };

  // Cancel edit for single product
  const cancelEdit = (id: number) => {
    setEditingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setDrafts((d) => {
      const next = { ...d };
      delete next[id];
      return next;
    });
  };

  // Single save product
  const saveSingleEdit = async (id: number) => {
    const draft = drafts[id];
    if (!draft) return;
    setBusyId(id);
    try {
      await updateProduct(id, { ...draft, variants: pruneVariants(draft) });
      await reload();
      setEditingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setDrafts((d) => {
        const next = { ...d };
        delete next[id];
        return next;
      });
      setStatusMessage({
        type: "success",
        text: "Produkti u ruajt me sukses!",
      });
    } catch (err) {
      showError(err);
    } finally {
      setBusyId(null);
    }
  };

  // Delete single product
  const remove = async (id: number) => {
    if (!confirm("Jeni i sigurt që doni ta fshini këtë produkt?")) return;
    setBusyId(id);
    try {
      await deleteProduct(id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await reload();
      setStatusMessage({
        type: "success",
        text: "Produkti u fshi me sukses!",
      });
    } catch (err) {
      showError(err);
    } finally {
      setBusyId(null);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`Jeni i sigurt që dëshironi të fshini ${ids.length} produkte të zgjedhura?`)) return;

    setDeletingBulk(true);
    setStatusMessage(null);
    try {
      await deleteProducts(ids);
      setSelectedIds(new Set());
      setDrafts((prev) => {
        const next = { ...prev };
        ids.forEach((id) => delete next[id]);
        return next;
      });
      setEditingIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      await reload();
      setStatusMessage({
        type: "success",
        text: `U fshinë me sukses ${ids.length} produkte!`,
      });
    } catch (err) {
      showError(err);
    } finally {
      setDeletingBulk(false);
    }
  };

  // Multi Selection Toggle
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const visibleIds = filtered.map((p) => p.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  // Add new draft to pending queue
  const addPendingNewProduct = () => {
    if (!newDraft.name.trim()) {
      alert("Ju lutemi vendosni emrin e produktit të ri para se ta shtoni.");
      return;
    }
    setPendingNewDrafts((prev) => [...prev, { ...newDraft }]);
    setNewDraft(emptyDraft);
    setStatusMessage({
      type: "success",
      text: "Produkt i ri u shtua në listën e pritjes! Shtypni butonin e madh lart për t'i ruajtur të gjitha.",
    });
  };

  const removePendingNewProduct = (index: number) => {
    setPendingNewDrafts((prev) => prev.filter((_, i) => i !== index));
  };

  // Discard all unsaved changes
  const discardAllChanges = () => {
    if (!confirm("A jeni i sigurt që dëshironi të anuloni të gjitha ndryshimet e naruajtura?")) return;
    setDrafts({});
    setEditingIds(new Set());
    setPendingNewDrafts([]);
    setNewDraft(emptyDraft);
    setStatusMessage(null);
  };

  // BIG SAVE BUTTON handler
  const handleSaveAll = async () => {
    if (totalChangesCount === 0) return;
    setSavingAll(true);
    setStatusMessage(null);
    try {
      const updatePromises = modifiedProductIds.map((id) => {
        const d = drafts[id]!;
        return updateProduct(id, { ...d, variants: pruneVariants(d) });
      });

      const newDraftsToCreate = [...pendingNewDrafts];
      if (hasActiveNewDraft) {
        newDraftsToCreate.push(newDraft);
      }

      const createPromises = newDraftsToCreate.map((d) => {
        return apiCreateProduct({ ...d, variants: pruneVariants(d) });
      });

      await Promise.all([...updatePromises, ...createPromises]);
      await reload();

      setEditingIds(new Set());
      setDrafts({});
      setPendingNewDrafts([]);
      setNewDraft(emptyDraft);

      setStatusMessage({
        type: "success",
        text: `U ruajtën me sukses të gjitha ndryshimet (${modifiedProductIds.length} produkte të përditësuara, ${newDraftsToCreate.length} produkte të reja shtuar)!`,
      });
    } catch (err) {
      showError(err);
    } finally {
      setSavingAll(false);
    }
  };

  /** Raise/lower base price AND every variant price of ONE product by pct%. */
  const adjustPrices = async (p: Product, pct: number, dir: 1 | -1) => {
    if (!Number.isFinite(pct) || pct <= 0 || pct > 99) return;
    const factor = 1 + (dir * pct) / 100;
    const r2 = (n: number) => Math.max(Math.round(n * 100) / 100, 0.01);

    // If currently editing in draft, update draft
    if (editingIds.has(p.id) || drafts[p.id]) {
      const curDraft = drafts[p.id] ?? toDraft(p);
      setDrafts((d) => ({
        ...d,
        [p.id]: {
          ...curDraft,
          price: r2(curDraft.price * factor),
          variants: curDraft.variants.map((v) => ({ ...v, price: r2(v.price * factor) })),
        },
      }));
      return;
    }

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
    if (editingIds.has(p.id) || drafts[p.id]) {
      const curDraft = drafts[p.id] ?? toDraft(p);
      setDrafts((d) => ({
        ...d,
        [p.id]: { ...curDraft, salePct: pct },
      }));
      return;
    }

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
      {/* BIG SAVE BUTTON TOP BANNER */}
      <div className="sticky top-16 z-20 bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-2xl border border-slate-800 transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Save className="text-emerald-400" size={20} />
                Ndryshimi me Shumicë i Produkteve
              </h2>
              {totalChangesCount > 0 ? (
                <span className="animate-pulse bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold px-3 py-1 rounded-full">
                  ⚡ {totalChangesCount} ndryshime në pritje
                </span>
              ) : (
                <span className="bg-slate-800 text-slate-400 text-[11px] font-medium px-2.5 py-0.5 rounded-full">
                  Nuk ka ndryshime të naruajtura
                </span>
              )}
            </div>
            <p className="text-[12.5px] text-slate-300 mt-1">
              {totalChangesCount > 0
                ? `${modifiedProductIds.length} produkte të ndryshuara + ${totalNewCount} produkte të reja gati për t'u ruajtur.`
                : "Mund të ndryshoni ose të shtoni disa produkte njëkohësisht, pastaj shtypni butonin e madh për t'i ruajtur të gjitha."}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {totalChangesCount > 0 && (
              <button
                onClick={discardAllChanges}
                disabled={savingAll}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-[12.5px] font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
              >
                <X size={14} /> Anulo ndryshimet
              </button>
            )}

            <button
              onClick={handleSaveAll}
              disabled={savingAll || totalChangesCount === 0}
              className={`inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-[14.5px] font-extrabold shadow-xl transition-all ${
                totalChangesCount > 0
                  ? "bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white hover:from-emerald-400 hover:to-teal-500 hover:shadow-emerald-900/40 hover:scale-[1.02] active:scale-[0.98] ring-2 ring-emerald-400/50 cursor-pointer"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
              } disabled:opacity-50`}
            >
              {savingAll ? (
                <>
                  <Loader2 size={18} className="animate-spin text-white" />
                  <span>Duke ruajtur ({totalChangesCount})…</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>RUAJ TË GJITHA NDRYSHIMET {totalChangesCount > 0 ? `(${totalChangesCount})` : ""}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-[13.5px] font-semibold flex items-center justify-between transition-all ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-sm"
              : "bg-red-50 text-red-900 border border-red-300 shadow-sm"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? <Check size={18} className="text-emerald-600 shrink-0" /> : <AlertCircle size={18} className="text-red-600 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-700">
            <X size={16} />
          </button>
        </div>
      )}

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
          {/* SECTION: ADD NEW PRODUCTS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-base">
                <Plus size={18} className="text-amber-600" /> Shto produkte të reja
              </h3>
              {pendingNewDrafts.length > 0 && (
                <span className="bg-amber-100 text-amber-900 text-[12px] font-bold px-3 py-1 rounded-full border border-amber-200">
                  {pendingNewDrafts.length} në pritje për t&apos;u ruajtur
                </span>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Labeled label="Emri">
                <input value={newDraft.name} onChange={(e) => setNewDraft({ ...newDraft, name: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px]" placeholder="Emri i produktit të ri..." />
              </Labeled>
              <Labeled label="Kodi (opsional)">
                <input value={newDraft.code} onChange={(e) => setNewDraft({ ...newDraft, code: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px]" placeholder="p.sh. COD. 101" />
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
            </div>
            <div className="mt-4">
              <OptionsField
                label="Setet ku bën pjesë ky produkt (0, 1 ose disa sete)"
                placeholder="p.sh. Set A"
                hint="Mund ta futni këtë produkt në 0, 1 ose disa sete njëkohësisht. Shtypni «Shto» ose Enter."
                value={newDraft.setNames}
                onChange={(v) => setNewDraft({ ...newDraft, setNames: v, setName: v[0] ?? "" })}
              />
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
            <ColorCodesField
              colors={newDraft.colors}
              colorCodes={newDraft.colorCodes}
              baseCode={newDraft.code}
              onChange={(codes) => setNewDraft({ ...newDraft, colorCodes: codes })}
            />
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

            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
              <button
                onClick={addPendingNewProduct}
                disabled={!newDraft.name.trim()}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 px-4 py-2.5 text-[13px] font-bold text-amber-900 disabled:opacity-50 transition-colors"
              >
                <Plus size={15} /> Shto në listën e të rejave
              </button>
              <span className="text-[12px] text-slate-500">
                Ose mund ta vendosni emrin e produktit këtu dhe të shtypni butonin e madh të jeshil lart për t&apos;i ruajtur të gjitha.
              </span>
            </div>

            {/* LIST OF PENDING NEW PRODUCTS */}
            {pendingNewDrafts.length > 0 && (
              <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50/60 p-4 space-y-3">
                <h4 className="text-[13px] font-bold text-amber-900 flex items-center justify-between">
                  <span>Produkte të reja në pritje për t&apos;u ruajtur ({pendingNewDrafts.length})</span>
                  <span className="text-[11.5px] font-normal text-amber-800">Do të ruhen kur të shtypni &quot;RUAJ TË GJITHA NDRYSHIMET&quot; lart.</span>
                </h4>
                <div className="space-y-2">
                  {pendingNewDrafts.map((pd, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 bg-white p-3 rounded-lg border border-amber-200 shadow-sm">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 text-[13.5px] truncate">{pd.name || "Produkt i ri pa emër"}</p>
                        <p className="text-[11.5px] text-slate-600">
                          {categoryName(pd.categoryId)} · {fmtEUR(pd.price)} {pd.code ? `· ${pd.code}` : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => removePendingNewProduct(idx)}
                        className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        title="Hiqe nga lista"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SEARCH, FILTER & BULK ACTIONS BAR */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kërko produkt…" className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-[13.5px]" />
              </div>
              <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-[13px]">
                <option value="all">Të gjitha kategoritë</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* SELECTION AND BULK EDIT CONTROL BAR */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleSelectAll}
                  className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  {filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id)) ? (
                    <CheckSquare size={16} className="text-amber-600" />
                  ) : (
                    <Square size={16} className="text-slate-400" />
                  )}
                  <span>Zgjidh të gjitha ({filtered.length})</span>
                </button>

                {selectedIds.size > 0 && (
                  <span className="bg-amber-100 text-amber-900 font-bold text-[12px] px-3 py-0.5 rounded-full border border-amber-200">
                    {selectedIds.size} produkt{selectedIds.size > 1 ? "e" : ""} të zgjedhura
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={toggleEditAll}
                  className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-700 hover:text-amber-600 border border-slate-300 rounded-lg px-3 py-1.5 bg-slate-50 hover:bg-amber-50 transition-colors"
                >
                  <PenLine size={14} />
                  {filtered.length > 0 && filtered.every((p) => editingIds.has(p.id)) ? "Mbyll redaktimin" : "Ndrysho të gjitha"}
                </button>

                {selectedIds.size > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    disabled={deletingBulk}
                    className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[12.5px] px-4 py-1.5 rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {deletingBulk ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    Fshi {selectedIds.size} produkt{selectedIds.size > 1 ? "e" : ""} të zgjedhura
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* PRODUCT LIST */}
          <div className="space-y-3">
            {filtered.map((p) => {
              const isEditing = editingIds.has(p.id);
              const draft = drafts[p.id];
              const isModified = isDraftModified(p, draft);
              const isSelected = selectedIds.has(p.id);
              const siblings = filtered.filter((x) => x.categoryId === p.categoryId);
              const posInCat = siblings.findIndex((x) => x.id === p.id);

              return (
                <div
                  key={p.id}
                  className={`rounded-2xl border transition-all p-4 sm:p-5 bg-white ${
                    isSelected ? "border-amber-400 ring-2 ring-amber-300/40 bg-amber-50/20" : isModified ? "border-emerald-300 ring-2 ring-emerald-200/50" : "border-slate-200"
                  }`}
                >
                  {!isEditing ? (
                    <>
                      <div className="flex items-start gap-4">
                        {/* MULTI SELECT CHECKBOX */}
                        <button
                          onClick={() => toggleSelect(p.id)}
                          className="mt-1 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer shrink-0"
                          title={isSelected ? "Hiq nga zgjedhja" : "Zgjidh produktin"}
                        >
                          {isSelected ? (
                            <CheckSquare size={20} className="text-amber-600" />
                          ) : (
                            <Square size={20} className="text-slate-300 hover:text-slate-400" />
                          )}
                        </button>

                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={draft?.image || p.image || "/images/categories/germa.jpg"} alt={p.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-slate-900">{draft?.name || p.name}</p>
                            {isModified && (
                              <span className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                                U Ndryshua (Naruajtur)
                              </span>
                            )}
                            {p.customizable && <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">Personalizohet</span>}
                            {!p.active && <span className="text-[10px] font-bold uppercase tracking-wide text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded">Fshehur</span>}
                          </div>
                          <p className="text-[12.5px] text-slate-700">
                            {categoryName(draft?.categoryId !== undefined ? draft.categoryId : p.categoryId)} · {fmtEUR(draft?.price ?? p.price)} {(draft?.code || p.code) && `· ${draft?.code || p.code}`}
                          </p>
                          {(() => {
                            const sets = getProductSets(p);
                            const colorCodeEntries = Object.entries(p.colorCodes ?? {}).filter(([_, c]) => Boolean(c));
                            if (sets.length === 0 && colorCodeEntries.length === 0) return null;
                            return (
                              <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px]">
                                {sets.length > 0 && (
                                  <span className="rounded bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">
                                    Setet ({sets.length}): {sets.join(", ")}
                                  </span>
                                )}
                                {colorCodeEntries.length > 0 && (
                                  <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                                    Kodet e ngjyrave: {colorCodeEntries.map(([k, v]) => `${k}: ${v}`).join(" | ")}
                                  </span>
                                )}
                              </div>
                            );
                          })()}
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

                          <div className="flex gap-2.5 items-center">
                            <button onClick={() => toggleEdit(p)} className="text-[12.5px] font-bold text-amber-600 hover:text-amber-700 underline">
                              Ndrysho
                            </button>
                            <button onClick={() => remove(p.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                              <Trash2 size={15} />
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
                    /* EDIT FORM FOR THIS PRODUCT */
                    <div>
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleSelect(p.id)}
                            className="text-slate-400 hover:text-amber-600"
                          >
                            {isSelected ? <CheckSquare size={18} className="text-amber-600" /> : <Square size={18} className="text-slate-300" />}
                          </button>
                          <span className="font-bold text-slate-900 text-sm">Redaktimi i produktit: {p.name}</span>
                          {isModified && (
                            <span className="text-[10.5px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                              Ka ndryshime të naruajtura
                            </span>
                          )}
                        </div>
                        <button onClick={() => cancelEdit(p.id)} className="text-slate-400 hover:text-slate-600 text-[12px] font-semibold flex items-center gap-1">
                          <X size={14} /> Mbyll
                        </button>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <Labeled label="Emri">
                          <input
                            value={draft?.name ?? p.name}
                            onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...(d[p.id] ?? toDraft(p)), name: e.target.value } }))}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px]"
                          />
                        </Labeled>
                        <Labeled label="Kodi">
                          <input
                            value={draft?.code ?? p.code}
                            onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...(d[p.id] ?? toDraft(p)), code: e.target.value } }))}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px]"
                          />
                        </Labeled>
                        <Labeled label="Çmimi (€)">
                          <input
                            type="number"
                            step="0.01"
                            value={draft?.price ?? p.price}
                            onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...(d[p.id] ?? toDraft(p)), price: Number(e.target.value) } }))}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px]"
                          />
                        </Labeled>
                        <Labeled label="Kategoria">
                          <select
                            value={draft?.categoryId ?? p.categoryId ?? ""}
                            onChange={(e) =>
                              setDrafts((d) => ({
                                ...d,
                                [p.id]: { ...(d[p.id] ?? toDraft(p)), categoryId: e.target.value ? Number(e.target.value) : null },
                              }))
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px]"
                          >
                            <option value="">Pa kategori</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </Labeled>
                        <Labeled label="Përmasat">
                          <input
                            value={draft?.dims ?? p.dims}
                            onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...(d[p.id] ?? toDraft(p)), dims: e.target.value } }))}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px]"
                          />
                        </Labeled>
                        <Labeled label="Materiali">
                          <input
                            value={draft?.material ?? p.material}
                            onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...(d[p.id] ?? toDraft(p)), material: e.target.value } }))}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px]"
                          />
                        </Labeled>
                      </div>

                      <div className="mt-4">
                        <OptionsField
                          label="Setet ku bën pjesë ky produkt (0, 1 ose disa sete)"
                          placeholder="p.sh. Set A"
                          hint="Mund ta futni këtë produkt në 0, 1 ose disa sete njëkohësisht."
                          value={draft?.setNames ?? getProductSets(p)}
                          onChange={(v) => setDrafts((d) => ({ ...d, [p.id]: { ...(d[p.id] ?? toDraft(p)), setNames: v, setName: v[0] ?? "" } }))}
                        />
                      </div>

                      <div className="mt-4">
                        <Labeled label="Përshkrimi">
                          <textarea
                            value={draft?.description ?? p.description}
                            onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...(d[p.id] ?? toDraft(p)), description: e.target.value } }))}
                            rows={2}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px] resize-none"
                          />
                        </Labeled>
                      </div>

                      <div className="mt-4">
                        <ImagesField
                          value={draft?.images ?? p.images}
                          onChange={(v) => setDrafts((d) => ({ ...d, [p.id]: { ...(d[p.id] ?? toDraft(p)), images: v, image: v[0] ?? "" } }))}
                        />
                      </div>

                      <div className="mt-4 grid sm:grid-cols-2 gap-4">
                        <OptionsField
                          label="Madhësi të zgjidhshme (opsionale)"
                          placeholder="p.sh. Lartësia 35 cm"
                          value={draft?.sizes ?? p.sizes}
                          onChange={(v) => setDrafts((d) => ({ ...d, [p.id]: { ...(d[p.id] ?? toDraft(p)), sizes: v } }))}
                        />
                        <OptionsField
                          label="Ngjyra / finitime të zgjidhshme (opsionale)"
                          placeholder="p.sh. Finish i artë"
                          value={draft?.colors ?? p.colors}
                          onChange={(v) => setDrafts((d) => ({ ...d, [p.id]: { ...(d[p.id] ?? toDraft(p)), colors: v } }))}
                        />
                      </div>

                      <ColorCodesField
                        colors={draft?.colors ?? p.colors}
                        colorCodes={draft?.colorCodes ?? p.colorCodes ?? {}}
                        baseCode={draft?.code ?? p.code}
                        onChange={(codes) =>
                          setDrafts((d) => ({
                            ...d,
                            [p.id]: { ...(d[p.id] ?? toDraft(p)), colorCodes: codes },
                          }))
                        }
                      />

                      {((draft?.colors?.length ?? p.colors.length) > 0 || (draft?.sizes?.length ?? p.sizes.length) > 0) && (
                        <div className="mt-4">
                          <VariantMatrix
                            basePrice={draft?.price ?? p.price}
                            colors={draft?.colors ?? p.colors}
                            sizes={draft?.sizes ?? p.sizes}
                            value={draft?.variants ?? p.variants}
                            onChange={(v) => setDrafts((d) => ({ ...d, [p.id]: { ...(d[p.id] ?? toDraft(p)), variants: v } }))}
                          />
                        </div>
                      )}

                      <label className="mt-4 flex items-center gap-2 text-[13px] text-slate-700">
                        <input
                          type="checkbox"
                          checked={draft?.customizable ?? p.customizable}
                          onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...(d[p.id] ?? toDraft(p)), customizable: e.target.checked } }))}
                        />
                        <PenLine size={14} className="text-amber-600" /> Kërkon tekst/gërma të personalizuara
                      </label>

                      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-[11.5px] text-slate-500">
                          Mund ta ruani këtë produkt veçmas ose të gjitha së bashku me butonin jeshil lart.
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveSingleEdit(p.id)}
                            disabled={busyId === p.id}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-[12.5px] font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <Save size={13} /> Ruaj këtë produkt
                          </button>
                          <button
                            onClick={() => cancelEdit(p.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-[12.5px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                          >
                            <X size={13} /> Anulo
                          </button>
                        </div>
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
        active ? "bg-slate-900 text-white" : "bg-white border border-slate-300 text-slate-600 hover:border-amber-400"
      }`}
    >
      {children}
    </button>
  );
}
