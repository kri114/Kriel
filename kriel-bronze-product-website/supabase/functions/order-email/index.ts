// Supabase Edge Function: order-email
// ---------------------------------------------------------------------------
// Replaces src/lib/mailer.ts (nodemailer) from the old Next.js server.
// Invoked by the public site right after an order is created. It loads the
// order with the service-role key (never exposed to the browser), sends the
// e-mail to the shop through the Resend HTTP API and marks email_sent = true.
//
// Deploy:   supabase functions deploy order-email --no-verify-jwt
// Secrets:  supabase secrets set RESEND_API_KEY=re_xxx ORDER_EMAIL_FROM="KRIEL <onboarding@resend.dev>" ORDER_EMAIL_TO=infokrielshpk@kriel.com
// (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.)
// ---------------------------------------------------------------------------
// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2";

type OrderItem = {
  productId: number;
  name: string;
  code: string;
  price: number;
  qty: number;
  customText: string;
};

type OrderRow = {
  id: number;
  customer_name: string;
  phone: string;
  address: string;
  notes: string;
  items: OrderItem[];
  total: number | string;
  email_sent: boolean;
  created_at: string;
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildText(o: OrderRow): string {
  const total = Number(o.total);
  const lines: string[] = [];
  lines.push(`Porosi e re nga faqja KRIEL — #${o.id}`);
  lines.push("");
  lines.push(`Emri: ${o.customer_name}`);
  lines.push(`Telefoni: ${o.phone}`);
  lines.push(`Adresa: ${o.address}`);
  if (o.notes) lines.push(`Shënime: ${o.notes}`);
  lines.push("");
  lines.push("Produktet:");
  for (const it of o.items ?? []) {
    lines.push(`  • ${it.name}${it.code ? ` (${it.code})` : ""} — sasia: ${it.qty} — € ${Number(it.price).toFixed(2)} / cope`);
    if (it.customText) lines.push(`     ↳ Tekst i porositur (gërma): "${it.customText}"`);
  }
  lines.push("");
  lines.push(`Totali: € ${total.toFixed(2)}`);
  return lines.join("\n");
}

function buildHtml(o: OrderRow): string {
  const total = Number(o.total);
  const rows = (o.items ?? [])
    .map(
      (it) => `
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;">${escapeHtml(it.name)}${it.code ? ` <span style="color:#999;font-size:12px;">(${escapeHtml(it.code)})</span>` : ""}${it.customText ? `<br/><span style="color:#a97e42;font-size:12px;">Tekst i porositur: “${escapeHtml(it.customText)}”</span>` : ""}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center;">${it.qty}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right;">€ ${Number(it.price).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  return `
  <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#222;">
    <h2 style="color:#8a6434;">Porosi e re nga faqja KRIEL — #${o.id}</h2>
    <p><strong>Emri:</strong> ${escapeHtml(o.customer_name)}<br/>
    <strong>Telefoni:</strong> ${escapeHtml(o.phone)}<br/>
    <strong>Adresa:</strong> ${escapeHtml(o.address)}</p>
    ${o.notes ? `<p><strong>Shënime:</strong> ${escapeHtml(o.notes)}</p>` : ""}
    <table style="width:100%;border-collapse:collapse;margin-top:16px;">
      <thead>
        <tr style="background:#f5f0e6;">
          <th style="padding:8px 10px;text-align:left;">Produkti</th>
          <th style="padding:8px 10px;text-align:center;">Sasia</th>
          <th style="padding:8px 10px;text-align:right;">Çmimi</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="text-align:right;margin-top:14px;font-size:18px;"><strong>Totali: € ${total.toFixed(2)}</strong></p>
  </div>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let orderId: number;
  try {
    const body = await req.json();
    orderId = Number(body?.orderId);
    if (!Number.isFinite(orderId)) throw new Error("bad id");
  } catch {
    return json({ error: "ID e pavlefshme.", emailSent: false }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: order, error } = await supabase.from("orders").select("*").eq("id", orderId).single();
  if (error || !order) return json({ error: "Porosia nuk u gjet.", emailSent: false }, 404);

  const o = order as OrderRow;
  // Only mail orders created in the last few minutes (prevents abuse / re-sends).
  const ageMs = Date.now() - new Date(o.created_at + (o.created_at.endsWith("Z") ? "" : "Z")).getTime();
  if (o.email_sent || ageMs > 10 * 60 * 1000) return json({ emailSent: o.email_sent });

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const to = Deno.env.get("ORDER_EMAIL_TO") || "infokrielshpk@kriel.com";
  const from = Deno.env.get("ORDER_EMAIL_FROM") || "KRIEL <onboarding@resend.dev>";
  if (!apiKey) return json({ emailSent: false, reason: "RESEND_API_KEY not configured" });

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `Porosi e re KRIEL #${o.id} — ${o.customer_name}`,
        text: buildText(o),
        html: buildHtml(o),
      }),
    });
    if (!res.ok) {
      console.error("Resend error", await res.text());
      return json({ emailSent: false });
    }
    await supabase.from("orders").update({ email_sent: true }).eq("id", o.id);
    return json({ emailSent: true });
  } catch (err) {
    console.error("Failed to send order email", err);
    return json({ emailSent: false });
  }
});
