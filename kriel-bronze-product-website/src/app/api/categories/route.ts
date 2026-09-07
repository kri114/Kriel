import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { getCategories, toCategory } from "@/lib/data";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET() {
  const list = await getCategories();
  return NextResponse.json({ categories: list });
}

function slugify(input: string): string {
  return input
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "") || `kategori-${Date.now()}`;
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Nuk keni akses." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "Emri i kategorisë është i domosdoshëm." }, { status: 400 });
  }

  const baseSlug = slugify(body.slug && typeof body.slug === "string" ? body.slug : body.name);
  let slug = baseSlug;
  let attempt = 1;

  const maxOrderRow = await getCategories();
  const nextOrder = maxOrderRow.length
    ? Math.max(...maxOrderRow.map((c) => c.sortOrder)) + 1
    : 0;

  try {
    const [created] = await db
      .insert(categories)
      .values({
        slug,
        name: body.name.trim(),
        description: typeof body.description === "string" ? body.description : "",
        image: typeof body.image === "string" ? body.image : "",
        sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : nextOrder,
      })
      .returning();
    return NextResponse.json({ category: toCategory(created) }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("unique")) {
      slug = `${baseSlug}-${attempt++}`;
      const [created] = await db
        .insert(categories)
        .values({
          slug,
          name: body.name.trim(),
          description: typeof body.description === "string" ? body.description : "",
          image: typeof body.image === "string" ? body.image : "",
          sortOrder: nextOrder,
        })
        .returning();
      return NextResponse.json({ category: toCategory(created) }, { status: 201 });
    }
    console.error(err);
    return NextResponse.json({ error: "Gabim gjatë krijimit të kategorisë." }, { status: 500 });
  }
}
