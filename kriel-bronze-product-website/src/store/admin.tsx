import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { PRODUCTS, FEATURED_IDS, type Product } from "../data/catalog";

/**
 * Paneli i administratorit — ruajtja bëhet lokalisht (localStorage),
 * me eksport/import JSON për backup ose kalim në pajisje tjetër.
 *
 * Kredencialet e hyrjes — ndryshojini sipas dëshirës:
 */
export const ADMIN_USER = "Krieladmin";
export const ADMIN_PASS = "kriel26-27";

const LS_KEY = "kriel-catalog-sync-09-04";

export type Override = Partial<Pick<Product, "name" | "code" | "price" | "dims" | "mat" | "img">>;

type Persisted = {
  overrides: Record<string, Override>;
  custom: Product[];
  featured: string[] | null;
};

type AdminState = {
  isAuthed: boolean;
  login: (u: string, p: string) => boolean;
  logout: () => void;
  products: Product[];               // base + overrides + custom
  overrides: Record<string, Override>;
  custom: Product[];
  featuredIds: string[];             // the 3 owner-chosen products
  overridesCount: number;
  customCount: number;
  setOverride: (id: string, o: Override) => void;
  resetOverride: (id: string) => void;
  addCustom: (p: Product) => void;
  removeCustom: (id: string) => void;
  setFeatured: (ids: string[]) => void;
  exportJSON: () => void;
  importJSON: (file: File) => Promise<string>;   // resolves with toast msg
  resetAll: () => void;
};

const Ctx = createContext<AdminState | null>(null);

function load(): Persisted {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        overrides: p.overrides ?? {},
        custom: Array.isArray(p.custom) ? p.custom : [],
        featured: Array.isArray(p.featured) ? p.featured : null,
      };
    }
  } catch { /* corrupted -> start clean */ }
  return { overrides: {}, custom: [], featured: null };
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAuthed, setAuthed] = useState(() => sessionStorage.getItem("kriel-admin-auth") === "1");
  const [overrides, setOverrides] = useState<Record<string, Override>>(() => load().overrides);
  const [custom, setCustom] = useState<Product[]>(() => load().custom);
  const [featured, setFeaturedState] = useState<string[] | null>(() => load().featured);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ overrides, custom, featured }));
    } catch { /* storage full — user can export instead */ }
  }, [overrides, custom, featured]);

  const login = (u: string, p: string) => {
    const ok = u.trim() === ADMIN_USER && p === ADMIN_PASS;
    if (ok) { setAuthed(true); sessionStorage.setItem("kriel-admin-auth", "1"); }
    return ok;
  };
  const logout = () => { setAuthed(false); sessionStorage.removeItem("kriel-admin-auth"); };

  const products = useMemo(() => {
    const merged = PRODUCTS.map((p) =>
      overrides[p.id] ? { ...p, ...clean(overrides[p.id]) } : p
    );
    return [...merged, ...custom];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrides, custom]);

  const featuredIds = useMemo(() => {
    const ids = (featured && featured.length ? featured : FEATURED_IDS)
      .filter((id) => products.some((p) => p.id === id));
    if (ids.length >= 3) return ids.slice(0, 3);
    // top-up from catalog start so the row never renders empty
    const fill = products.map((p) => p.id).filter((id) => !ids.includes(id));
    return [...ids, ...fill].slice(0, 3);
  }, [featured, products]);

  const setOverride = (id: string, o: Override) =>
    setOverrides((prev) => ({ ...prev, [id]: { ...(prev[id] ?? {}), ...o } }));

  const resetOverride = (id: string) =>
    setOverrides((prev) => { const n = { ...prev }; delete n[id]; return n; });

  const addCustom = (p: Product) => setCustom((prev) => [...prev.filter((x) => x.id !== p.id), p]);
  const removeCustom = (id: string) => setCustom((prev) => prev.filter((x) => x.id !== id));

  const setFeatured = (ids: string[]) => setFeaturedState(ids.slice(0, 3));

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ overrides, custom, featured }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kriel-katalog-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => {
        try {
          const p = JSON.parse(String(r.result));
          setOverrides(p.overrides ?? {});
          setCustom(Array.isArray(p.custom) ? p.custom : []);
          setFeaturedState(Array.isArray(p.featured) ? p.featured : null);
          const n = Object.keys(p.overrides ?? {}).length + (p.custom?.length ?? 0);
          resolve(`U importuan ${n} ndryshime (ruajtur lokalisht).`);
        } catch {
          reject(new Error("Skedari nuk është i vlefshëm."));
        }
      };
      r.onerror = () => reject(new Error("Skedari nuk u lexua."));
      r.readAsText(file);
    });

  const resetAll = () => { setOverrides({}); setCustom([]); setFeaturedState(null); };

  const value: AdminState = {
    isAuthed, login, logout,
    products, overrides, custom,
    featuredIds,
    overridesCount: Object.keys(overrides).length,
    customCount: custom.length,
    setOverride, resetOverride, addCustom, removeCustom, setFeatured,
    exportJSON, importJSON, resetAll,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdmin() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAdmin must be used within AdminProvider");
  return v;
}

function clean(o: Override): Override {
  const n: Override = {};
  for (const k of Object.keys(o) as (keyof Override)[]) {
    const v = o[k];
    if (v !== undefined && v !== "") (n as Record<string, unknown>)[k] = v;
  }
  return n;
}
