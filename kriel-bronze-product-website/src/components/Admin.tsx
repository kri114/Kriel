import { useMemo, useState, type FormEvent } from "react";
import {
  Check, Download, ImagePlus, KeyRound, Lock, LogOut, Plus, RotateCcw, Search, Sparkles, Upload,
} from "lucide-react";
import { GROUP_ORDER, type Product } from "../data/catalog";
import { useAdmin } from "../store/admin";

export default function Admin() {
  const a = useAdmin();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState(false);
  const [toast, setToast] = useState("");
  const [q, setQ] = useState("");

  const note = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(""), 3200);
  };

  const login = (e: FormEvent) => {
    e.preventDefault();
    if (!a.login(u, p)) {
      setErr(true);
      window.setTimeout(() => setErr(false), 1800);
    }
  };

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return a.products.slice(0, 24);
    return a.products
      .filter((x) => (x.name + " " + x.code).toLowerCase().includes(s))
      .slice(0, 24);
  }, [a.products, q]);

  const toggleFeatured = (id: string) => {
    const cur = a.featuredIds;
    if (cur.includes(id)) {
      a.setFeatured(cur.filter((x) => x !== id));
      note("U hoq nga të përzgjedhurat.");
    } else {
      if (cur.length >= 3) {
        note("Maksimumi 3 produkte të përzgjedhura — hiqni një më parë.");
        return;
      }
      a.setFeatured([...cur, id]);
      note("U shtua te të përzgjedhurat.");
    }
  };

  const addCustom = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") || "").trim();
    if (!name) return;
    const prod: Product = {
      id: "custom-" + Date.now(),
      cat: String(f.get("cat") || "germa"),
      name,
      code: String(f.get("code") || ""),
      price: parseFloat(String(f.get("price") || "0")) || 0,
      dims: String(f.get("dims") || ""),
      mat: String(f.get("mat") || ""),
      img: String(f.get("img") || ""),
    };
    a.addCustom(prod);
    e.currentTarget.reset();
    note(`U shtua produkti "${name}".`);
  };

  if (!a.isAuthed) {
    /* ── Hyrja ── */
    return (
      <section id="kriel-admin" className="border-t border-line py-16">
        <div className="mx-auto max-w-sm px-5">
          <form
            onSubmit={login}
            className="rounded-[22px] border border-line bg-ink-2 p-6 text-center"
          >
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-bronze/30 bg-bronze/10 text-bronze">
              <Lock size={17} />
            </span>
            <h3 className="mt-4 font-display text-[22px] font-semibold text-ivory">Paneli i administratorit</h3>
            <p className="mt-1.5 text-[11.5px] font-light leading-relaxed text-ivory-2/55">
              Ky panel është i fshehtë — ekziston vetëm një llogari. Identifikohuni për të ndryshuar
              çmimet dhe fotot.
            </p>
            <input
              value={u}
              onChange={(e) => setU(e.target.value)}
              placeholder="Përdoruesi"
              autoComplete="username"
              className={`mt-5 w-full rounded-xl border bg-ink-3/60 px-4 py-3 text-[13.5px] text-ivory placeholder:text-ivory-2/35 ${
                err ? "border-red-400/70" : "border-line"
              }`}
            />
            <input
              type="password"
              value={p}
              onChange={(e) => setP(e.target.value)}
              placeholder="Fjalëkalimi"
              autoComplete="current-password"
              className={`mt-3 w-full rounded-xl border bg-ink-3/60 px-4 py-3 text-[13.5px] text-ivory placeholder:text-ivory-2/35 ${
                err ? "border-red-400/70" : "border-line"
              }`}
            />
            <button
              type="submit"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-bronze py-3.5 text-[12px] font-bold uppercase tracking-[0.16em] text-ink transition-shadow hover:shadow-[0_10px_35px_rgba(201,163,92,0.35)]"
            >
              <KeyRound size={14} strokeWidth={2.4} />
              Hyr në panel
            </button>
          </form>
        </div>
      </section>
    );
  }

  /* ── Paneli ── */
  return (
    <section id="kriel-admin" className="border-t border-bronze/25 bg-ink-2/40 py-16">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-bronze/80">
              Zonë private
            </p>
            <h2 className="mt-2 font-display text-[30px] font-semibold text-ivory">
              Paneli i administratorit
            </h2>
            <p className="mt-1 text-[11.5px] text-ivory-2/55">
              {a.overridesCount} ndryshime · {a.customCount} të reja — ruhen lokalisht në këtë pajisje
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => { a.exportJSON(); note("Skedari u shkarkua — ruajeni për siguri."); }}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-ivory-2/80 hover:border-bronze/45 hover:text-bronze"
            >
              <Download size={12} /> Shkarko skedarin
            </button>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-4 py-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-ivory-2/80 hover:border-bronze/45 hover:text-bronze">
              <Upload size={12} /> Importo
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) a.importJSON(f).then(note).catch((er) => note(String(er.message ?? er)));
                  e.target.value = "";
                }}
              />
            </label>
            <button
              onClick={() => {
                if (window.confirm("Të fshihen të gjitha ndryshimet e ruajtura në këtë pajisje?"))
                  { a.resetAll(); note("Ndryshimet lokale u fshinë."); }
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-ivory-2/80 hover:border-red-400/60 hover:text-red-400"
            >
              <RotateCcw size={12} /> Fshi gjithçka
            </button>
            <button
              onClick={a.logout}
              className="inline-flex items-center gap-1.5 rounded-full border border-bronze/40 px-4 py-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-bronze hover:bg-bronze hover:text-ink"
            >
              <LogOut size={12} /> Dil
            </button>
          </div>
        </div>

        {/* ── Zgjidh 3 produktet e përzgjedhura ── */}
        <div className="mt-8 rounded-[22px] border border-bronze/25 bg-ink-2 p-6">
          <div className="flex items-center gap-2.5">
            <Sparkles size={16} className="text-bronze" />
            <h3 className="font-display text-[21px] font-semibold text-ivory">
              Të përzgjedhura ({a.featuredIds.length}/3)
            </h3>
          </div>
          <p className="mt-1.5 text-[11.5px] font-light leading-relaxed text-ivory-2/60">
            Këto 3 produkte shfaqen të parat në katalog, mbi butonin «Shfaq më shumë». Kërkoni dhe
            zgjidhni deri në 3.
          </p>
          <div className="relative mt-4">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-bronze/70" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Kërko emër ose kod…"
              className="w-full rounded-full border border-line bg-ink-3/60 py-2.5 pl-10 pr-4 text-[13px] text-ivory placeholder:text-ivory-2/35"
            />
          </div>
          <div className="mt-4 grid max-h-[300px] gap-1.5 overflow-y-auto pr-1">
            {list.map((x) => {
              const on = a.featuredIds.includes(x.id);
              return (
                <div
                  key={x.id}
                  className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors ${
                    on ? "border-bronze/50 bg-bronze/8" : "border-line/60 bg-ink-3/40"
                  }`}
                >
                  <button
                    onClick={() => toggleFeatured(x.id)}
                    aria-pressed={on}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                      on ? "border-bronze bg-bronze text-ink" : "border-ivory-2/30 text-transparent"
                    }`}
                  >
                    <Check size={12} strokeWidth={3} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ivory">{x.name}</p>
                    <p className="truncate text-[10px] uppercase tracking-[0.14em] text-ivory-2/45">
                      {x.code} · {GROUP_ORDER.find((g) => g.cats.includes(x.cat))?.label ?? x.cat}
                    </p>
                  </div>
                  <Field
                    label="Çmimi €"
                    value={String(a.overrides[x.id]?.price ?? x.price)}
                    onSave={(v) => {
                      const n = parseFloat(v);
                      if (!Number.isNaN(n) && n >= 0) { a.setOverride(x.id, { price: n }); note("Çmimi u ruajt."); }
                    }}
                  />
                  <Field
                    label="Foto URL"
                    value={a.overrides[x.id]?.img ?? ""}
                    placeholder={x.img}
                    onSave={(v) => {
                      a.setOverride(x.id, { img: v.trim() });
                      note(v.trim() ? "Foto u ndryshua." : "U kthye foto origjinale.");
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Shto produkt të ri ── */}
        <form onSubmit={addCustom} className="mt-6 rounded-[22px] border border-line bg-ink-2 p-6">
          <div className="flex items-center gap-2.5">
            <ImagePlus size={16} className="text-bronze" />
            <h3 className="font-display text-[21px] font-semibold text-ivory">Shto produkt të ri</h3>
          </div>
          <p className="mt-1.5 text-[11.5px] font-light text-ivory-2/60">
            Produkte të reja shfaqen menjëherë, brenda kategorisë që zgjidhni (p.sh. «Gërma»).
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input name="name" required placeholder="Emri i produktit *" className="rounded-xl border border-line bg-ink-3/60 px-4 py-3 text-[13px] text-ivory placeholder:text-ivory-2/35" />
            <select name="cat" className="rounded-xl border border-line bg-ink-3/60 px-4 py-3 text-[13px] text-ivory">
              {GROUP_ORDER.map((g) => (
                <option key={g.id} value={g.cats[0]} className="bg-ink-2">
                  {g.label}
                </option>
              ))}
            </select>
            <input name="code" placeholder="Kodi — shfaqet nën emër" className="rounded-xl border border-line bg-ink-3/60 px-4 py-3 text-[13px] text-ivory placeholder:text-ivory-2/35" />
            <input name="price" type="number" step="0.01" min="0" placeholder="Çmimi në € (me TVSH)" className="rounded-xl border border-line bg-ink-3/60 px-4 py-3 text-[13px] text-ivory placeholder:text-ivory-2/35" />
            <input name="dims" placeholder="Përmasat (p.sh. Lartësia 40 cm)" className="rounded-xl border border-line bg-ink-3/60 px-4 py-3 text-[13px] text-ivory placeholder:text-ivory-2/35" />
            <input name="mat" placeholder="Materiali (p.sh. Bronz 87)" className="rounded-xl border border-line bg-ink-3/60 px-4 py-3 text-[13px] text-ivory placeholder:text-ivory-2/35" />
            <input name="img" placeholder="URL e fotos (opsionale)" className="rounded-xl border border-line bg-ink-3/60 px-4 py-3 text-[13px] text-ivory placeholder:text-ivory-2/35 sm:col-span-2" />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-bronze py-3 text-[11.5px] font-bold uppercase tracking-[0.16em] text-ink transition-shadow hover:shadow-[0_10px_35px_rgba(201,163,92,0.35)]"
            >
              <Plus size={14} strokeWidth={2.6} /> Shto produktin
            </button>
          </div>
          {a.custom.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {a.custom.map((c) => (
                <span key={c.id} className="inline-flex items-center gap-2 rounded-full border border-line bg-ink-3/50 px-3.5 py-1.5 text-[11px] text-ivory-2/80">
                  {c.name}
                  <button
                    type="button"
                    onClick={() => { a.removeCustom(c.id); note(`Produkti "${c.name}" u fshi.`); }}
                    className="text-ivory-2/50 hover:text-red-400"
                    aria-label={`Fshi ${c.name}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </form>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[95] -translate-x-1/2 rounded-full border border-bronze/40 bg-ink-2/95 px-5 py-2.5 text-[12px] font-semibold text-bronze shadow-[0_-8px_40px_rgba(0,0,0,0.5)] backdrop-blur-md">
          {toast}
        </div>
      )}
    </section>
  );
}

/** Small inline editor: edit value, blur/Enter saves. */
function Field({
  label,
  value,
  placeholder,
  onSave,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onSave: (v: string) => void;
}) {
  const [v, setV] = useState(value);
  const commit = () => { if (v !== value) onSave(v); };
  return (
    <label className="w-full shrink-0 sm:w-28 sm:text-right">
      <span className="block text-[8.5px] font-bold uppercase tracking-[0.16em] text-ivory-2/40">
        {label}
      </span>
      <input
        value={v}
        placeholder={placeholder}
        onChange={(e) => setV(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        className="mt-0.5 w-full truncate rounded-md border border-transparent bg-transparent text-[12px] font-semibold text-bronze placeholder:text-ivory-2/25 hover:border-line focus:bg-ink-3/70 sm:text-right"
      />
    </label>
  );
}
