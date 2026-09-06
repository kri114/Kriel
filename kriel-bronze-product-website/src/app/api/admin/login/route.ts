import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, checkCredentials, EXPECTED_TOKEN } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (typeof username !== "string" || typeof password !== "string" || !checkCredentials(username, password)) {
      return NextResponse.json({ ok: false, error: "Kredenciale të gabuara." }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, EXPECTED_TOKEN, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 ditë
    });
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "Kërkesë e pavlefshme." }, { status: 400 });
  }
}
