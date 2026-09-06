import type { Overrides } from "./CatalogAdmin";
import type { Product } from "../data/catalogue";

// ─────────────────────────────────────────────────────────────
// KRIEL · Sinkronizimi automatik cloud (pa GitHub, pa llogari)
// Faqja lexon/shkruan këtu automatikisht. Mos i prekni këto
// vlera — janë çelësi i përbashkët i dyqanit tuaj.
// ─────────────────────────────────────────────────────────────
const CLOUD_TOKEN = "eba023d9bbcc35b6d15e7261f76d56c901d13ca7ac65b9989dd5eb8f4982";
const CLOUD_PATH = "kriel-catalog-sync-09-04";

const API = "https://api.telegra.ph";
const MAX_PHOTO_URL_LEN = 52_000; // dataURL max për faqet e fotove (~64KB limit)

export type SiteSettings = { visibleCount?: number };

export type CloudPayload = {
  overrides: Overrides;
  custom: Product[];
  photoPages: Record<string, string>; // productId -> telegraph path
  settings: SiteSettings;
  updatedAt: number;
  updatedBy: string;
};

export const EMPTY_CLOUD: CloudPayload = {
  overrides: {},
  custom: [],
  photoPages: {},
  settings: {},
  updatedAt: 0,
  updatedBy: "",
};

async function api(method: string, params: Record<string, string>): Promise<any> {
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), 25000);
  try {
    const body = new URLSearchParams(params).toString();
    const r = await fetch(`${API}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body,
      signal: ctrl.signal,
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || "cloud-error");
    return j.result;
  } finally {
    window.clearTimeout(t);
  }
}

function readPre(result: any): string {
  const nodes: any[] = result?.content ?? [];
  for (const n of nodes) {
    if (n?.tag === "pre" && Array.isArray(n.children) && typeof n.children[0] === "string") {
      return n.children[0];
    }
  }
  throw new Error("format-error");
}

function toContent(json: string): string {
  return JSON.stringify([{ tag: "pre", children: [json] }]);
}

/** Lexon faqen kryesore të sinkronizimit. */
export async function loadCloudMain(): Promise<CloudPayload> {
  const res = await api("getPage", { path: CLOUD_PATH, return_content: "true" });
  const raw = readPre(res);
  const j = JSON.parse(raw);
  return {
    overrides: j.overrides && typeof j.overrides === "object" ? j.overrides : {},
    custom: Array.isArray(j.custom) ? j.custom : [],
    photoPages: j.photoPages && typeof j.photoPages === "object" ? j.photoPages : {},
    settings: j.settings && typeof j.settings === "object" ? j.settings : {},
    updatedAt: Number(j.updatedAt) || 0,
    updatedBy: String(j.updatedBy || ""),
  };
}

/** Shkruan faqen kryesore (pa fotot dataURL — ato rrinë në faqe të veçanta). */
export async function saveCloudMain(payload: CloudPayload): Promise<void> {
  const json = JSON.stringify({
    overrides: payload.overrides,
    custom: payload.custom,
    photoPages: payload.photoPages,
    settings: payload.settings,
    updatedAt: payload.updatedAt,
    updatedBy: payload.updatedBy,
  });
  if (json.length > 55_000) throw new Error("too-big");
  await api("editPage", {
    access_token: CLOUD_TOKEN,
    path: CLOUD_PATH,
    title: "kriel-catalog-sync",
    content: toContent(json),
  });
}

/** Lexon një faqe fotoje → dataURL. */
export async function loadCloudPhoto(path: string): Promise<{ id: string; img: string }> {
  const res = await api("getPage", { path, return_content: "true" });
  const j = JSON.parse(readPre(res));
  if (!j.id || typeof j.img !== "string") throw new Error("format-error");
  return { id: String(j.id), img: j.img };
}

/** Krijon ose përditëson faqen e fotos për një produkt → kthen path-in. */
export async function saveCloudPhoto(
  existingPath: string | undefined,
  id: string,
  dataUrl: string
): Promise<string> {
  const json = JSON.stringify({ id, img: dataUrl });
  if (existingPath) {
    await api("editPage", {
      access_token: CLOUD_TOKEN,
      path: existingPath,
      title: `kriel-photo ${id}`,
      content: toContent(json),
    });
    return existingPath;
  }
  const res = await api("createPage", {
    access_token: CLOUD_TOKEN,
    title: `kriel-photo ${id}`,
    content: toContent(json),
  });
  return String(res.path);
}

// ── Kompresimi i fotove ──────────────────────────────────────
function compress(file: File, maxDim: number, quality: number): Promise<string> {
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

/**
 * Kthen versionin e fotos që futet në cloud (≤ ~52KB).
 * Kthen null nëse fotoja nuk futet dot — çmimi sinkronizohet prapë.
 */
export async function fileToCloudPhoto(file: File): Promise<string | null> {
  const tries: Array<[number, number]> = [
    [750, 0.68],
    [640, 0.62],
    [540, 0.56],
    [460, 0.5],
  ];
  for (const [dim, q] of tries) {
    try {
      const url = await compress(file, dim, q);
      if (url.length <= MAX_PHOTO_URL_LEN) return url;
    } catch {
      return null;
    }
  }
  return null;
}
