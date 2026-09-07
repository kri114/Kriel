// ============================================================================
// KRIEL — order email notification (OPTIONAL)
//
// Supabase Edge Function (Deno). Triggered by a Database Webhook on
// `orders` INSERT. Sends the new-order email to the shop and marks
// orders.email_sent = true (via the service role key, which stays server-side).
//
// Secrets (set with `supabase secrets set ...` — NEVER commit them):
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.
//
// See RENDER.md — step 5 for the full setup instructions.
// ============================================================================

import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const ORDER_EMAIL_TO = "infokrielshpk@kriel.com";

type OrderItem = {
  productId: number;
  name: string;
  code: string;
  price: number;
  qty: number;
  customText: string;
};

type OrderRecord = {
  id: number;
  customer_name: string;
  phone: string;
  address: string;
  notes: string;
  items: OrderItem[];
  total: number | string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildText(o: OrderRecord, items: OrderItem[], total: number): string {
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

function buildHtml(o: OrderRecord, items: OrderItem[], total: number): string {
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

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let record: OrderRecord;
  try {
    const payload = await req.json();
    if (payload?.type !== "INSERT" || payload?.table !== "orders") {
      return Response.json({ skipped: true });
    }
    record = payload.record as OrderRecord;
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }

  const host = Deno.env.get("SMTP_HOST");
  const user = Deno.env.get("SMTP_USER");
  const pass = Deno.env.get("SMTP_PASS");
  if (!host || !user || !pass) {
    console.warn("SMTP not configured — skipping email");
    return Response.json({ sent: false, reason: "smtp_not_configured" });
  }

  const items = Array.isArray(record.items) ? record.items : [];
  const total = items.reduce((s, it) => s + Number(it.price) * Number(it.qty), 0);

  try {
    const client = new SmtpClient();
    const port = Number(Deno.env.get("SMTP_PORT") || 587);
    if (port === 465) {
      await client.connectTLS({ hostname: host, port, username: user, password: pass });
    } else {
      await client.connect({ hostname: host, port, username: user, password: pass });
    }

    await client.send({
      from: Deno.env.get("SMTP_FROM") || user,
      to: ORDER_EMAIL_TO,
      subject: `Porosi e re KRIEL #${record.id} — ${record.customer_name}`,
      content: buildText(record, items, total),
      html: buildHtml(record, items, total),
    });
    await client.close();

    // Mark the order as emailed (service role stays server-side).
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${record.id}`, {
      method: "PATCH",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ email_sent: true }),
    });

    return Response.json({ sent: true });
  } catch (err) {
    console.error("Failed to send order email", err);
    return Response.json({ sent: false, error: String(err) }, { status: 500 });
  }
});

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { users } from './drizzle/schema'

const connectionString = process.env.DATABASE_URL

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false })
const db = drizzle(client);

const allUsers = await db.select().from(users);
