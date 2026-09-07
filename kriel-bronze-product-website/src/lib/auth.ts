import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "kriel_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.DATABASE_URL ||
    "kriel-fallback-secret-change-me"
  );
}

function getCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || "admin",
    password: process.env.ADMIN_PASSWORD || "Kriel2025!",
  };
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createSessionToken(username: string): string {
  const issuedAt = Date.now().toString();
  const payload = `${username}.${issuedAt}`;
  const signature = sign(payload);
  return Buffer.from(`${payload}.${signature}`).toString("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(".");
    if (parts.length !== 3) return false;
    const [username, issuedAt, signature] = parts;
    const payload = `${username}.${issuedAt}`;
    const expected = sign(payload);
    if (!safeEqual(signature, expected)) return false;
    const { username: validUser } = getCredentials();
    if (username !== validUser) return false;
    const age = Date.now() - Number(issuedAt);
    if (Number.isNaN(age) || age > SESSION_MAX_AGE * 1000) return false;
    return true;
  } catch {
    return false;
  }
}

export function checkCredentials(username: string, password: string): boolean {
  const creds = getCredentials();
  return (
    username.trim() === creds.username && password === creds.password
  );
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

export const SESSION_MAX_AGE_SECONDS = SESSION_MAX_AGE;
