import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { toCategory } from "@/lib/data";
import { isAdminAuthenticated } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Nuk keni akses." }, { status: 401 });
  }
  const { id } = await params;
  const categoryId = Number(id);
  if (!Number.isFinite(categoryId)) {
    return NextResponse.json({ error: "ID e pavlefshme." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Të dhëna të pavlefshme." }, { status: 400 });
  }

  const updates: Partial<typeof categories.$inferInsert> = {};
  if (typeof body.name === "string") updates.name = body.name.trim();
  if (typeof body.description === "string") updates.description = body.description;
  if (typeof body.image === "string") updates.image = body.image;
  if (typeof body.sortOrder === "number") updates.sortOrder = body.sortOrder;
  if (typeof body.slug === "string" && body.slug.trim()) updates.slug = body.slug.trim();

  const [updated] = await db
    .update(categories)
    .set(updates)
    .where(eq(categories.id, categoryId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Kategoria nuk u gjet." }, { status: 404 });
  }

  return NextResponse.json({ category: toCategory(updated) });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Nuk keni akses." }, { status: 401 });
  }
  const { id } = await params;
  const categoryId = Number(id);
  if (!Number.isFinite(categoryId)) {
    return NextResponse.json({ error: "ID e pavlefshme." }, { status: 400 });
  }

  await db.delete(categories).where(eq(categories.id, categoryId));
  return NextResponse.json({ ok: true });
}
