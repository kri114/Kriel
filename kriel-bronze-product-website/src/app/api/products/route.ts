import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { getProducts, toProduct } from "@/lib/data";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const onlyActive = req.nextUrl.searchParams.get("all") !== "1";
  const list = await getProducts({ onlyActive });
  return NextResponse.json({ products: list });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Nuk keni akses." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "Emri i produktit është i domosdoshëm." }, { status: 400 });
  }

  const existing = await getProducts();
  const nextOrder = existing.length ? Math.max(...existing.map((p) => p.sortOrder)) + 1 : 0;

  const [created] = await db
    .insert(products)
    .values({
      categoryId: typeof body.categoryId === "number" ? body.categoryId : null,
      name: body.name.trim(),
      code: typeof body.code === "string" ? body.code : "",
      price: typeof body.price === "number" ? body.price.toFixed(2) : "0",
      dims: typeof body.dims === "string" ? body.dims : "",
      material: typeof body.material === "string" ? body.material : "",
      description: typeof body.description === "string" ? body.description : "",
      image: typeof body.image === "string" ? body.image : "",
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : nextOrder,
      featured: Boolean(body.featured),
      featuredOrder: typeof body.featuredOrder === "number" ? body.featuredOrder : 0,
      customizable: Boolean(body.customizable),
      active: body.active === undefined ? true : Boolean(body.active),
    })
    .returning();

  return NextResponse.json({ product: toProduct(created) }, { status: 201 });
}
