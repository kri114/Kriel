import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Lock,
  Eye,
  EyeOff,
  Search,
  Camera,
  Plus,
  Download,
  Upload,
  RotateCcw,
  LogOut,
  Trash2,
  Undo2,
  Check,
  FileJson,
  ChevronDown,
} from "lucide-react";
import { CATEGORIES, Product } from "../data/catalogue";
import { useCatalogAdmin, fileToDataURL, baseImageOf } from "../admin/CatalogAdmin";
import { fileToCloudPhoto } from "../admin/cloud";

function timeAgo(ts: number | null): string {
  if (!ts) return "kurrë";
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 20) return "sapo";
  if (s < 60) return `para ${s} sek`;
  const m = Math.floor(s / 60);
  if (m < 60) return `para ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `para ${h} orë`;
  return `para ${Math.floor(h / 24)} ditë`;
}

const fmtEUR = (n: number) =>
  "€ " + Number(n || 0).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function parsePrice(v: string, fallback: number): number {
  const n = parseFloat(v.replace(",", ".").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : fallback;
}

export default function AdminPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const admin = useCatalogAdmin();
  const [tab, setTab] = useState<"produkte" | "shto" | "skedar">("produkte");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] bg-ink flex flex-col"
        >
          {/* header */}
          <div className="flex items-center justify-between px-5 h-16 border-b border-line shrink-0 bg-ink-2/80">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-bronze to-bronze-2 flex items-center justify-center text-ink">
                <Lock size={16} strokeWidth={2.4} />
              </span>
              <div className="leading-tight">
                <p className="font-display text-[19px] font-semibold text-ivory">Paneli Admin</p>
                <p className="text-[10px] tracking-[0.22em] uppercase text-bronze/80">
                  {admin.isAuthed ? ` ${admin.overridesCount} ndryshime · ${admin.customCount} të reja` : "Qasje e kufizuar"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full border border-line inline-flex items-center justify-center text-ivory-2 hover:text-bronze"
              aria-label="Mbyll panelin"
            >
              <X size={18} />
            </button>
          </div>

          {!admin.isAuthed ? (
            <LoginView onDone={() => setTab("produkte")} />
          ) : (
            <>
              {/* tabs */}
              <div className="flex gap-2 px-5 pt-4 shrink-0">
                {(
                  [
                    ["produkte", "Produktet"],
                    ["shto", "Shto"],
                    ["skedar", "Skedari"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`flex-1 rounded-full py-2.5 text-[13px] font-bold tracking-wide transition-all ${
                      tab === id
                        ? "bg-gradient-to-r from-[#ecd9a8] via-bronze to-bronze-2 text-ink"
                        : "border border-line text-ivory-2"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 pb-10">
                {tab === "produkte" && <ProductsTab />}
                {tab === "shto" && <AddTab onAdded={() => setTab("produkte")} />}
                {tab === "skedar" && <FileTab />}
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Login ────────────────────────────────────────────────────
function LoginView({ onDone }: { onDone: () => void }) {
  const { login } = useCatalogAdmin();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(u, p)) {
      setErr("");
      onDone();
    } else {
      setErr("E ke fut gabim o pall.");
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 pb-16">
      <span className="w-16 h-16 rounded-2xl bg-gradient-to-br from-bronze/30 to-transparent border border-bronze/40 flex items-center justify-center text-bronze">
        <Lock size={26} strokeWidth={1.8} />
      </span>
      <h3 className="mt-5 font-display text-[28px] font-semibold text-ivory text-center">
        Vetëm për administratorin
      </h3>
      <p className="mt-2 text-[13px] text-ivory-2/70 text-center max-w-xs font-light">
        Ky panel është i fshehtë — ekziston vetëm një llogari. Identifikohuni për të
        ndryshuar çmimet dhe fotot.
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
          className="mt-1 rounded-full bg-gradient-to-r from-[#ecd9a8] via-bronze to-bronze-2 py-3.5 text-[14.5px] font-bold text-ink"
        >
          Hyr në panel
        </button>
        <p className="text-center text-[11px] text-ivory-2/45 font-light leading-relaxed">
          Kredencialet ndryshohen te skedari
          <br />
          <code className="text-bronze/80">src/admin/credentials.ts</code>
        </p>
      </form>
    </div>
  );
}

