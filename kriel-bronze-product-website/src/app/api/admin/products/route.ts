import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
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
    .slice(0, 40) || "produkt";
}

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Jo i autorizuar." }, { status: 401 });
  }
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const categoryId = String(body.categoryId ?? "").trim();
    if (!name || !categoryId) {
      return NextResponse.json({ error: "Emri dhe kategoria janë të detyrueshme." }, { status: 400 });
    }
    const id = slugify(name) + "-" + Math.random().toString(36).slice(2, 6);
    const price = Math.max(0, Math.round(Number(body.price) * 100) / 100 || 0);
    const [row] = await db
      .insert(products)
      .values({
        id,
        categoryId,
        name,
        code: String(body.code ?? ""),
        price,
        dims: String(body.dims ?? ""),
        mat: String(body.mat ?? ""),
        img: String(body.img ?? ""),
      })
      .returning();
    return NextResponse.json({ ok: true, product: row });
  } catch {
    return NextResponse.json({ error: "Nuk u ruajt produkti." }, { status: 500 });
  }
}
