import { NextRequest, NextResponse } from "next/server";
import { setFeaturedIds } from "@/db/catalog";
import { isAdminRequest } from "@/lib/auth";

// "Më të pëlqyerat": merr listën e id-ve të produkteve sipas radhës së dëshiruar
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Jo i autorizuar." }, { status: 401 });
  }
  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids)) {
      return NextResponse.json({ error: "Lista e pavlefshme." }, { status: 400 });
    }
    await setFeaturedIds(ids.slice(0, 12).map(String));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ruajtja dështoi." }, { status: 500 });
  }
}