// ── Products tab ─────────────────────────────────────────────
function ProductsTab() {
  const { products } = useCatalogAdmin();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const list = useMemo(() => {
    return products.filter(
      (p) =>
        (cat === "all" || p.cat === cat) &&
        (q.trim() === "" ||
          (p.name + " " + p.code).toLowerCase().includes(q.trim().toLowerCase()))
    );
  }, [products, cat, q]);

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
        <button
          onClick={() => setCat("all")}
          className={`shrink-0 rounded-full px-4 py-2 text-[12px] font-semibold ${cat === "all" ? "bg-bronze text-ink" : "border border-line text-ivory-2"}`}
        >
          Të gjitha ({products.length})
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-[12px] font-semibold ${cat === c.id ? "bg-bronze text-ink" : "border border-line text-ivory-2"}`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <p className="mt-4 mb-2 text-[11px] tracking-[0.2em] uppercase text-ivory-2/55">
        {list.length} produkte — prek për të redaktuar
      </p>

      <div className="flex flex-col gap-2.5">
        {list.map((p) => (
          <ProductRow key={p.id} p={p} expanded={expanded === p.id} onToggle={() => setExpanded(expanded === p.id ? null : p.id)} />
        ))}
        {list.length === 0 && (
          <p className="text-center text-ivory-2/60 text-sm py-10">Asnjë produkt nuk u gjet.</p>
        )}
      </div>
    </div>
  );
}

function ProductRow({ p, expanded, onToggle }: { p: Product; expanded: boolean; onToggle: () => void }) {
  const { updateProduct, deleteProduct, restoreProduct, isDeleted, stagePhoto } = useCatalogAdmin();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [photoNote, setPhotoNote] = useState("");
  const deleted = isDeleted(p.id);
  const baseImg = baseImageOf(p.id);
  const hasCustomImg = baseImg !== "" && p.img !== baseImg;

  const pickPhoto = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    setPhotoNote("");
    try {
      const [full, cloud] = await Promise.all([fileToDataURL(f), fileToCloudPhoto(f)]);
      updateProduct(p.id, { img: full });
      if (cloud) {
        stagePhoto(p.id, cloud);
      } else {
        setPhotoNote("Foto u ruajt këtu; për ta dërguar kudo përdorni Shkarko skedarin.");
      }
    } catch {
      alert("Fotoja nuk u lexua. Provoni një JPG/PNG tjetër.");
    }
    setBusy(false);
  };

  return (
    <div className={`rounded-2xl border overflow-hidden ${deleted ? "border-red-500/40 opacity-70" : "border-line bg-ink-2"}`}>
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-3 text-left">
        <img src={p.img} alt="" className="w-14 h-14 rounded-xl object-cover bg-[#cfc8bb] shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="block text-[14px] font-semibold text-ivory truncate">{p.name}</span>
          <span className="block text-[11px] text-ivory-2/60 truncate">
            {CATEGORIES.find((c) => c.id === p.cat)?.name || p.cat} · {fmtEUR(p.price)}
            {hasCustomImg && <span className="text-bronze"> · foto e re</span>}
            {deleted && <span className="text-red-400"> · e fshehur</span>}
          </span>
        </span>
        <ChevronDown size={16} className={`text-bronze shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="px-3 pb-4 pt-1 flex flex-col gap-3 border-t border-line/60">
          {/* price — big & easy */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => updateProduct(p.id, { price: Math.max(0, Math.round((p.price - 5) * 100) / 100) })}
              className="w-11 h-11 rounded-xl border border-line text-xl text-bronze font-bold"
              aria-label="Zbrit çmimin"
            >
              −
            </button>
            <label className="flex-1">
              <span className="mb-1 block text-[10px] tracking-[0.2em] uppercase text-ivory-2/60">Çmimi (€)</span>
              <input
                value={String(p.price)}
                inputMode="decimal"
                onChange={(e) => updateProduct(p.id, { price: parsePrice(e.target.value, p.price) })}
                className="w-full rounded-xl border border-bronze/40 bg-ink-3/70 px-4 py-3 text-center text-[19px] font-bold text-bronze"
              />
            </label>
            <button
              onClick={() => updateProduct(p.id, { price: Math.round((p.price + 5) * 100) / 100 })}
              className="w-11 h-11 rounded-xl border border-line text-xl text-bronze font-bold"
              aria-label="Rrit çmimin"
            >
              +
            </button>
          </div>

          {/* photo */}
          <div className="flex items-center gap-3 rounded-xl border border-line/70 bg-ink-3/40 p-3">
            <img src={p.img} alt="" className="w-20 h-20 rounded-lg object-cover bg-[#cfc8bb]" />
            <div className="flex-1 flex flex-col gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-bronze/15 border border-bronze/45 py-2.5 text-[12.5px] font-bold text-bronze"
              >
                <Camera size={14} strokeWidth={2.2} />
                {busy ? "Po ngarkohet…" : hasCustomImg ? "Ndrysho foton" : "Shto foto të re"}
              </button>
              {hasCustomImg && (
                <button
                  onClick={() => {
                    updateProduct(p.id, { img: baseImg });
                    stagePhoto(p.id, null);
                  }}
                  className="text-[11.5px] text-ivory-2/60 underline underline-offset-4"
                >
                  Kthe foton origjinale
                </button>
              )}
              {photoNote && (
                <p className="text-[11px] leading-snug text-amber-300/80">{photoNote}</p>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  pickPhoto(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          {/* other fields */}
          <label className="block">
            <span className="mb-1 block text-[10px] tracking-[0.2em] uppercase text-ivory-2/60">Emri</span>
            <input
              value={p.name}
              onChange={(e) => updateProduct(p.id, { name: e.target.value })}
              className="w-full rounded-xl border border-line bg-ink-3/60 px-3.5 py-2.5 text-[13.5px] text-ivory"
            />
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <label className="block">
              <span className="mb-1 block text-[10px] tracking-[0.2em] uppercase text-ivory-2/60">Kodi — shfaqet nën emër</span>
              <input
                value={p.code}
                onChange={(e) => updateProduct(p.id, { code: e.target.value })}
                placeholder="p.sh. COD. 35 264/61"
                className="w-full rounded-xl border border-line bg-ink-3/60 px-3.5 py-2.5 text-[13.5px] text-ivory placeholder:text-ivory-2/35"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] tracking-[0.2em] uppercase text-ivory-2/60">Përmasat</span>
              <input
                value={p.dims}
                onChange={(e) => updateProduct(p.id, { dims: e.target.value })}
                className="w-full rounded-xl border border-line bg-ink-3/60 px-3.5 py-2.5 text-[13.5px] text-ivory"
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-[10px] tracking-[0.2em] uppercase text-ivory-2/60">Materiali</span>
            <input
              value={p.mat}
              onChange={(e) => updateProduct(p.id, { mat: e.target.value })}
              className="w-full rounded-xl border border-line bg-ink-3/60 px-3.5 py-2.5 text-[13.5px] text-ivory"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] tracking-[0.2em] uppercase text-ivory-2/60">Kategoria</span>
            <select
              value={p.cat}
              onChange={(e) => updateProduct(p.id, { cat: e.target.value })}
              className="w-full rounded-xl border border-line bg-ink-3/60 px-3.5 py-2.5 text-[13.5px] text-ivory"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          {deleted ? (
            <button
              onClick={() => restoreProduct(p.id)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-500/50 py-2.5 text-[12.5px] font-bold text-emerald-400"
            >
              <Undo2 size={14} /> Rikthe produktin
            </button>
          ) : (
            <button
              onClick={() => {
                if (confirm(`Ta fshihni "${p.name}" nga katalogu?`)) deleteProduct(p.id);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-red-500/40 py-2.5 text-[12.5px] font-bold text-red-400/90"
            >
              <Trash2 size={14} /> Fshih nga katalogu
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Add tab ──────────────────────────────────────────────────
function AddTab({ onAdded }: { onAdded: () => void }) {
  const { addProduct, stagePhoto } = useCatalogAdmin();
  const [f, setF] = useState({ name: "", cat: "statue", code: "", price: "", dims: "", mat: "Bronz 87 — patinë artistike" });
  const [img, setImg] = useState("");
  const [cloudImg, setCloudImg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const save = () => {
    if (!f.name.trim()) {
      alert("Shkruani emrin e produktit.");
      return;
    }
    const np = addProduct({
      name: f.name.trim(),
      cat: f.cat,
      code: f.code.trim(),
      price: parsePrice(f.price || "0", 0),
      dims: f.dims.trim(),
      mat: f.mat.trim(),
      img: img || "/products/statue/statue-02-000.jpg",
    });
    if (cloudImg) stagePhoto(np.id, cloudImg);
    setF({ name: "", cat: "statue", code: "", price: "", dims: "", mat: "Bronz 87 — patinë artistike" });
    setImg("");
    setCloudImg(null);
    setDone("Produkti u shtua në katalog.");
    setTimeout(() => {
      setDone("");
      onAdded();
    }, 900);
  };

  return (
    <div className="rounded-2xl border border-line bg-ink-2 p-5 flex flex-col gap-3.5">
      <h3 className="font-display text-[24px] font-semibold text-ivory">Produkt i ri</h3>
      <button
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-3 rounded-xl border border-dashed border-bronze/45 bg-ink-3/40 p-3 text-left"
      >
        {img ? (
          <img src={img} alt="" className="w-20 h-20 rounded-lg object-cover" />
        ) : (
          <span className="w-20 h-20 rounded-lg bg-ink-3 flex items-center justify-center text-bronze">
            <Camera size={22} />
          </span>
        )}
        <span className="text-[13px] text-ivory-2/80 font-light">
          {busy ? "Po ngarkohet…" : img ? "Prek për të ndërruar foton" : "Prek për të ngarkuar foton e produktit"}
        </span>
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setBusy(true);
          try {
            const [full, cloud] = await Promise.all([fileToDataURL(file), fileToCloudPhoto(file)]);
            setImg(full);
            setCloudImg(cloud);
          } catch {
            alert("Fotoja nuk u lexua.");
          }
          setBusy(false);
        }}
      />
      <label className="block">
        <span className="mb-1 block text-[10px] tracking-[0.2em] uppercase text-ivory-2/60">Emri *</span>
        <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })}
          placeholder="p.sh. Engjëll në lutje"
          className="w-full rounded-xl border border-line bg-ink-3/60 px-3.5 py-3 text-[14px] text-ivory placeholder:text-ivory-2/35" />
      </label>
      <div className="grid grid-cols-2 gap-2.5">
        <label className="block">
          <span className="mb-1 block text-[10px] tracking-[0.2em] uppercase text-ivory-2/60">Kategoria</span>
          <select value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })}
            className="w-full rounded-xl border border-line bg-ink-3/60 px-3 py-3 text-[13.5px] text-ivory">
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] tracking-[0.2em] uppercase text-ivory-2/60">Çmimi (€)</span>
          <input value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })}
            inputMode="decimal" placeholder="p.sh. 129.90"
            className="w-full rounded-xl border border-bronze/40 bg-ink-3/60 px-3.5 py-3 text-[14px] font-bold text-bronze placeholder:text-ivory-2/35 placeholder:font-normal" />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <label className="block">
          <span className="mb-1 block text-[10px] tracking-[0.2em] uppercase text-ivory-2/60">Kodi — shfaqet nën emër</span>
          <input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })}
            placeholder="p.sh. COD. 35 264/61"
            className="w-full rounded-xl border border-line bg-ink-3/60 px-3.5 py-3 text-[14px] text-ivory placeholder:text-ivory-2/35" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] tracking-[0.2em] uppercase text-ivory-2/60">Përmasat</span>
          <input value={f.dims} onChange={(e) => setF({ ...f, dims: e.target.value })}
            placeholder="Lartësia … cm"
            className="w-full rounded-xl border border-line bg-ink-3/60 px-3.5 py-3 text-[14px] text-ivory placeholder:text-ivory-2/35" />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-[10px] tracking-[0.2em] uppercase text-ivory-2/60">Materiali</span>
        <input value={f.mat} onChange={(e) => setF({ ...f, mat: e.target.value })}
          className="w-full rounded-xl border border-line bg-ink-3/60 px-3.5 py-3 text-[14px] text-ivory" />
      </label>
      <button onClick={save}
        className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ecd9a8] via-bronze to-bronze-2 py-3.5 text-[14.5px] font-bold text-ink">
        <Plus size={16} strokeWidth={2.6} /> Shto produktin
      </button>
      {done && (
        <p className="inline-flex items-center gap-2 text-[13px] text-emerald-400">
          <Check size={15} /> {done}
        </p>
      )}
    </div>
  );
}

