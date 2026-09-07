// Static health endpoint (exported as /api/health at build time).
export const dynamic = "force-static";

export function GET() {
  return Response.json({ ok: true, static: true });
}
