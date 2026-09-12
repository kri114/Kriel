// Static health-check endpoint.
// With `output: "export"` this route is prerendered at build time into a
// static file (out/api/health) and requires no running server or database.
export const dynamic = "force-static";

export function GET() {
  return Response.json({ ok: true });
}