// ── File tab ─────────────────────────────────────────────────
const SYNC_LABEL: Record<string, { t: string; c: string; pulse?: boolean }> = {
  loading: { t: "Po lidhet me cloud-in…", c: "bg-ivory-2/50", pulse: true },
  synced: { t: "Sinkronizuar automatikisht", c: "bg-emerald-400" },
  saving: { t: "Po ruhet në cloud…", c: "bg-amber-300", pulse: true },
  error: { t: "Gabim lidhjeje — ruajtur lokalisht", c: "bg-red-400" },
  offline: { t: "Pa internet — ruajtur lokalisht", c: "bg-ivory-2/50" },
};

function FileTab() {
  const {
    exportData, importData, resetAll, logout, overridesCount, customCount,
    cloudStatus, lastSyncAt, cloudError, photosPending, syncNow,
  } = useCatalogAdmin();
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const sync = SYNC_LABEL[cloudStatus];

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-emerald-500/25 bg-ink-2 p-5">
        <h3 className="font-display text-[22px] font-semibold text-ivory flex items-center gap-2">
          <Check size={19} className="text-emerald-400" /> Ruajtje automatike
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-ivory-2/80 font-light">
          Çdo ndryshim çmimi, kodi apo fotoje <b>ruhet vetvetiu në cloud</b> dhe shfaqet
          për të gjithë vizitorët — <b>nuk keni nevojë të prekni asnjë file në GitHub</b>.
        </p>
        <div className="mt-3.5 flex items-center gap-2.5 rounded-xl border border-line/70 bg-ink-3/40 px-3.5 py-3">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${sync.c} ${sync.pulse ? "animate-pulse" : ""}`} />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-ivory">{sync.t}</p>
            <p className="text-[11px] text-ivory-2/55">
              Sinkronizimi i fundit: {timeAgo(lastSyncAt)}
              {photosPending > 0 && ` · ${photosPending} foto në pritje`}
            </p>
          </div>
        </div>
        {cloudError && <p className="mt-2.5 text-[12px] leading-snug text-amber-300/85">{cloudError}</p>}
        <button onClick={syncNow}
          className="mt-3.5 w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ecd9a8] via-bronze to-bronze-2 py-3 text-[13px] font-bold text-ink">
          <RotateCcw size={15} strokeWidth={2.4} /> Sinkronizo tani
        </button>
        <p className="mt-3 text-[11.5px] text-ivory-2/50 font-light">
          Aktualisht: {overridesCount} produkte të ndryshuara · {customCount} produkte të reja.
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-ink-2 p-5">
        <h3 className="font-display text-[20px] font-semibold text-ivory flex items-center gap-2">
          <FileJson size={17} className="text-bronze" /> Kopje sigurie (opsionale)
        </h3>
        <p className="mt-1.5 text-[12.5px] text-ivory-2/65 font-light leading-relaxed">
          Shkarkoni një kopje të ndryshimeve si <code className="text-bronze">overrides.json</code> —
          ruajeni për siguri ose importojeni në një pajisje tjetër.
        </p>
        <div className="mt-3.5 grid grid-cols-2 gap-2.5">
          <button onClick={exportData}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-bronze/45 py-3 text-[13px] font-bold text-bronze">
            <Download size={15} strokeWidth={2.4} /> Shkarko kopjen
          </button>
          <button onClick={() => fileRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-line py-3 text-[13px] font-bold text-ivory-2">
            <Upload size={15} strokeWidth={2.4} /> Importo
          </button>
        </div>
        <input ref={fileRef} type="file" accept="application/json" className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            try {
              setMsg(await importData(file));
            } catch (err) {
              setMsg(String(err));
            }
          }}
        />
        {msg && <p className="mt-3 text-[12.5px] text-emerald-400">{msg}</p>}
      </div>

      <div className="rounded-2xl border border-line bg-ink-2 p-5 flex flex-col gap-2.5">
        <button
          onClick={() => {
            if (confirm("Të fshihen të gjitha ndryshimet e ruajtura në këtë pajisje? (Cloud-i nuk preket.)")) {
              resetAll();
              setMsg("Ndryshimet lokale u fshinë.");
            }
          }}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-red-500/40 py-3 text-[13px] font-bold text-red-400/90"
        >
          <RotateCcw size={15} /> Pastro ndryshimet lokale
        </button>
        <button
          onClick={logout}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-line py-3 text-[13px] font-bold text-ivory-2"
        >
          <LogOut size={15} /> Dil nga paneli
        </button>
      </div>
    </div>
  );
}
