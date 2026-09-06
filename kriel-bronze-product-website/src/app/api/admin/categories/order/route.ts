import { NextRequest, NextResponse } from "next/server";
import { inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { isAdminRequest } from "@/lib/auth";

// Renditja e kategorive: merr listën e plotë të id-ve sipas radhës së re
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Jo i autorizuar." }, { status: 401 });
  }
  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Lista e pavlefshme." }, { status: 400 });
    }
    await db
      .update(categories)
      .set({
        sort: sql`array_position(ARRAY[${sql.join(
          ids.map((id: string) => sql`${id}`),
          sql`, `
        )}]::text[], ${categories.id})`,
      })
      .where(inArray(categories.id, ids));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Renditja dështoi." }, { status: 500 });
  }
}
