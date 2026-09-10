"use client";

import { useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Save, X } from "lucide-react";
import ImageField from "./ImageField";
import {
  createCategory as apiCreateCategory,
  deleteCategory,
  updateCategory,
} from "@/lib/store";
import type { Category } from "@/lib/types";

function showError(err: unknown) {
  alert(err instanceof Error ? err.message : "Diçka shkoi keq. Provoni përsëri.");
}

type Draft = {
  name: string;
  description: string;
  image: string;
};

const emptyDraft: Draft = { name: "", description: "", image: "" };

export default function CategoriesTab({
  categories,
  reload,
}: {
  categories: Category[];
  reload: () => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [newDraft, setNewDraft] = useState<Draft>(emptyDraft);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const startEdit = (c: Category) => {
    setEditingId(c.id);
    setDrafts((d) => ({ ...d, [c.id]: { name: c.name, description: c.description, image: c.image } }));
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
      await updateCategory(id, draft);
      await reload();
      setEditingId(null);
    } catch (err) {
      showError(err);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Jeni i sigurt që doni ta fshini këtë kategori? Produktet e saj do të mbeten pa kategori.")) return;
    setBusyId(id);
    try {
      await deleteCategory(id);
      await reload();
    } catch (err) {
      showError(err);
    } finally {
      setBusyId(null);
    }
  };

  const move = async (c: Category, dir: -1 | 1) => {
    const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((x) => x.id === c.id);
    const swapWith = sorted[idx + dir];
    if (!swapWith) return;
    setBusyId(c.id);
    try {
      await Promise.all([
        updateCategory(c.id, { sortOrder: swapWith.sortOrder }),
        updateCategory(swapWith.id, { sortOrder: c.sortOrder }),
      ]);
      await reload();
    } catch (err) {
      showError(err);
    } finally {
      setBusyId(null);
    }
  };

  const createCategory = async () => {
    if (!newDraft.name.trim()) return;
    setCreating(true);
    try {
      await apiCreateCategory(newDraft);
      setNewDraft(emptyDraft);
      await reload();
    } catch (err) {
      showError(err);
    } finally {
      setCreating(false);
    }
  };

  const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Plus size={16} className="text-amber-600" /> Shto kategori të re
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-700">Emri</span>
            <input
              value={newDraft.name}
              onChange={(e) => setNewDraft({ ...newDraft, name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px]"
              placeholder="p.sh. Kryqe Bronzi"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-700">Përshkrimi</span>
            <input
              value={newDraft.description}
              onChange={(e) => setNewDraft({ ...newDraft, description: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px]"
              placeholder="Përshkrim i shkurtër…"
            />
          </label>
        </div>
        <div className="mt-4">
          <ImageField value={newDraft.image} onChange={(v) => setNewDraft({ ...newDraft, image: v })} />
        </div>
        <button
          onClick={createCategory}
          disabled={creating || !newDraft.name.trim()}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 via-amber-500 to-amber-700 px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-50"
        >
          <Plus size={15} /> Shto kategorinë
        </button>
      </div>

      <div className="space-y-3">
        {sorted.map((c, i) => {
          const isEditing = editingId === c.id;
          const draft = drafts[c.id];
          return (
            <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              {!isEditing ? (
                <div className="flex items-start gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.image || "/images/categories/germa.jpg"} alt={c.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">{c.name}</p>
                    <p className="text-[12.5px] text-slate-700 line-clamp-2">{c.description || "Pa përshkrim"}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">/{c.slug}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex gap-1.5">
                      <button onClick={() => move(c, -1)} disabled={i === 0 || busyId === c.id} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-700 disabled:opacity-30">
                        <ArrowUp size={13} />
                      </button>
                      <button onClick={() => move(c, 1)} disabled={i === sorted.length - 1 || busyId === c.id} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-700 disabled:opacity-30">
                        <ArrowDown size={13} />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(c)} className="text-[12px] font-semibold text-amber-600">Ndrysho</button>
                      <button onClick={() => remove(c.id)} className="text-slate-600 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-700">Emri</span>
                      <input
                        value={draft?.name ?? ""}
                        onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: { ...d[c.id], name: e.target.value } }))}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px]"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-700">Përshkrimi</span>
                      <input
                        value={draft?.description ?? ""}
                        onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: { ...d[c.id], description: e.target.value } }))}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px]"
                      />
                    </label>
                  </div>
                  <div className="mt-4">
                    <ImageField
                      value={draft?.image ?? ""}
                      onChange={(v) => setDrafts((d) => ({ ...d, [c.id]: { ...d[c.id], image: v } }))}
                    />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => saveEdit(c.id)}
                      disabled={busyId === c.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 text-white px-4 py-2 text-[12.5px] font-semibold disabled:opacity-50"
                    >
                      <Save size={13} /> Ruaj
                    </button>
                    <button
                      onClick={() => cancelEdit(c.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-[12.5px] font-semibold text-slate-600"
                    >
                      <X size={13} /> Anulo
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {sorted.length === 0 && <p className="text-slate-700 text-sm">Ende nuk ka kategori.</p>}
      </div>
    </div>
  );
}
