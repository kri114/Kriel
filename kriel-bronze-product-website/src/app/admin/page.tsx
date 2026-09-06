"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Lock, Eye, EyeOff, Search, Camera, Plus, LogOut, Trash2, Check, Star,
  ChevronUp, ChevronDown, Image as ImageIcon, Loader2, FolderPlus,
  Pencil, X, ExternalLink, AlertTriangle, Sparkles,
} from "lucide-react";
import type { CatalogPayload, ProductDto } from "@/lib/types";
import { fmtEUR } from "@/lib/types";
import { Logo } from "@/components/Reveal";

// ── Ndihmësit ────────────────────────────────────────────────
async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || "Gabim i panjohur");
  return j;
}

/** Fotoja e ngarkuar kthehet në JPEG dataURL (e optimizuar). */
function fileToDataURL(file: File, maxDim = 1100, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no-canvas");
        ctx.fillStyle = "#1b1712";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Fotoja nuk u lexua."));
    };
    img.src = url;
  });
}

function parsePrice(v: string, fallback: number): number {
  const n = parseFloat(v.replace(",", ".").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : fallback;
}

// ═════════════════════════════════════════════════════════════
export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [catalog, setCatalog] = useState<CatalogPayload | null>(null);
  const [tab, setTab] = useState<"featured" | "produkte" | "kategorite" | "shto">("featured");
  const [toast, setToast] = useState("");

  const refresh = useCallback(async () => {
    const j = await fetch("/api/catalog", { cache: "no-store" }).then((r) => r.json());
    setCatalog(j);
  }, []);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2600);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const s = await fetch("/api/admin/session", { cache: "no-store" }).then((r) => r.json());
        setAuthed(!!s.authed);
        if (s.authed) await refresh();
      } catch {
        setAuthed(false);
      }
    })();
  }, [refresh]);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setCatalog(null);
  };

  return (
    <div className="grain min-h-screen bg-ink text-ivory">
      {/* header */}
      <header className="sticky top-0 z-40 bg-ink/90 backdrop-blur-xl border-b border-line">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={34} />
            <div className="leading-tight">
              <p className="font-display text-[19px] font-semibold text-ivory">Paneli Admin</p>
              <p className="text-[9.5px] tracking-[0.24em] uppercase text-bronze/80">
                {catalog ? `${catalog.products.length} produkte · ${catalog.categories.length} kategori` : "KRIEL"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-[11.5px] font-semibold text-ivory-2 hover:text-bronze hover:border-bronze/50 transition-colors"
            >
              <ExternalLink size={13} /> Faqja
            </Link>
            {authed && (
              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-[11.5px] font-semibold text-ivory-2 hover:text-red-400 hover:border-red-400/50 transition-colors"
              >
                <LogOut size={13} /> Dil
              </button>
            )}
          </div>
        </div>
      </header>

      {authed === null ? (
        <div className="flex items-center justify-center py-40 text-bronze">
          <Loader2 size={26} className="animate-spin" />
        </div>
      ) : !authed ? (
        <LoginView
          onDone={async () => {
            setAuthed(true);
            await refresh();
          }}
        />
      ) : (
        <main className="mx-auto max-w-4xl px-4 sm:px-6 pb-24">
          {/* tabs */}
          <div className="no-scrollbar flex gap-2 pt-5 overflow-x-auto">
            {(
              [
                ["featured", "★ Më të pëlqyerat", Star],
                ["produkte", "Produktet", Pencil],
                ["kategorite", "Kategoritë", FolderPlus],
                ["shto", "Shto produkt", Plus],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`shrink-0 rounded-full px-5 py-2.5 text-[12.5px] font-bold tracking-wide transition-all ${
                  tab === id
                    ? "bg-gradient-to-r from-[#ecd9a8] via-bronze to-bronze-2 text-ink shadow-[0_8px_24px_rgba(201,163,92,0.3)]"
                    : "border border-line text-ivory-2 hover:border-bronze/40 hover:text-bronze"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {catalog && tab === "featured" && (
              <FeaturedTab catalog={catalog} refresh={refresh} notify={notify} />
            )}
            {catalog && tab === "produkte" && (
              <ProductsTab catalog={catalog} refresh={refresh} notify={notify} />
            )}
            {catalog && tab === "kategorite" && (
              <CategoriesTab catalog={catalog} refresh={refresh} notify={notify} />
            )}
            {catalog && tab === "shto" && (
              <AddProductTab
                catalog={catalog}
                refresh={refresh}
                notify={notify}
                onAdded={() => setTab("produkte")}
              />
            )}
          </div>
        </main>
      )}

      {/* toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] inline-flex items-center gap-2 rounded-full border border-bronze/50 bg-ink-2 px-5 py-3 shadow-[0_16px_50px_rgba(0,0,0,0.6)]"
          >
            <Check size={15} className="text-bronze" strokeWidth={2.6} />
            <span className="text-[13px] font-semibold text-ivory">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Login ────────────────────────────────────────────────────
function LoginView({ onDone }: { onDone: () => void }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ username: u, password: p }),
      });
      onDone();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Kredenciale të gabuara.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center"
      >
        <span className="w-16 h-16 rounded-2xl bg-gradient-to-br from-bronze/30 to-transparent border border-bronze/40 flex items-center justify-center text-bronze">
          <Lock size={26} strokeWidth={1.8} />
        </span>
        <h1 className="mt-5 font-display text-[30px] font-semibold text-ivory text-center">
          Vetëm për administratorin
        </h1>
        <p className="mt-2 text-[13px] text-ivory-2/70 text-center max-w-xs font-light">
          Identifikohuni për të ndryshuar çmimet, fotot e produkteve dhe të kategorive,
          si dhe produktet e zgjedhura.
        </p>
        <form onSubmit={submit} className="mt-7 w-full max-w-xs flex flex-col gap-3">
          <input
            value={u}
            onChange={(e) => setU(e.target.value)}
            placeholder="Përdoruesi"
            autoComplete="username"
            className="rounded-xl border border-line bg-ink-3/60 px-4 py-3.5 text-[14.5px] text-ivory placeholder:text-ivory-2/35"
          />
          <div className="relative">
            <input
              value={p}
              onChange={(e) => setP(e.target.value)}
              placeholder="Fjalëkalimi"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              className="w-full rounded-xl border border-line bg-ink-3/60 px-4 py-3.5 pr-12 text-[14.5px] text-ivory placeholder:text-ivory-2/35"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ivory-2/60"
              aria-label={show ? "Fshih" : "Shfaq"}
            >
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {err && <p className="text-[12.5px] text-red-400">{err}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ecd9a8] via-bronze to-bronze-2 py-3.5 text-[14.5px] font-bold text-ink disabled:opacity-60"
          >
            {busy && <Loader2 size={16} className="animate-spin" />}
            Hyr në panel
          </button>
          <p className="text-center text-[11px] text-ivory-2/45 font-light leading-relaxed">
            Kredencialet vendosen nga ndryshoret e mjedisit
            <br />
            <code className="text-bronze/80">ADMIN_USERNAME / ADMIN_PASSWORD</code>
          </p>
        </form>
      </motion.div>
    </div>
  );
}

// ── Tab: Më të pëlqyerat ─────────────────────────────────────
function FeaturedTab({
  catalog,
  refresh,
  notify,
}: {
  catalog: CatalogPayload;
  refresh: () => Promise<void>;
  notify: (m: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");

  const featured = useMemo(
    () => catalog.products.filter((p) => p.featured).sort((a, b) => a.featuredOrder - b.featuredOrder),
    [catalog.products]
  );
  const featuredIds = featured.map((p) => p.id);
  const featuredSet = new Set(featuredIds);

  const candidates = useMemo(
    () =>
      catalog.products.filter(
        (p) =>
          !featuredSet.has(p.id) &&
          (q.trim() === "" || (p.name + " " + p.code).toLowerCase().includes(q.trim().toLowerCase()))
      ),
    [catalog.products, q, featuredIds.join(",")]
  );

  const save = async (ids: string[], msg: string) => {
    setBusy(true);
    try {
      await api("/api/admin/featured", { method: "POST", body: JSON.stringify({ ids }) });
      await refresh();
      notify(msg);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Gabim");
    } finally {
      setBusy(false);
    }
  };

  const move = (i: number, dir: -1 | 1) => {
    const next = [...featuredIds];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    save(next, "Renditja u ruajt.");
  };

  return (
    <div>
      <div className="rounded-2xl border border-bronze/30 bg-gradient-to-br from-bronze/10 to-transparent p-5">
        <p className="flex items-center gap-2 text-[13px] font-bold text-ivory">
          <Sparkles size={15} className="text-bronze" />
          Produktet e zgjedhura — “Më të pëlqyerat”
        </p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ivory-2/75 font-light">
          Këto produkte shfaqen <strong className="text-ivory font-semibold">në krye të faqes</strong>, menjëherë
          pas hyrjes, nën badge-në elegante “Më të pëlqyerat”. Shtoni, hiqni ose
          ndryshoni rendin — ndryshimi publikohet menjëherë.
        </p>
      </div>

      {/* lista e zgjedhur */}
      <div className="mt-5 flex flex-col gap-2.5">
        {featured.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line px-5 py-8 text-center text-[13px] text-ivory-2/60">
            Asnjë produkt i zgjedhur ende — shtoni nga lista më poshtë.
          </p>
        )}
        {featured.map((p, i) => (
          <div
            key={p.id}
            className="flex items-center gap-3 rounded-2xl border border-bronze/35 bg-ink-2 px-3.5 py-3"
          >
            <span className="font-display italic text-[26px] text-bronze/60 w-8 text-center select-none">
              {String(i + 1).padStart(2, "0")}
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.img} alt="" className="h-14 w-14 rounded-xl object-cover border border-line" />
            <div className="min-w-0 flex-1">
              <p className="font-display text-[17px] font-semibold text-ivory truncate">{p.name}</p>
              <p className="text-[10.5px] tracking-[0.14em] uppercase text-ivory-2/50 truncate">
                {p.code || "pa kod"} · {fmtEUR(p.price)}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <IconBtn onClick={() => move(i, -1)} disabled={busy || i === 0} label="Lëviz lart">
                <ChevronUp size={15} />
              </IconBtn>
              <IconBtn onClick={() => move(i, 1)} disabled={busy || i === featured.length - 1} label="Lëviz poshtë">
                <ChevronDown size={15} />
              </IconBtn>
              <IconBtn
                onClick={() => save(featuredIds.filter((id) => id !== p.id), "U hoq nga të pëlqyerat.")}
                disabled={busy}
                label="Hiq"
                danger
              >
                <X size={15} />
              </IconBtn>
            </div>
          </div>
        ))}
      </div>

      {/* kërkimi për të shtuar */}
      <div className="mt-8">
        <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-ivory-2/60">
          Shto produkt te “Më të pëlqyerat”
        </p>
        <div className="relative mt-3">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bronze/70" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Kërko produkt për t'i shtuar…"
            className="w-full rounded-full border border-line bg-ink-3/60 py-2.5 pl-10 pr-4 text-[13.5px] text-ivory placeholder:text-ivory-2/40"
          />
        </div>
        <div className="mt-3 grid sm:grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
          {candidates.slice(0, 24).map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-line bg-ink-2/70 px-3 py-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.img} alt="" className="h-11 w-11 rounded-lg object-cover border border-line/70" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-ivory truncate">{p.name}</p>
                <p className="text-[10px] text-ivory-2/50 truncate">{fmtEUR(p.price)}</p>
              </div>
              <IconBtn
                onClick={() => save([...featuredIds, p.id], "U shtua te “Më të pëlqyerat”.")}
                disabled={busy}
                label="Shto"
                accent
              >
                <Plus size={15} />
              </IconBtn>
            </div>
          ))}
          {candidates.length === 0 && (
            <p className="col-span-2 py-6 text-center text-[12.5px] text-ivory-2/55">
              Asgjë për të shtuar — provoni një kërkim tjetër.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tab: Produktet ───────────────────────────────────────────
function ProductsTab({
  catalog,
  refresh,
  notify,
}: {
  catalog: CatalogPayload;
  refresh: () => Promise<void>;
  notify: (m: string) => void;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const list = useMemo(
    () =>
      catalog.products.filter(
        (p) =>
          (cat === "all" || p.categoryId === cat) &&
          (q.trim() === "" || (p.name + " " + p.code).toLowerCase().includes(q.trim().toLowerCase()))
      ),
    [catalog.products, cat, q]
  );

  return (
    <div>
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bronze/70" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Kërko produkt…"
          className="w-full rounded-full border border-line bg-ink-3/60 py-2.5 pl-10 pr-4 text-[13.5px] text-ivory placeholder:text-ivory-2/40"
        />
      </div>
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
        <FilterChip active={cat === "all"} onClick={() => setCat("all")} label={`Të gjitha (${catalog.products.length})`} />
        {catalog.categories.map((c) => (
          <FilterChip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)} label={c.name} />
        ))}
      </div>

      <p className="mt-4 mb-2 text-[11px] tracking-[0.2em] uppercase text-ivory-2/55">
        {list.length} produkte — prek për të redaktuar (foto, çmim, emër…)
      </p>

      <div className="flex flex-col gap-2.5">
        {list.slice(0, 60).map((p) => (
          <ProductRow
            key={p.id}
            p={p}
            categories={catalog.categories}
            expanded={expanded === p.id}
            onToggle={() => setExpanded(expanded === p.id ? null : p.id)}
            refresh={refresh}
            notify={notify}
          />
        ))}
        {list.length > 60 && (
          <p className="py-3 text-center text-[12px] text-ivory-2/55">
            + {list.length - 60} të tjerë — ngushtoni kërkimin për t'i parë.
          </p>
        )}
        {list.length === 0 && (
          <p className="text-center text-ivory-2/60 text-sm py-10">Asnjë produkt nuk u gjet.</p>
        )}
      </div>
    </div>
  );
}

function ProductRow({
  p,
  categories,
  expanded,
  onToggle,
  refresh,
  notify,
}: {
  p: ProductDto;
  categories: CatalogPayload["categories"];
  expanded: boolean;
  onToggle: () => void;
  refresh: () => Promise<void>;
  notify: (m: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({
    name: p.name,
    code: p.code,
    price: String(p.price),
    dims: p.dims,
    mat: p.mat,
    img: p.img,
    categoryId: p.categoryId,
  });
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => {
    setDraft({
      name: p.name,
      code: p.code,
      price: String(p.price),
      dims: p.dims,
      mat: p.mat,
      img: p.img,
      categoryId: p.categoryId,
    });
  }, [p]);

  const pickPhoto = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    try {
      const dataUrl = await fileToDataURL(f);
      setDraft((d) => ({ ...d, img: dataUrl }));
      notify("Fotoja u përditësua — ruani ndryshimet.");
    } catch {
      notify("Fotoja nuk u lexua.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      await api(`/api/admin/products/${encodeURIComponent(p.id)}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: draft.name,
          code: draft.code,
          price: parsePrice(draft.price, p.price),
          dims: draft.dims,
          mat: draft.mat,
          img: draft.img,
          categoryId: draft.categoryId,
        }),
      });
      await refresh();
      notify("Produkti u ruajt.");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Ruajtja dështoi.");
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    setBusy(true);
    try {
      await api(`/api/admin/products/${encodeURIComponent(p.id)}`, { method: "DELETE" });
      await refresh();
      notify("Produkti u fshi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-ink-2">
      <button onClick={onToggle} className="flex w-full items-center gap-3 px-3.5 py-3 text-left">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.img} alt="" className="h-12 w-12 rounded-xl object-cover border border-line/70" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-ivory">
            {p.name}
            {p.featured && <Star size={11} className="mb-0.5 ml-1.5 inline text-bronze" fill="currentColor" />}
          </p>
          <p className="truncate text-[10.5px] tracking-[0.12em] uppercase text-ivory-2/50">
            {p.code || "pa kod"} · {fmtEUR(p.price)}
          </p>
        </div>
        <ChevronDown size={16} className={`shrink-0 text-bronze/70 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="border-t border-line/70 px-4 py-4">
              {/* foto */}
              <div className="flex items-start gap-4">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={draft.img} alt="" className="h-24 w-24 rounded-xl object-cover border border-bronze/30" />
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={busy}
                    className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#ecd9a8] via-bronze to-bronze-2 text-ink shadow-lg"
                    aria-label="Ndrysho foton"
                  >
                    <Camera size={14} strokeWidth={2.4} />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => void pickPhoto(e.target.files?.[0])}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <FieldLabel>URL e fotos (ose ngarko nga telefoni/kompjuteri)</FieldLabel>
                  <input
                    value={draft.img.startsWith("data:") ? "" : draft.img}
                    onChange={(e) => setDraft({ ...draft, img: e.target.value })}
                    placeholder={draft.img.startsWith("data:") ? "Foto e ngarkuar — zëvendëso me URL…" : "/images/…"}
                    className="mt-1 w-full rounded-xl border border-line bg-ink-3/60 px-3 py-2 text-[12px] text-ivory placeholder:text-ivory-2/35"
                  />
                  <p className="mt-1.5 text-[10.5px] text-ivory-2/50 font-light">
                    Prek ikonën e kamerës për të ngarkuar foto të re — ruhet në databazë.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <FieldLabel>Emri</FieldLabel>
                  <input
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-line bg-ink-3/60 px-3 py-2.5 text-[13px] text-ivory"
                  />
                </div>
                <div>
                  <FieldLabel>Çmimi (€)</FieldLabel>
                  <input
                    value={draft.price}
                    onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                    inputMode="decimal"
                    className="mt-1 w-full rounded-xl border border-line bg-ink-3/60 px-3 py-2.5 text-[13px] text-ivory"
                  />
                </div>
                <div>
                  <FieldLabel>Kodi</FieldLabel>
                  <input
                    value={draft.code}
                    onChange={(e) => setDraft({ ...draft, code: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-line bg-ink-3/60 px-3 py-2.5 text-[13px] text-ivory"
                  />
                </div>
                <div>
                  <FieldLabel>Përmasat</FieldLabel>
                  <input
                    value={draft.dims}
                    onChange={(e) => setDraft({ ...draft, dims: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-line bg-ink-3/60 px-3 py-2.5 text-[13px] text-ivory"
                  />
                </div>
                <div>
                  <FieldLabel>Kategoria</FieldLabel>
                  <select
                    value={draft.categoryId}
                    onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}
                    className="mt-1 w-full appearance-none rounded-xl border border-line bg-ink-3/60 px-3 py-2.5 text-[13px] text-ivory"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <FieldLabel>Materiali</FieldLabel>
                  <input
                    value={draft.mat}
                    onChange={(e) => setDraft({ ...draft, mat: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-line bg-ink-3/60 px-3 py-2.5 text-[13px] text-ivory"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2.5">
                <button
                  onClick={save}
                  disabled={busy}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ecd9a8] via-bronze to-bronze-2 py-3 text-[13px] font-bold text-ink disabled:opacity-60"
                >
                  {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} strokeWidth={2.6} />}
                  Ruaj ndryshimet
                </button>
                {!confirmDel ? (
                  <button
                    onClick={() => setConfirmDel(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-red-400/40 px-4 py-3 text-[13px] font-bold text-red-400"
                  >
                    <Trash2 size={15} /> Fshi
                  </button>
                ) : (
                  <button
                    onClick={del}
                    disabled={busy}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-red-500/90 px-4 py-3 text-[13px] font-bold text-white"
                  >
                    <AlertTriangle size={15} /> Konfirmo fshirjen
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Tab: Kategoritë ──────────────────────────────────────────
function CategoriesTab({
  catalog,
  refresh,
  notify,
}: {
  catalog: CatalogPayload;
  refresh: () => Promise<void>;
  notify: (m: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCover, setNewCover] = useState("");
  const newFileRef = useRef<HTMLInputElement>(null);

  const cats = catalog.categories;
  const orderIds = cats.map((c) => c.id);

  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= orderIds.length) return;
    const next = [...orderIds];
    [next[i], next[j]] = [next[j], next[i]];
    setBusy(true);
    try {
      await api("/api/admin/categories/order", { method: "POST", body: JSON.stringify({ ids: next }) });
      await refresh();
      notify("Renditja u ruajt.");
    } finally {
      setBusy(false);
    }
  };

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    try {
      await api("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify({ name: newName.trim(), cover: newCover }),
      });
      setNewName("");
      setNewCover("");
      await refresh();
      notify("Kategoria e re u shtua.");
    } catch (e2) {
      notify(e2 instanceof Error ? e2.message : "Dështoi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="rounded-2xl border border-bronze/30 bg-gradient-to-br from-bronze/10 to-transparent p-5">
        <p className="flex items-center gap-2 text-[13px] font-bold text-ivory">
          <ImageIcon size={15} className="text-bronze" />
          Fotot e kategorive — saktësisht si fotot e produkteve
        </p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ivory-2/75 font-light">
          Çdo kategori ka foton e saj të kopertinës. Ngarkoni foto re nga telefoni,
          ndryshoni emrin, rirenditni ose fshini kategori — gjithçka publikohet menjëherë.
          <strong className="text-ivory font-semibold"> Kujdes:</strong> fshirja e një kategorie fshin edhe produktet e saj.
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-2.5">
        {cats.map((c, i) => (
          <CategoryRow
            key={c.id}
            c={c}
            index={i}
            total={cats.length}
            busy={busy}
            setBusy={setBusy}
            move={move}
            refresh={refresh}
            notify={notify}
          />
        ))}
      </div>

      {/* shto kategori të re */}
      <form onSubmit={addCategory} className="mt-7 rounded-2xl border border-dashed border-bronze/40 bg-ink-2/60 p-5">
        <p className="flex items-center gap-2 text-[13px] font-bold text-ivory">
          <FolderPlus size={15} className="text-bronze" />
          Shto kategori të re
        </p>
        <div className="mt-3 flex flex-col sm:flex-row gap-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Emri i kategorisë, p.sh. “Sahate Bronzi”"
            className="flex-1 rounded-xl border border-line bg-ink-3/60 px-4 py-3 text-[14px] text-ivory placeholder:text-ivory-2/40"
          />
          <input
            value={newCover.startsWith("data:") ? "" : newCover}
            onChange={(e) => setNewCover(e.target.value)}
            placeholder={newCover.startsWith("data:") ? "Foto e ngarkuar ✓" : "URL e fotos (opsionale)"}
            className="flex-1 rounded-xl border border-line bg-ink-3/60 px-4 py-3 text-[13px] text-ivory placeholder:text-ivory-2/40"
          />
          <button
            type="button"
            onClick={() => newFileRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-bronze/40 px-4 py-3 text-[12.5px] font-bold text-bronze hover:bg-bronze/10"
          >
            <Camera size={15} /> Ngarko foto
          </button>
          <input
            ref={newFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                setNewCover(await fileToDataURL(f));
                notify("Fotoja u ngarkua.");
              } catch {
                notify("Fotoja nuk u lexua.");
              } finally {
                if (newFileRef.current) newFileRef.current.value = "";
              }
            }}
          />
        </div>
        <button
          type="submit"
          disabled={busy || !newName.trim()}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ecd9a8] via-bronze to-bronze-2 px-6 py-3 text-[13px] font-bold text-ink disabled:opacity-60"
        >
          <Plus size={15} strokeWidth={2.6} />
          Shto kategorinë
        </button>
      </form>
    </div>
  );
}

function CategoryRow({
  c,
  index,
  total,
  busy,
  setBusy,
  move,
  refresh,
  notify,
}: {
  c: CatalogPayload["categories"][number];
  index: number;
  total: number;
  busy: boolean;
  setBusy: (b: boolean) => void;
  move: (i: number, dir: -1 | 1) => void;
  refresh: () => Promise<void>;
  notify: (m: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(c.name);
  const [cover, setCover] = useState(c.cover);
  const [urlDraft, setUrlDraft] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => {
    setName(c.name);
    setCover(c.cover);
  }, [c]);

  const dirty = name !== c.name || cover !== c.cover;

  const save = async () => {
    setBusy(true);
    try {
      await api(`/api/admin/categories/${encodeURIComponent(c.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ name, cover }),
      });
      await refresh();
      notify("Kategoria u ruajt.");
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    setBusy(true);
    try {
      await api(`/api/admin/categories/${encodeURIComponent(c.id)}`, { method: "DELETE" });
      await refresh();
      notify(`Kategoria “${c.name}” u fshi.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-ink-2 p-3.5">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt="" className="h-16 w-16 rounded-xl object-cover border border-bronze/30" />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#ecd9a8] via-bronze to-bronze-2 text-ink shadow-lg"
            aria-label="Ndrysho foton e kategorisë"
          >
            <Camera size={12} strokeWidth={2.4} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setBusy(true);
              try {
                setCover(await fileToDataURL(f));
                notify("Fotoja u përditësua — ruani ndryshimet.");
              } finally {
                setBusy(false);
                if (fileRef.current) fileRef.current.value = "";
              }
            }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 font-display text-[18px] font-semibold text-ivory hover:border-line focus:border-bronze/60"
          />
          <p className="px-2 text-[10.5px] tracking-[0.14em] uppercase text-ivory-2/50">
            {c.count} produkte · id: {c.id}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <IconBtn onClick={() => move(index, -1)} disabled={busy || index === 0} label="Lëviz lart">
            <ChevronUp size={15} />
          </IconBtn>
          <IconBtn onClick={() => move(index, 1)} disabled={busy || index === total - 1} label="Lëviz poshtë">
            <ChevronDown size={15} />
          </IconBtn>
          <IconBtn onClick={save} disabled={busy || !dirty} label="Ruaj" accent={dirty}>
            <Check size={15} />
          </IconBtn>
          <IconBtn onClick={() => setConfirmDel(true)} disabled={busy} label="Fshi" danger>
            <Trash2 size={14} />
          </IconBtn>
        </div>
      </div>

      {/* URL për foton */}
      <div className="mt-2.5 flex items-center gap-2 pl-[76px]">
        <ImageIcon size={12} className="shrink-0 text-bronze/50" />
        <input
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && urlDraft.trim()) {
              setCover(urlDraft.trim());
              setUrlDraft("");
            }
          }}
          placeholder="Ngjit URL fotoje këtu dhe shtyp Enter…"
          className="w-full rounded-lg border border-line/70 bg-ink-3/50 px-2.5 py-1.5 text-[11.5px] text-ivory placeholder:text-ivory-2/35"
        />
      </div>

      {/* konfirmimi i fshirjes */}
      <AnimatePresence>
        {confirmDel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3">
              <p className="text-[12px] text-red-300">
                <AlertTriangle size={13} className="mb-0.5 mr-1.5 inline" />
                {c.count > 0
                  ? `Do të fshihen edhe ${c.count} produktet e kësaj kategorie!`
                  : "Kategoria është bosh — mund të fshihet pa problem."}
              </p>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setConfirmDel(false)}
                  className="rounded-full border border-line px-3.5 py-1.5 text-[11px] font-bold text-ivory-2"
                >
                  Anulo
                </button>
                <button
                  onClick={del}
                  disabled={busy}
                  className="rounded-full bg-red-500 px-3.5 py-1.5 text-[11px] font-bold text-white"
                >
                  Po, fshije
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Tab: Shto produkt ────────────────────────────────────────
function AddProductTab({
  catalog,
  refresh,
  notify,
  onAdded,
}: {
  catalog: CatalogPayload;
  refresh: () => Promise<void>;
  notify: (m: string) => void;
  onAdded: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    categoryId: catalog.categories[0]?.id ?? "",
    price: "",
    code: "",
    dims: "",
    mat: "",
    img: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.categoryId) return;
    setBusy(true);
    try {
      const catCover = catalog.categories.find((c) => c.id === form.categoryId)?.cover ?? "";
      await api("/api/admin/products", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          name: form.name.trim(),
          price: parsePrice(form.price, 0),
          img: form.img || catCover,
        }),
      });
      await refresh();
      notify("Produkti i ri u shtua në katalog.");
      setForm({ ...form, name: "", price: "", code: "", dims: "", mat: "", img: "" });
      onAdded();
    } catch (e2) {
      notify(e2 instanceof Error ? e2.message : "Dështoi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-lg rounded-2xl border border-line bg-ink-2 p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          {form.img ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={form.img} alt="" className="h-24 w-24 rounded-xl object-cover border border-bronze/30" />
          ) : (
            <span className="flex h-24 w-24 items-center justify-center rounded-xl border border-dashed border-line text-ivory-2/40">
              <ImageIcon size={22} strokeWidth={1.5} />
            </span>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#ecd9a8] via-bronze to-bronze-2 text-ink shadow-lg"
            aria-label="Ngarko foton"
          >
            <Camera size={14} strokeWidth={2.4} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                setForm((s) => ({ ...s, img: "" }));
                const dataUrl = await fileToDataURL(f);
                setForm((s) => ({ ...s, img: dataUrl }));
                notify("Fotoja u ngarkua.");
              } catch {
                notify("Fotoja nuk u lexua.");
              } finally {
                if (fileRef.current) fileRef.current.value = "";
              }
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <FieldLabel>Fotoja e produktit</FieldLabel>
          <input
            value={form.img.startsWith("data:") ? "" : form.img}
            onChange={(e) => setForm({ ...form, img: e.target.value })}
            placeholder={form.img.startsWith("data:") ? "Foto e ngarkuar ✓" : "URL e fotos…"}
            className="mt-1 w-full rounded-xl border border-line bg-ink-3/60 px-3 py-2.5 text-[12.5px] text-ivory placeholder:text-ivory-2/35"
          />
          <p className="mt-1.5 text-[10.5px] text-ivory-2/50 font-light">
            Nëse lihet bosh, përdoret fotoja e kategorisë.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <FieldLabel>Emri i produktit *</FieldLabel>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="p.sh. Kryq modern i artë"
            className="mt-1 w-full rounded-xl border border-line bg-ink-3/60 px-3 py-2.5 text-[13.5px] text-ivory placeholder:text-ivory-2/35"
          />
        </div>
        <div>
          <FieldLabel>Kategoria *</FieldLabel>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="mt-1 w-full appearance-none rounded-xl border border-line bg-ink-3/60 px-3 py-2.5 text-[13px] text-ivory"
          >
            {catalog.categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel>Çmimi (€)</FieldLabel>
          <input
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            inputMode="decimal"
            placeholder="p.sh. 89.90"
            className="mt-1 w-full rounded-xl border border-line bg-ink-3/60 px-3 py-2.5 text-[13px] text-ivory placeholder:text-ivory-2/35"
          />
        </div>
        <div>
          <FieldLabel>Kodi</FieldLabel>
          <input
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="COD. 00 000/00"
            className="mt-1 w-full rounded-xl border border-line bg-ink-3/60 px-3 py-2.5 text-[13px] text-ivory placeholder:text-ivory-2/35"
          />
        </div>
        <div>
          <FieldLabel>Përmasat</FieldLabel>
          <input
            value={form.dims}
            onChange={(e) => setForm({ ...form, dims: e.target.value })}
            placeholder="Lartësia 30 cm"
            className="mt-1 w-full rounded-xl border border-line bg-ink-3/60 px-3 py-2.5 text-[13px] text-ivory placeholder:text-ivory-2/35"
          />
        </div>
        <div className="col-span-2">
          <FieldLabel>Materiali</FieldLabel>
          <input
            value={form.mat}
            onChange={(e) => setForm({ ...form, mat: e.target.value })}
            placeholder="Bronz 87 — patinë artistike"
            className="mt-1 w-full rounded-xl border border-line bg-ink-3/60 px-3 py-2.5 text-[13px] text-ivory placeholder:text-ivory-2/35"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={busy || !form.name.trim()}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ecd9a8] via-bronze to-bronze-2 py-3.5 text-[14px] font-bold text-ink disabled:opacity-60"
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} strokeWidth={2.6} />}
        Shto produktin në katalog
      </button>
    </form>
  );
}

// ── Komponentë të vegjël ─────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[10px] font-semibold tracking-[0.18em] uppercase text-ivory-2/60">
      {children}
    </span>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-[12px] font-semibold transition-all ${
        active ? "bg-bronze text-ink" : "border border-line text-ivory-2 hover:border-bronze/40"
      }`}
    >
      {label}
    </button>
  );
}

function IconBtn({
  children,
  onClick,
  disabled,
  label,
  danger,
  accent,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
  danger?: boolean;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all disabled:opacity-35 ${
        danger
          ? "border-red-400/40 text-red-400 hover:bg-red-500/15"
          : accent
            ? "border-bronze bg-gradient-to-br from-[#ecd9a8] via-bronze to-bronze-2 text-ink"
            : "border-line text-ivory-2 hover:border-bronze/50 hover:text-bronze"
      }`}
    >
      {children}
    </button>
  );
}
