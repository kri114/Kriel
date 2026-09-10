// ============================================================================
// KRIEL — order email notification (OPTIONAL)
//
// Supabase Edge Function (Deno). Can be invoked two ways:
//
//   1) Database Webhook on `orders` INSERT (server-to-server, no browser):
//      payload = { type: "INSERT", table: "orders", record: { ...full row } }
//
//   2) Manually from the admin panel's "Test Email" button (browser, via
//      supabase-js `functions.invoke`):
//      payload = { orderId: number }
//      -> the function looks the order up itself via the service role key.
//
// Sends the new-order email via the Resend HTTP API and marks
// orders.email_sent = true (using the service role key, which stays
// server-side and is never exposed to the browser).
//
// WHY RESEND (HTTP API) INSTEAD OF RAW SMTP:
// Supabase Edge Functions run on a Deno-based edge runtime that — like all
// edge/serverless runtimes of this kind — does NOT allow outbound raw TCP
// socket connections on SMTP ports (25/465/587). This is a permanent
// platform restriction: https://github.com/supabase/supabase/issues/6255
// Any function that tries to speak SMTP directly (Deno.connect/connectTLS,
// or libraries like denomailer/deno.land/x/smtp) will fail every time, no
// matter how correctly SMTP_HOST/USER/PASS are set. Resend works over
// plain HTTPS instead, which Edge Functions support fine.
//
// WHY CORS HANDLING MATTERS HERE:
// Database Webhooks call this function server-to-server, so CORS never
// applies to them. But the admin panel's "Test Email" button calls this
// function directly FROM THE BROWSER via supabase-js. Browsers always send
// a CORS preflight (OPTIONS) request first; if the function doesn't answer
// it with the right headers, the browser blocks the real request and
// supabase-js reports a generic, misleading
// "Failed to send a request to the Edge Function" error — even though the
// function itself is deployed correctly and would work fine for webhooks.
// This file handles OPTIONS and sends CORS headers on every response to
// fix exactly that.
//
// Secrets (Dashboard: Edge Functions -> send-order-email -> Secrets, or
// `supabase secrets set ...` — NEVER commit them):
//   RESEND_API_KEY   - from https://resend.com/api-keys
//   RESEND_FROM      - optional, defaults to "KRIEL <onboarding@resend.dev>"
//                       (the shared Resend test sender — works immediately,
//                       but can only deliver to the email you signed up
//                       with in Resend until you verify your own domain)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.
//
// Function setting required: Edge Functions -> send-order-email -> Settings
// -> "Enforce JWT Verification" = OFF (Database Webhooks cannot send a
// Supabase user JWT, so this must be off for the webhook path to work).
//
// See RENDER.md — step 5 for the full setup instructions.
// ============================================================================

// Version marker — logged on every invocation. If your Logs tab does NOT
// show a line starting with "[send-order-email vRESEND-3]" for a fresh
// order/test, then Supabase is running DIFFERENT code than this file —
// re-copy this entire file into the Dashboard editor and Deploy again.
const FUNCTION_VERSION = "vRESEND-3";

const ORDER_EMAIL_TO = "infokrielshpk@gmail.com";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
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

async function fetchOrderById(orderId: number): Promise<OrderRecord | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const res = await fetch(
    `${supabaseUrl}/rest/v1/orders?id=eq.${orderId}&select=*`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  );
  if (!res.ok) {
    console.error(
      `send-order-email: failed to look up order #${orderId} (${res.status})`,
      await res.text()
    );
    return null;
  }
  const rows = (await res.json()) as OrderRecord[];
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

Deno.serve(async (req) => {
  // Browsers send this before the real POST when calling from the admin
  // panel — must be answered with CORS headers or supabase-js will report
  // a generic "Failed to send a request to the Edge Function" error.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  console.log(`[send-order-email ${FUNCTION_VERSION}] invoked`);

  if (req.method !== "POST") {
    return json({ sent: false, reason: "method_not_allowed" }, { status: 405 });
  }

  let body: {
    type?: string;
    table?: string;
    record?: OrderRecord;
    orderId?: number;
  };
  try {
    body = await req.json();
  } catch {
    return json({ sent: false, reason: "invalid_json" }, { status: 400 });
  }

  let record: OrderRecord | null = null;

  if (typeof body.orderId === "number") {
    // Manual invocation, e.g. the admin panel's "Test Email" button.
    record = await fetchOrderById(body.orderId);
    if (!record) {
      console.warn(
        `send-order-email: no order found with id=${body.orderId}. ` +
          "Use an order id that is actually visible in the admin panel's " +
          "Orders tab (real orders only — ids from a webhook 'Send test " +
          "event' payload do not exist in the database)."
      );
      return json({ sent: false, reason: "order_not_found", orderId: body.orderId });
    }
  } else if (body.type === "INSERT" && body.table === "orders" && body.record) {
    // Database Webhook delivery.
    record = body.record;
  } else {
    console.warn(
      "send-order-email: received a payload that is neither {orderId} nor " +
        "an orders INSERT webhook. Raw payload: " + JSON.stringify(body)
    );
    return json({ sent: false, reason: "unrecognized_payload" });
  }

  if (!record || typeof record.id !== "number") {
    console.error(
      "send-order-email: resolved order record has no numeric id. Raw: " +
        JSON.stringify(record)
    );
    return json({ sent: false, reason: "missing_order_id" });
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY not configured — skipping email");
    return json({ sent: false, reason: "resend_not_configured" });
  }
  const from = Deno.env.get("RESEND_FROM") || "KRIEL <onboarding@resend.dev>";

  const items = Array.isArray(record.items) ? record.items : [];
  const total = items.reduce((s, it) => s + Number(it.price) * Number(it.qty), 0);

  try {
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: ORDER_EMAIL_TO,
        subject: `Porosi e re KRIEL #${record.id} — ${record.customer_name}`,
        text: buildText(record, items, total),
        html: buildHtml(record, items, total),
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      // The #1 cause of silent failures here: the shared "onboarding@resend.dev"
      // test sender can ONLY deliver to the email address that owns the
      // Resend account itself — sending to any OTHER address always returns
      // this 403, even with a perfectly valid API key.
      //
      // Since ORDER_EMAIL_TO is a plain Gmail address (not a domain you
      // control the DNS for), the simplest permanent fix is: sign up for
      // Resend using infokrielshpk@gmail.com as the Resend ACCOUNT email
      // itself (resend.com/signup). Once that's the account's own address,
      // the default "onboarding@resend.dev" sender can deliver to it with
      // zero domain/DNS setup required. See RENDER.md section 5.
      if (resendRes.status === 403 && /own email address/i.test(errBody)) {
        console.error(
          "Resend 403: 'onboarding@resend.dev' can only deliver to the Resend " +
            "account's own email address. Sign up (or log in) at resend.com " +
            `using ${ORDER_EMAIL_TO} as the account email so it becomes the ` +
            "allowed recipient — no domain verification needed. " +
            `Raw response: ${errBody}`
        );
      } else {
        console.error("Resend API error", resendRes.status, errBody);
      }
      return json({ sent: false, reason: "resend_error", error: errBody });
    }

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

    return json({ sent: true });
  } catch (err) {
    console.error("Failed to send order email", err);
    return json({ sent: false, reason: "unexpected_error", error: String(err) });
  }
});
