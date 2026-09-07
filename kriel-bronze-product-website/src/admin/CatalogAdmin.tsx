import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { PRODUCTS, Product } from "../data/catalogue";
import { ADMIN_USERNAME, ADMIN_PASSWORD } from "./credentials";
import {
  loadCloudMain,
  saveCloudMain,
  loadCloudPhoto,
  saveCloudPhoto,
  type CloudPayload,
} from "./cloud";

// ── Types ────────────────────────────────────────────────────
export type Override = Partial<Product> & { _deleted?: boolean };
export type Overrides = Record<string, Override>;
export type Layer = { overrides: Overrides; custom: Product[] };

type FilePayload = { overrides?: Overrides; custom?: Product[] };
export type CloudStatus = "loading" | "synced" | "saving" | "error" | "offline";

const LS_OVERRIDES = "kriel_overrides_v1";
const LS_CUSTOM = "kriel_custom_v1";
const SESSION_KEY = "kriel_admin_session";

// ── Helpers ──────────────────────────────────────────────────
function readLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Bashkon shtresat sipas radhës: baza < file < cloud < lokale. */
function mergeLayers(base: Product[], layers: Layer[]): Product[] {
  const ov: Overrides = {};
  const customs: Product[] = [];
  for (const l of layers) {
    Object.assign(ov, l.overrides);
    customs.push(...l.custom);
  }
  const out: Product[] = [];
  for (const p of base) {
    const o = ov[p.id];
    if (o?._deleted) continue;
    if (!o) {
      out.push(p);
      continue;
    }
    const { _deleted, ...rest } = o;
    out.push({ ...p, ...rest });
  }
  for (const p of customs) {
    const o = ov[p.id];
    if (o?._deleted) continue;
    if (!o) {
      out.push(p);
      continue;
    }
    const { _deleted, ...rest } = o;
    out.push({ ...p, ...rest });
  }
  return out;
}

/** Fotoja e ngarkuar në JPEG dataURL (cilësi e plotë për pajisjen lokale). */
export function fileToDataURL(file: File, maxDim = 1100, quality = 0.8): Promise<string> {
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
        ctx.fillStyle = "#cfc8bb";
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
      reject(new Error("bad-image"));
    };
    img.src = url;
  });
}

/** Heq fotot dataURL nga një snapshot (fotot shkojnë në faqe të veçanta). */
function stripDataUrls(ov: Overrides): Overrides {
  const out: Overrides = {};
  for (const [id, o] of Object.entries(ov)) {
    if (o.img && o.img.startsWith("data:")) {
      const { img, ...rest } = o;
      out[id] = rest;
    } else {
      out[id] = { ...o };
    }
  }
  return out;
}

function stripCustomPhotos(list: Product[]): Product[] {
  return list.map((p) =>
    p.img && p.img.startsWith("data:") ? { ...p, img: "" } : p
  );
}

function unionCustom(a: Product[], b: Product[]): Product[] {
  const map = new Map<string, Product>();
  for (const p of a) map.set(p.id, p);
  for (const p of b) map.set(p.id, p);
  return [...map.values()];
}

// ── Context ──────────────────────────────────────────────────
type CatalogAdminValue = {
  products: Product[];
  overridesCount: number;
  customCount: number;
  fileLoaded: boolean;
  isAuthed: boolean;
  login: (u: string, p: string) => boolean;
  logout: () => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  restoreProduct: (id: string) => void;
  isDeleted: (id: string) => boolean;
  addProduct: (p: Omit<Product, "id">) => Product;
  resetAll: () => void;
  exportData: () => void;
  importData: (file: File) => Promise<string>;
  // cloud
  cloudStatus: CloudStatus;
  lastSyncAt: number | null;
  cloudError: string;
  photosPending: number;
  stagePhoto: (id: string, cloudDataUrl: string | null) => void;
  syncNow: () => void;
};

const Ctx = createContext<CatalogAdminValue | null>(null);

