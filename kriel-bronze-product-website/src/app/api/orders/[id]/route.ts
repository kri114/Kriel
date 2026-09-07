import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { toOrder } from "@/lib/data";
import { isAdminAuthenticated } from "@/lib/auth";

const VALID_STATUSES = ["e_re", "konfirmuar", "perfunduar", "anulluar"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Nuk keni akses." }, { status: 401 });
  }
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isFinite(orderId)) {
    return NextResponse.json({ error: "ID e pavlefshme." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Statusi i pavlefshëm." }, { status: 400 });
  }

  const [updated] = await db
    .update(orders)
    .set({ status: body.status })
    .where(eq(orders.id, orderId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Porosia nuk u gjet." }, { status: 404 });
  }

  return NextResponse.json({ order: toOrder(updated) });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Nuk keni akses." }, { status: 401 });
  }
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isFinite(orderId)) {
    return NextResponse.json({ error: "ID e pavlefshme." }, { status: 400 });
  }
  await db.delete(orders).where(eq(orders.id, orderId));
  return NextResponse.json({ ok: true });
}
