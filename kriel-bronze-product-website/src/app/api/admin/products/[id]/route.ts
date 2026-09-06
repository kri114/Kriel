import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { isAdminRequest } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Jo i autorizuar." }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const patch: Partial<typeof products.$inferInsert> = {};
    if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
    if (typeof body.code === "string") patch.code = body.code;
    if (typeof body.dims === "string") patch.dims = body.dims;
    if (typeof body.mat === "string") patch.mat = body.mat;
    if (typeof body.img === "string") patch.img = body.img;
    if (typeof body.categoryId === "string" && body.categoryId) patch.categoryId = body.categoryId;
    if (body.price !== undefined) {
      const p = Math.round(Number(body.price) * 100) / 100;
      if (Number.isFinite(p) && p >= 0) patch.price = p;
    }
    const [row] = await db.update(products).set(patch).where(eq(products.id, id)).returning();
    if (!row) return NextResponse.json({ error: "Produkti nuk u gjet." }, { status: 404 });
    return NextResponse.json({ ok: true, product: row });
  } catch {
    return NextResponse.json({ error: "Ndryshimi dështoi." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Jo i autorizuar." }, { status: 401 });
  }
  const { id } = await ctx.params;
  await db.delete(products).where(eq(products.id, id));
  return NextResponse.json({ ok: true });
}
