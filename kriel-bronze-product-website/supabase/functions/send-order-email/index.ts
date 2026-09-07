// ============================================================================
// KRIEL — order email notification
//
// Supabase Edge Function (Deno). Can be triggered in TWO safe ways:
//   1. Directly from the checkout in the browser (supabase.functions.invoke
//      with { orderId }) — the default path since the site is static.
//   2. By a Database Webhook on `orders` INSERT (payload { type, record }) —
//      optional reliability backup.
//
// The function is IDEMPOTENT: it reads the order from the database itself
// (never trusts caller-provided content) and skips sending when
// orders.email_sent is already true, so calling it twice never sends twice.
//
// Secrets (Dashboard → Edge Functions → Secrets — NEVER commit them):
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM (optional)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.
//
// IMPORTANT: turn OFF "Enforce JWT Verification" for this function
// (Edge Functions → send-order-email → Settings) so the public checkout and
// the webhook can invoke it. It exposes nothing and only ever emails
// ORDER_EMAIL_TO.
// ============================================================================

import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

// Where order notifications are delivered. Can be overridden with the
// ORDER_EMAIL_TO edge secret; defaults to the shop's real Gmail inbox.
const ORDER_EMAIL_TO = Deno.env.get("ORDER_EMAIL_TO") || "infokrielshpk@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

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
  notes: string | null;
  items: unknown;
  total: number | string;
  email_sent: boolean;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseItems(raw: unknown): OrderItem[] {
  try {
    if (Array.isArray(raw)) return raw as OrderItem[];
    if (typeof raw === "string") {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as OrderItem[]) : [];
    }
  } catch {
    // fall through
  }
  return [];
}

function buildText(o: OrderRow, items: OrderItem[], total: number): string {
  const lines: string[] = [];
  lines.push(`Porosi e re nga faqja KRIEL — #${o.id}`);
  lines.push("");
  lines.push(`Emri: ${o.customer_name}`);
  lines.push(`Telefoni: ${o.phone}`);
  lines.push(`Adresa: ${o.address}`);
  if (o.notes) lines.push(`Shënime: ${o.notes}`);
  lines.push("");
  lines.push("Produktet:");
  for (const it of items) {
    lines.push(
      `  • ${it.name}${it.code ? ` (${it.code})` : ""} — sasia: ${it.qty} — € ${Number(it.price).toFixed(2)} / cope`
    );
    if (it.customText) {
      lines.push(`     ↳ Tekst i porositur (gërma): "${it.customText}"`);
    }
  }
  lines.push("");
  lines.push(`Totali: € ${total.toFixed(2)}`);
  return lines.join("\n");
}

function buildHtml(o: OrderRow, items: OrderItem[], total: number): string {
  const rows = items
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

const CODE_VERSION = "v2-denomailer-1.6.0";

Deno.serve(async (req) => {
  console.log(`send-order-email ${CODE_VERSION} invoked (${req.method})`);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ sent: false, reason: "method_not_allowed" }, 405);
  }

  // ---- 1. Identify the order (browser invoke or database webhook) ---------
  let orderId: number | null = null;
  try {
    const payload = await req.json();
    orderId =
      Number(payload?.record?.id ?? payload?.orderId ?? payload?.id) || null;
  } catch {
    return json({ sent: false, reason: "invalid_payload" }, 400);
  }
  if (!orderId) {
    return json({ sent: false, reason: "missing_order_id" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing");
    return json({ sent: false, reason: "server_misconfigured" });
  }
  const restHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
  };

  // ---- 2. Load the order from the DB (authoritative, never trust caller) --
  let order: OrderRow | null = null;
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/orders?id=eq.${orderId}&select=id,customer_name,phone,address,notes,items,total,email_sent`,
      { headers: restHeaders }
    );
    const rows = await res.json();
    order = Array.isArray(rows) && rows.length ? (rows[0] as OrderRow) : null;
  } catch (err) {
    console.error(`order lookup failed for #${orderId}`, err);
    return json({ sent: false, reason: "order_lookup_failed" });
  }
  if (!order) return json({ sent: false, reason: "order_not_found" });
  if (order.email_sent) {
    console.log(`order #${orderId} already emailed — skipping`);
    return json({ sent: false, reason: "already_sent" });
  }

  // ---- 3. Send the email ---------------------------------------------------
  const host = Deno.env.get("SMTP_HOST");
  const user = Deno.env.get("SMTP_USER");
  const pass = Deno.env.get("SMTP_PASS");
  if (!host || !user || !pass) {
    console.warn("SMTP secrets not configured — set them in Edge Functions → Secrets");
    return json({ sent: false, reason: "smtp_not_configured" });
  }

  const items = parseItems(order.items);
  const total = Number(order.total) ||
    items.reduce((s, it) => s + Number(it.price) * Number(it.qty), 0);

  try {
    const port = Number(Deno.env.get("SMTP_PORT") || 465);
    const client = new SMTPClient({
      connection: {
        hostname: host,
        port,
        // 465 = implicit TLS; ports like 587 use STARTTLS automatically.
        tls: port === 465,
        auth: { username: user, password: pass },
      },
    });

    await client.send({
      from: Deno.env.get("SMTP_FROM") || user,
      to: ORDER_EMAIL_TO,
      subject: `Porosi e re KRIEL #${order.id} — ${order.customer_name}`,
      content: buildText(order, items, total),
      html: buildHtml(order, items, total),
    });
    await client.close();
  } catch (err) {
    console.error(`SMTP send failed for order #${orderId}:`, err);
    return json({ sent: false, reason: "smtp_error", detail: String(err) });
  }

  // ---- 4. Mark the order as emailed ----------------------------------------
  try {
    await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`, {
      method: "PATCH",
      headers: {
        ...restHeaders,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ email_sent: true }),
    });
  } catch (err) {
    console.error(`email_sent flag update failed for #${orderId}`, err);
  }

  console.log(`order #${orderId} emailed to ${ORDER_EMAIL_TO}`);
  return json({ sent: true });
});
