import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { isAdminRequest } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Jo i autorizuar." }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const patch: Partial<typeof categories.$inferInsert> = {};
    if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
    if (typeof body.cover === "string") patch.cover = body.cover;
    const [row] = await db.update(categories).set(patch).where(eq(categories.id, id)).returning();
    if (!row) return NextResponse.json({ error: "Kategoria nuk u gjet." }, { status: 404 });
    return NextResponse.json({ ok: true, category: row });
  } catch {
    return NextResponse.json({ error: "Ndryshimi dështoi." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Jo i autorizuar." }, { status: 401 });
  }
  const { id } = await ctx.params;
  // Produktet e kategorisë fshihen automatikisht (onDelete: cascade)
  await db.delete(categories).where(eq(categories.id, id));
  return NextResponse.json({ ok: true });
}
