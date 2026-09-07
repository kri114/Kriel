import nodemailer from "nodemailer";
import { ORDER_EMAIL_TO } from "./constants";
import type { OrderItemPayload } from "./types";

function buildOrderEmailText(order: {
  id: number;
  customerName: string;
  phone: string;
  address: string;
  notes: string;
  items: OrderItemPayload[];
  total: number;
}): string {
  const lines: string[] = [];
  lines.push(`Porosi e re nga faqja KRIEL — #${order.id}`);
  lines.push("");
  lines.push(`Emri: ${order.customerName}`);
  lines.push(`Telefoni: ${order.phone}`);
  lines.push(`Adresa: ${order.address}`);
  if (order.notes) lines.push(`Shënime: ${order.notes}`);
  lines.push("");
  lines.push("Produktet:");
  for (const it of order.items) {
    lines.push(
      `  • ${it.name}${it.code ? ` (${it.code})` : ""} — sasia: ${it.qty} — € ${it.price.toFixed(2)} / cope`
    );
    if (it.customText) {
      lines.push(`     ↳ Tekst i porositur (gërma): "${it.customText}"`);
    }
  }
  lines.push("");
  lines.push(`Totali: € ${order.total.toFixed(2)}`);
  return lines.join("\n");
}

function buildOrderEmailHtml(order: {
  id: number;
  customerName: string;
  phone: string;
  address: string;
  notes: string;
  items: OrderItemPayload[];
  total: number;
}): string {
  const rows = order.items
    .map(
      (it) => `
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;">${escapeHtml(it.name)}${it.code ? ` <span style="color:#999;font-size:12px;">(${escapeHtml(it.code)})</span>` : ""}${it.customText ? `<br/><span style="color:#a97e42;font-size:12px;">Tekst i porositur: “${escapeHtml(it.customText)}”</span>` : ""}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center;">${it.qty}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right;">€ ${it.price.toFixed(2)}</td>
      </tr>`
    )
    .join("");

  return `
  <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#222;">
    <h2 style="color:#8a6434;">Porosi e re nga faqja KRIEL — #${order.id}</h2>
    <p><strong>Emri:</strong> ${escapeHtml(order.customerName)}<br/>
    <strong>Telefoni:</strong> ${escapeHtml(order.phone)}<br/>
    <strong>Adresa:</strong> ${escapeHtml(order.address)}</p>
    ${order.notes ? `<p><strong>Shënime:</strong> ${escapeHtml(order.notes)}</p>` : ""}
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
    <p style="text-align:right;margin-top:14px;font-size:18px;"><strong>Totali: € ${order.total.toFixed(2)}</strong></p>
  </div>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendOrderEmail(order: {
  id: number;
  customerName: string;
  phone: string;
  address: string;
  notes: string;
  items: OrderItemPayload[];
  total: number;
}): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return false;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || user,
      to: ORDER_EMAIL_TO,
      replyTo: order.phone,
      subject: `Porosi e re KRIEL #${order.id} — ${order.customerName}`,
      text: buildOrderEmailText(order),
      html: buildOrderEmailHtml(order),
    });
    return true;
  } catch (err) {
    console.error("Failed to send order email", err);
    return false;
  }
}
