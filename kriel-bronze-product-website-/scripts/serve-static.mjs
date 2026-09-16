/**
 * Tiny dependency-free static server for the exported site (the `out/` folder
 * produced by `npm run build` with `output: "export"`).
 *
 * Used by `npm run start` for local previews and platform health checks.
 * Deployments on Render Static Site serve `out/` directly from the CDN —
 * this script is NOT needed there.
 *
 * Behavior:
 *  - GET /            -> out/index.html
 *  - GET /admin       -> out/admin.html        (clean URLs)
 *  - GET /api/health  -> out/api/health        (static JSON file)
 *  - anything else    -> matching file in out/, or out/404.html with 404
 */

import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { resolve, normalize, extname, join } from "node:path";

const ROOT = resolve(process.cwd(), "out");
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".avif": "image/avif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json",
};

function contentTypeFor(filePath) {
  const ext = extname(filePath).toLowerCase();
  if (MIME[ext]) return MIME[ext];
  // Extension-less files in this export are JSON payloads (e.g. /api/health).
  return "application/json; charset=utf-8";
}

function resolveRequest(pathname) {
  // Prevent path traversal.
  const safe = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const full = join(ROOT, safe);
  if (!full.startsWith(ROOT)) return null;

  // Direct file hit (includes /api/health).
  if (existsSync(full) && statSync(full).isFile()) return full;

  // Directory with index.html.
  if (existsSync(full) && statSync(full).isDirectory()) {
    const idx = join(full, "index.html");
    if (existsSync(idx)) return idx;
  }

  // Clean-URL hit: /admin -> /admin.html
  const html = `${full}.html`;
  if (existsSync(html) && statSync(html).isFile()) return html;

  return null;
}

if (!existsSync(ROOT)) {
  console.error(
    "\n  No 'out' directory found. Run  npm run build  first to generate the static site.\n"
  );
  process.exit(1);
}

const server = createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "content-type": "text/plain; charset=utf-8" });
    res.end("Method Not Allowed");
    return;
  }

  const pathname = decodeURIComponent((req.url || "/").split("?")[0]);
  const file = resolveRequest(pathname);

  if (!file) {
    const notFound = join(ROOT, "404.html");
    const fallback = existsSync(notFound) ? notFound : null;
    res.writeHead(404, {
      "content-type": "text/html; charset=utf-8",
    });
    if (fallback) {
      createReadStream(fallback).pipe(res);
    } else {
      res.end("404 Not Found");
    }
    return;
  }

  res.writeHead(200, {
    "content-type": contentTypeFor(file),
    "cache-control": "no-cache",
  });
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  createReadStream(file).pipe(res);
});

server.listen(PORT, HOST, () => {
  console.log(`Serving static site from ${ROOT}`);
  console.log(`→ http://localhost:${PORT}`);
});
