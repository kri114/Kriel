import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { isAdminRequest } from "@/lib/auth";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/ë/g, "e")
    .replace(/ç/g, "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Jo i autorizuar." }, { status: 401 });
  }
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "Emri është i detyrueshëm." }, { status: 400 });

    let id = slugify(name) || "kategori";
    // garanto unikësinë e id-së
    const existing = await db.select({ id: categories.id }).from(categories);
    const used = new Set(existing.map((r) => r.id));
    if (used.has(id)) {
      let n = 2;
      while (used.has(`${id}-${n}`)) n++;
      id = `${id}-${n}`;
    }

    const [{ value: maxSort }] = await db
      .select({ value: sql<number>`coalesce(max(${categories.sort}), 0)` })
      .from(categories);

    const [row] = await db
      .insert(categories)
      .values({
        id,
        name,
        cover: String(body.cover ?? "") || "/images/categories/statuja.jpg",
        sort: maxSort + 1,
      })
      .returning();
    return NextResponse.json({ ok: true, category: row });
  } catch {
    return NextResponse.json({ error: "Kategoria nuk u krijua." }, { status: 500 });
  }
}
