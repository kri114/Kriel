import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getOrders, toOrder } from "@/lib/data";
import { isAdminAuthenticated } from "@/lib/auth";
import { sendOrderEmail } from "@/lib/mailer";
import type { OrderItemPayload } from "@/lib/types";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Nuk keni akses." }, { status: 401 });
  }
  const list = await getOrders();
  return NextResponse.json({ orders: list });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Të dhëna të pavlefshme." }, { status: 400 });
  }

  const customerName = typeof body.customerName === "string" ? body.customerName.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const address = typeof body.address === "string" ? body.address.trim() : "";
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";
  const rawItems = Array.isArray(body.items) ? body.items : [];

  if (!customerName || !phone || !address) {
    return NextResponse.json(
      { error: "Emri, telefoni dhe adresa janë të domosdoshme." },
      { status: 400 }
    );
  }
  if (rawItems.length === 0) {
    return NextResponse.json({ error: "Shporta është bosh." }, { status: 400 });
  }

  const items: OrderItemPayload[] = rawItems.map((it: Record<string, unknown>) => ({
    productId: Number(it.productId) || 0,
    name: typeof it.name === "string" ? it.name : "",
    code: typeof it.code === "string" ? it.code : "",
    price: Number(it.price) || 0,
    qty: Math.max(1, Number(it.qty) || 1),
    customText: typeof it.customText === "string" ? it.customText.trim() : "",
  }));

  const total = items.reduce((sum, it) => sum + it.price * it.qty, 0);

  const [created] = await db
    .insert(orders)
    .values({
      customerName,
      phone,
      address,
      notes,
      items,
      total: total.toFixed(2),
      status: "e_re",
      emailSent: false,
    })
    .returning();

  const emailSent = await sendOrderEmail({
    id: created.id,
    customerName,
    phone,
    address,
    notes,
    items,
    total,
  });

  if (emailSent) {
    await db.update(orders).set({ emailSent: true }).where(eq(orders.id, created.id));
  }

  return NextResponse.json(
    { order: toOrder({ ...created, emailSent }), emailSent },
    { status: 201 }
  );
}
