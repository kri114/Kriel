import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { toProduct } from "@/lib/data";
import { isAdminAuthenticated } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Nuk keni akses." }, { status: 401 });
  }
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isFinite(productId)) {
    return NextResponse.json({ error: "ID e pavlefshme." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Të dhëna të pavlefshme." }, { status: 400 });
  }

  const updates: Partial<typeof products.$inferInsert> = {};
  if (typeof body.name === "string") updates.name = body.name.trim();
  if (typeof body.code === "string") updates.code = body.code;
  if (typeof body.price === "number") updates.price = body.price.toFixed(2);
  if (typeof body.dims === "string") updates.dims = body.dims;
  if (typeof body.material === "string") updates.material = body.material;
  if (typeof body.description === "string") updates.description = body.description;
  if (typeof body.image === "string") updates.image = body.image;
  if (typeof body.sortOrder === "number") updates.sortOrder = body.sortOrder;
  if (typeof body.featured === "boolean") updates.featured = body.featured;
  if (typeof body.featuredOrder === "number") updates.featuredOrder = body.featuredOrder;
  if (typeof body.customizable === "boolean") updates.customizable = body.customizable;
  if (typeof body.active === "boolean") updates.active = body.active;
  if (body.categoryId === null || typeof body.categoryId === "number") {
    updates.categoryId = body.categoryId;
  }

  const [updated] = await db
    .update(products)
    .set(updates)
    .where(eq(products.id, productId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Produkti nuk u gjet." }, { status: 404 });
  }

  return NextResponse.json({ product: toProduct(updated) });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Nuk keni akses." }, { status: 401 });
  }
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isFinite(productId)) {
    return NextResponse.json({ error: "ID e pavlefshme." }, { status: 400 });
  }

  await db.delete(products).where(eq(products.id, productId));
  return NextResponse.json({ ok: true });
}
