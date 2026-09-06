import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

// Kredencialet merren nga environment-i (me vlera parazgjedhje për zhvillim)
const ADMIN_USER = process.env.ADMIN_USERNAME || "kriel";
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "kriel2025";

export const ADMIN_COOKIE = "kriel_admin";

function tokenFor(u: string, p: string): string {
  return createHash("sha256").update(`kriel:${u}:${p}:v1`).digest("hex");
}

const EXPECTED_TOKEN = tokenFor(ADMIN_USER, ADMIN_PASS);

export function checkCredentials(username: string, password: string): boolean {
  const a = Buffer.from(tokenFor(username, password));
  const b = Buffer.from(EXPECTED_TOKEN);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isAdminRequest(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value ?? "";
  const a = Buffer.from(token);
  const b = Buffer.from(EXPECTED_TOKEN);
  return a.length === b.length && timingSafeEqual(a, b);
}

export { EXPECTED_TOKEN };
