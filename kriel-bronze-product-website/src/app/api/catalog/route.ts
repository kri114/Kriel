import { NextResponse } from "next/server";
import { getCatalog } from "@/db/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const catalog = await getCatalog();
  return NextResponse.json(catalog);
}
