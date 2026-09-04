import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Download, ImagePlus, Lock, LogOut, Save, Search, Upload, X } from "lucide-react";
import { Product } from "../data/catalogue";
import { ADMIN_PASSWORD, ADMIN_USERNAME } from "../lib/adminConfig";
import { ProductOverride, productKey, upsertOverride, writeStoredOverrides } from "../lib/catalogueOverrides";

const fmtEUR = (n: number) =>
  "€ " + n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AdminPanel({
  baseProducts,
  displayProducts,
  overrides,
  onOverridesChange,
  onClose,
}: {
  baseProducts: Product[];
  displayProducts: Product[];
  overrides: ProductOverride[];
  onOverridesChange: (items: ProductOverride[]) => void;
  onClose: () => void;
}) {
  const [loggedIn, setLoggedIn] = useState(() => sessionStorage.getItem("kriel-admin") === "yes");
  const [login, setLogin] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [query, setQuery] = useState("");

  const products = useMemo(() => {
    return baseProducts.map((base, index) => ({ base, display: displayProducts[index] ?? base }));
  }, [baseProducts, displayProducts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(({ display }) =>
      `${display.name} ${display.code} ${display.cat}`.toLowerCase().includes(q)
    );
  }, [products, query]);

  const saveOverrides = (next: ProductOverride[]) => {
    onOverridesChange(next);
    writeStoredOverrides(next);
  };

  const authenticate = (event: FormEvent) => {
    event.preventDefault();
    if (login.username === ADMIN_USERNAME && login.password === ADMIN_PASSWORD) {
      sessionStorage.setItem("kriel-admin", "yes");
      setLoggedIn(true);
      setLoginError("");
      return;
    }
    setLoginError("Kredencialet nuk janë të sakta.");
  };

  const logout = () => {
    sessionStorage.removeItem("kriel-admin");
    setLoggedIn(false);
  };

  const exportFile = () => {
    const blob = new Blob([JSON.stringify(overrides, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "admin-overrides.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error("File must contain an array.");
    saveOverrides(parsed);
    event.target.value = "";
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-ink/96 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-5 py-5 sm:px-6 sm:py-8">
        <div className="flex items-center justify-between gap-4 border-b border-line pb-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-bronze">Admin privat</p>
            <h1 className="mt-1 font-display text-3xl font-semibold text-ivory sm:text-4xl">Kriel Panel</h1>
          </div>
          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-ivory-2 hover:border-bronze/50 hover:text-bronze"
            aria-label="Mbyll panelin"
          >
            <X size={18} />
          </button>
        </div>

        {!loggedIn ? (
          <motion.form
            onSubmit={authenticate}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mt-16 max-w-md rounded-[26px] border border-line bg-ink-2 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)] sm:p-8"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-bronze/30 bg-bronze/10 text-bronze">
              <Lock size={20} />
            </span>
            <h2 className="mt-5 font-display text-3xl font-semibold text-ivory">Hyrje vetëm për Kriel</h2>
            <p className="mt-2 text-sm leading-relaxed text-ivory-2/70">
              Ky panel nuk shfaqet në menu. Përdoret vetëm për ndryshimin e çmimeve dhe fotove në katalog.
            </p>
            <label className="mt-6 block">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.22em] text-ivory-2/60">Përdoruesi</span>
              <input
                value={login.username}
                onChange={(e) => setLogin({ ...login, username: e.target.value })}
                className="w-full rounded-xl border border-line bg-ink-3 px-4 py-3 text-ivory"
                autoComplete="username"
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.22em] text-ivory-2/60">Fjalëkalimi</span>
              <input
                type="password"
                value={login.password}
                onChange={(e) => setLogin({ ...login, password: e.target.value })}
                className="w-full rounded-xl border border-line bg-ink-3 px-4 py-3 text-ivory"
                autoComplete="current-password"
              />
            </label>
            {loginError && <p className="mt-3 text-sm font-semibold text-red-300">{loginError}</p>}
            <button className="mt-6 w-full rounded-full bg-gradient-to-r from-[#ecd9a8] via-bronze to-bronze-2 py-3.5 text-sm font-bold text-ink">
              Hyr në panel
            </button>
          </motion.form>
        ) : (
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
            <div className="grid gap-4 rounded-[24px] border border-line bg-ink-2 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
              <div>
                <h2 className="font-display text-2xl font-semibold text-ivory">Ndryshime lokale: {overrides.length}</h2>
                <p className="mt-1 text-sm leading-relaxed text-ivory-2/70">
                  Ndryshimet ruhen menjëherë në këtë browser. Për t'i bërë permanente në website,
                  shkarkoni file-in <span className="font-semibold text-bronze">admin-overrides.json</span> dhe vendoseni në folderin <span className="font-semibold text-bronze">public/</span>.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line px-4 py-2.5 text-xs font-bold text-ivory-2 hover:border-bronze/50 hover:text-bronze">
                  <Upload size={14} /> Importo JSON
                  <input type="file" accept="application/json" onChange={importFile} className="hidden" />
                </label>
                <button onClick={exportFile} className="inline-flex items-center gap-2 rounded-full border border-bronze/45 px-4 py-2.5 text-xs font-bold text-bronze hover:bg-bronze/10">
                  <Download size={14} /> Shkarko ndryshimet
                </button>
                <button onClick={logout} className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-xs font-bold text-ivory-2 hover:border-bronze/50 hover:text-bronze">
                  <LogOut size={14} /> Dil
                </button>
              </div>
            </div>

            <div className="sticky top-0 z-10 -mx-5 mt-6 bg-ink/92 px-5 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border sm:border-line">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bronze/70" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Kërko produkt sipas emrit, kodit ose kategorisë..."
                  className="w-full rounded-full border border-line bg-ink-3/70 py-3 pl-10 pr-4 text-sm text-ivory placeholder:text-ivory-2/40"
                />
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              {filtered.map(({ base, display }) => (
                <ProductEditor
                  key={productKey(base)}
                  base={base}
                  display={display}
                  overrides={overrides}
                  onSave={saveOverrides}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function ProductEditor({
  base,
  display,
  overrides,
  onSave,
}: {
  base: Product;
  display: Product;
  overrides: ProductOverride[];
  onSave: (items: ProductOverride[]) => void;
}) {
  const [name, setName] = useState(display.name);
  const [code, setCode] = useState(display.code);
  const [price, setPrice] = useState(String(display.price));
  const [img, setImg] = useState(display.img);
  const key = productKey(base);

  const save = () => {
    const nextPrice = Number(price.replace(",", "."));
    const next = upsertOverride(overrides, {
      key,
      name,
      code,
      price: Number.isFinite(nextPrice) ? nextPrice : display.price,
      img,
    });
    onSave(next);
  };

  const uploadImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImg(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid gap-4 rounded-[22px] border border-line bg-ink-2 p-4 sm:grid-cols-[112px_1fr_auto] sm:items-center">
      <div className="relative h-32 overflow-hidden rounded-2xl bg-[#cfc8bb] sm:h-28">
        <img src={img || display.img} alt={display.name} className="h-full w-full object-contain" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-bronze/75">
            {display.code || "Pa kod"} · {display.cat} · {fmtEUR(display.price)}
          </p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full rounded-xl border border-line bg-ink-3/70 px-3 py-2.5 text-sm font-semibold text-ivory"
            placeholder="Emri i produktit"
          />
        </div>
        <label>
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-ivory-2/55">Kodi</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-xl border border-line bg-ink-3/70 px-3 py-2.5 text-sm text-ivory"
            placeholder="p.sh. COD. 35 264/61"
          />
        </label>
        <label>
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-ivory-2/55">Çmimi (€)</span>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            className="w-full rounded-xl border border-line bg-ink-3/70 px-3 py-2.5 text-sm text-ivory"
          />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-ivory-2/55">Foto / URL</span>
          <input
            value={img}
            onChange={(e) => setImg(e.target.value)}
            className="w-full rounded-xl border border-line bg-ink-3/70 px-3 py-2.5 text-sm text-ivory"
            placeholder="/products/custom/foto.jpg"
          />
        </label>
        <label className="sm:col-span-2 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-bronze/35 px-3 py-2.5 text-xs font-bold text-bronze hover:bg-bronze/10">
          <ImagePlus size={15} /> Ngarko foto nga kompjuteri
          <input type="file" accept="image/*" onChange={uploadImage} className="hidden" />
        </label>
      </div>
      <button
        onClick={save}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ecd9a8] via-bronze to-bronze-2 px-5 py-3 text-sm font-bold text-ink sm:self-end"
      >
        <Save size={15} /> Ruaj
      </button>
    </div>
  );
}