export function CatalogAdminProvider({ children }: { children: ReactNode }) {
  const [lsOv, setLsOv] = useState<Overrides>(() => readLS(LS_OVERRIDES, {}));
  const [lsCustom, setLsCustom] = useState<Product[]>(() => readLS(LS_CUSTOM, []));
  const [fileOv, setFileOv] = useState<Overrides>({});
  const [fileCustom, setFileCustom] = useState<Product[]>([]);
  const [fileLoaded, setFileLoaded] = useState(false);
  const [isAuthed, setIsAuthed] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "1"
  );

  // ── cloud state ──
  const [cloudOv, setCloudOv] = useState<Overrides>({});
  const [cloudCustom, setCloudCustom] = useState<Product[]>([]);
  const [cloudPhotoPages, setCloudPhotoPages] = useState<Record<string, string>>({});
  const [cloudPhotos, setCloudPhotos] = useState<Record<string, string>>({});
  const [cloudReady, setCloudReady] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>("loading");
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [cloudError, setCloudError] = useState("");
  const [pendingPhotos, setPendingPhotos] = useState<Record<string, string | null>>({});

  const saveTimer = useRef<number | undefined>(undefined);
  const savingRef = useRef(false);
  const dirtyRef = useRef(false);
  const lastCloudAtRef = useRef(0);

  // pasqyrë e freskët për funksionet async (shmang stale closures)
  const ref = useRef({ lsOv, lsCustom, pendingPhotos, cloudOv, cloudCustom, cloudPhotoPages, cloudPhotos });
  ref.current = { lsOv, lsCustom, pendingPhotos, cloudOv, cloudCustom, cloudPhotoPages, cloudPhotos };

  // ── file layer ──
  useEffect(() => {
    fetch("overrides.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: FilePayload | null) => {
        if (j) {
          if (j.overrides) setFileOv(j.overrides);
          if (Array.isArray(j.custom)) setFileCustom(j.custom);
        }
      })
      .catch(() => {})
      .finally(() => setFileLoaded(true));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_OVERRIDES, JSON.stringify(lsOv));
    } catch {}
  }, [lsOv]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_CUSTOM, JSON.stringify(lsCustom));
    } catch {}
  }, [lsCustom]);

  // ── aplikimi i faqes kryesore + fotove të reja ──
  const applyMain = useCallback(async (main: CloudPayload) => {
    const prevPages = ref.current.cloudPhotoPages;
    setCloudOv(main.overrides);
    setCloudCustom(main.custom);
    setCloudPhotoPages(main.photoPages);
    lastCloudAtRef.current = main.updatedAt;
    // shkarko vetëm fotot e reja / të ndryshuara
    const toFetch = Object.entries(main.photoPages).filter(
      ([id, path]) => prevPages[id] !== path
    );
    const gone = Object.keys(prevPages).filter((id) => !(id in main.photoPages));
    if (toFetch.length > 0 || gone.length > 0) {
      const results = await Promise.allSettled(
        toFetch.slice(0, 80).map(([, path]) => loadCloudPhoto(path))
      );
      const fresh: Record<string, string> = {};
      for (const r of results) {
        if (r.status === "fulfilled" && r.value.img) fresh[r.value.id] = r.value.img;
      }
      setCloudPhotos((prev) => {
        const next = { ...prev, ...fresh };
        for (const id of gone) delete next[id];
        return next;
      });
    }
    setLastSyncAt(Date.now());
  }, []);

  // ── ngarkesa fillestare cloud ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await applyMain(await loadCloudMain());
        if (cancelled) return;
        setCloudReady(true);
        setCloudStatus("synced");
        setCloudError("");
      } catch {
        if (cancelled) return;
        setCloudStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error");
        setCloudError("Nuk u lidh me cloud-in. Ndryshimet ruhen lokalisht.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyMain]);

  // ── dërgimi i ndryshimeve në cloud (i serializuar) ──
  const flushSave = useCallback(async () => {
    if (savingRef.current) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => void flushSave(), 3000);
      return;
    }
    const s = ref.current;
    const hasPending = Object.keys(s.pendingPhotos).length > 0;
    if (!dirtyRef.current && !hasPending) return;
    savingRef.current = true;
    setCloudStatus("saving");
    try {
      // 1) fotot fillimisht (duhen path-et për faqen kryesore)
      const pages = { ...s.cloudPhotoPages };
      const photos = { ...s.cloudPhotos };
      const failed: Record<string, string | null> = {};
      for (const [id, data] of Object.entries(s.pendingPhotos)) {
        try {
          if (data === null) {
            delete pages[id];
            delete photos[id];
          } else {
            const path = await saveCloudPhoto(pages[id], id, data);
            pages[id] = path;
            photos[id] = data;
          }
        } catch {
          failed[id] = data;
        }
      }
      setCloudPhotoPages(pages);
      setCloudPhotos(photos);
      setPendingPhotos(failed);

      // 2) faqja kryesore (tekst + referenca fotosh, pa dataURL)
      const nextOv = { ...s.cloudOv, ...stripDataUrls(s.lsOv) };
      const nextCustom = unionCustom(
        stripCustomPhotos(s.cloudCustom),
        stripCustomPhotos(s.lsCustom)
      );
      const now = Date.now();
      const payload: CloudPayload = {
        overrides: nextOv,
        custom: nextCustom,
        photoPages: pages,
        updatedAt: now,
        updatedBy: "admin-panel",
      };
      await saveCloudMain(payload);
      lastCloudAtRef.current = now;
      setCloudOv(nextOv);
      setCloudCustom(nextCustom);
      setCloudReady(true);
      setCloudStatus("synced");
      setCloudError("");
      setLastSyncAt(now);
      dirtyRef.current = Object.keys(failed).length > 0;
      if (dirtyRef.current) {
        setCloudError("Disa foto nuk u ngarkuan — do të riprovohen.");
      }
    } catch (e) {
      setCloudStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error");
      setCloudError(
        String((e as Error)?.message || e) === "too-big"
          ? "Të dhënat u bënë shumë të mëdha për cloud-in. Përdorni Shkarko skedarin."
          : "Ruajtja cloud dështoi — ndryshimet janë të sigurta lokalisht."
      );
      // riprovo automatikisht pas 30s
      window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => void flushSave(), 30000);
    } finally {
      savingRef.current = false;
    }
  }, []);

  // ── autosave me debounce pas çdo ndryshimi ──
  useEffect(() => {
    if (!cloudReady) return;
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => void flushSave(), 2000);
    return () => window.clearTimeout(saveTimer.current);
  }, [lsOv, lsCustom, pendingPhotos, cloudReady, flushSave]);

  // ── polling për ndryshime nga pajisje të tjera + rikthim online ──
  useEffect(() => {
    const poll = async () => {
      if (document.hidden || savingRef.current) return;
      try {
        const main = await loadCloudMain();
        if (main.updatedAt > lastCloudAtRef.current) {
          await applyMain(main);
          if (!savingRef.current) setCloudStatus("synced");
        }
      } catch {
        /* heshtur — ruhet statusi aktual */
      }
    };
    const id = window.setInterval(poll, 90000);
    const onOnline = async () => {
      try {
        await applyMain(await loadCloudMain());
        setCloudReady(true);
        setCloudStatus("synced");
        setCloudError("");
        void flushSave();
      } catch {}
    };
    window.addEventListener("online", onOnline);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("online", onOnline);
    };
  }, [applyMain, flushSave]);

  const syncNow = useCallback(() => {
    window.clearTimeout(saveTimer.current);
    void (async () => {
      try {
        await applyMain(await loadCloudMain());
        setCloudReady(true);
      } catch {}
      void flushSave();
    })();
  }, [applyMain, flushSave]);

  // ── produktet e dukshme: baza < file < cloud < lokale ──
  const products = useMemo(() => {
    const cloudOvP: Overrides = { ...cloudOv };
    for (const [id, img] of Object.entries(cloudPhotos)) {
      cloudOvP[id] = { ...cloudOvP[id], img };
    }
    const cloudCustomP = cloudCustom.map((p) =>
      cloudPhotos[p.id] ? { ...p, img: cloudPhotos[p.id] } : p
    );
    return mergeLayers(PRODUCTS, [
      { overrides: fileOv, custom: fileCustom },
      { overrides: cloudOvP, custom: cloudCustomP },
      { overrides: lsOv, custom: lsCustom },
    ]);
  }, [fileOv, fileCustom, cloudOv, cloudCustom, cloudPhotos, lsOv, lsCustom]);

  // ── auth ──
  const login = useCallback((u: string, p: string) => {
    const ok = u.trim() === ADMIN_USERNAME && p === ADMIN_PASSWORD;
    if (ok) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setIsAuthed(true);
    }
    return ok;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthed(false);
  }, []);

  // ── mutacionet (shënohen për autosave) ──
  const updateProduct = useCallback((id: string, patch: Partial<Product>) => {
    dirtyRef.current = true;
    setLsOv((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }, []);

  const deleteProduct = useCallback((id: string) => {
    dirtyRef.current = true;
    setLsOv((prev) => ({ ...prev, [id]: { ...prev[id], _deleted: true } }));
  }, []);

  const restoreProduct = useCallback((id: string) => {
    dirtyRef.current = true;
    setLsOv((prev) => {
      const next = { ...prev };
      if (next[id]) {
        const { _deleted, ...rest } = next[id];
        if (Object.keys(rest).length === 0) delete next[id];
        else next[id] = rest;
      }
      return next;
    });
  }, []);

  const isDeleted = useCallback(
    (id: string) => !!lsOv[id]?._deleted || !!fileOv[id]?._deleted || !!cloudOv[id]?._deleted,
    [lsOv, fileOv, cloudOv]
  );

  const addProduct = useCallback((p: Omit<Product, "id">) => {
    dirtyRef.current = true;
    const id = `custom-${Date.now().toString(36)}`;
    const full: Product = { ...p, id };
    setLsCustom((prev) => [...prev, full]);
    return full;
  }, []);

  const stagePhoto = useCallback((id: string, cloudDataUrl: string | null) => {
    dirtyRef.current = true;
    setPendingPhotos((prev) => ({ ...prev, [id]: cloudDataUrl }));
  }, []);

  const resetAll = useCallback(() => {
    dirtyRef.current = false;
    setPendingPhotos({});
    setLsOv({});
    setLsCustom([]);
    try {
      localStorage.removeItem(LS_OVERRIDES);
      localStorage.removeItem(LS_CUSTOM);
    } catch {}
  }, []);

  const exportData = useCallback(() => {
    const payload = JSON.stringify({ overrides: lsOv, custom: lsCustom }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "overrides.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }, [lsOv, lsCustom]);

  const importData = useCallback((file: File) => {
    return new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => {
        try {
          const j = JSON.parse(String(r.result)) as FilePayload;
          if (j.overrides && typeof j.overrides === "object") setLsOv(j.overrides);
          if (Array.isArray(j.custom)) setLsCustom(j.custom);
          dirtyRef.current = true;
          const n = Object.keys(j.overrides || {}).length + (j.custom || []).length;
          resolve(`U importuan ${n} ndryshime (do të sinkronizohen automatikisht).`);
        } catch {
          reject("Skedari nuk është i vlefshëm.");
        }
      };
      r.onerror = () => reject("Nuk u lexua skedari.");
      r.readAsText(file);
    });
  }, []);

  const value: CatalogAdminValue = {
    products,
    overridesCount: Object.keys(lsOv).length,
    customCount: lsCustom.length,
    fileLoaded,
    isAuthed,
    login,
    logout,
    updateProduct,
    deleteProduct,
    restoreProduct,
    isDeleted,
    addProduct,
    resetAll,
    exportData,
    importData,
    cloudStatus,
    lastSyncAt,
    cloudError,
    photosPending: Object.keys(pendingPhotos).length,
    stagePhoto,
    syncNow,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCatalogAdmin() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCatalogAdmin jashtë provider-it");
  return v;
}

/** Fotoja origjinale e katalogut (për butonin "kthe origjinalin"). */
export function baseImageOf(id: string): string {
  return PRODUCTS.find((p) => p.id === id)?.img ?? "";
}
