"use client";

import { useState } from "react";
import { Mail, MailWarning, Phone, MapPin, Trash2, Send, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { fmtEUR } from "@/lib/constants";
import { deleteOrder, updateOrderStatus } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";
import type { Order, OrderStatus } from "@/lib/types";

function showError(err: unknown) {
  alert(err instanceof Error ? err.message : "Diçka shkoi keq. Provoni përsëri.");
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  e_re: "E re",
  konfirmuar: "Konfirmuar",
  perfunduar: "Përfunduar",
  anulluar: "Anulluar",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  e_re: "bg-amber-100 text-amber-800",
  konfirmuar: "bg-blue-100 text-blue-800",
  perfunduar: "bg-emerald-100 text-emerald-800",
  anulluar: "bg-slate-200 text-slate-600",
};

export default function OrdersTab({ orders, reload }: { orders: Order[]; reload: () => Promise<void> }) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const testEmail = async () => {
    const target = orders[0];
    if (!target) {
      setTestMsg({ ok: false, text: "Nuk ka ende asnjë porosi për të testuar — bëni së pari një porosi nga faqja." });
      return;
    }
    setTesting(true);
    setTestMsg(null);
    try {
      const { data, error } = await getSupabase().functions.invoke("send-order-email", {
        body: { orderId: target.id },
      });
      if (error) {
        setTestMsg({
          ok: false,
          text: `Funksioni nuk u thirr (${error.message}). Kontrolloni: 1) funksioni "send-order-email" është deploy-uar me kodin më të ri, 2) "Enforce JWT Verification" është OFF në cilësimet e tij, 3) faqja është ribuild-uar në Render.`,
        });
        return;
      }
      const payload = (data ?? {}) as { sent?: boolean; reason?: string; detail?: string };
      if (payload.sent) {
        setTestMsg({ ok: true, text: `Email-i për porosinë #${target.id} u dërgua me sukses. Kontrolloni inbox-in (dhe dosjen Spam).` });
        await reload();
        return;
      }
      const known: Record<string, string> = {
        smtp_not_configured: "SMTP secrets mungojnë — Dashboard → Edge Functions → Secrets: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.",
        order_not_found: `Porosia #${target.id} nuk u gjet në databazë.`,
        already_sent: `Email-i për porosinë #${target.id} ishte dërguar tashmë — kontrolloni inbox-in (dhe Spam).`,
        smtp_error: `Gabim SMTP: ${payload.detail ?? "detajet te Edge Functions → Logs"}`,
        server_misconfigured: "Mungon SUPABASE_URL / SERVICE_ROLE në mjedisin e funksionit.",
      };
      const text = payload.reason && known[payload.reason]
        ? known[payload.reason]
        : `Përgjigje nga funksioni: ${JSON.stringify(payload)}`;
      // "already_sent" do të thotë se mekanizmi funksionon.
      setTestMsg({ ok: payload.reason === "already_sent", text });
    } catch (err) {
      setTestMsg({ ok: false, text: err instanceof Error ? err.message : String(err) });
    } finally {
      setTesting(false);
    }
  };

  const setStatus = async (id: number, status: OrderStatus) => {
    setBusyId(id);
    try {
      await updateOrderStatus(id, status);
      await reload();
    } catch (err) {
      showError(err);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Fshi këtë porosi?")) return;
    setBusyId(id);
    try {
      await deleteOrder(id);
      await reload();
    } catch (err) {
      showError(err);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-slate-800">Njoftimet me email</p>
            <p className="text-[11.5px] text-slate-500">
              Ridërgon njoftimin për porosinë më të re {orders[0] ? `#${orders[0].id}` : "—"} te emaili i dyqanit.
            </p>
          </div>
          <button
            onClick={testEmail}
            disabled={testing || orders.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-[12px] font-semibold text-slate-700 hover:border-amber-400 disabled:opacity-50"
          >
            {testing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            Testo email-in
          </button>
        </div>
        {testMsg && (
          <p className={`mt-3 flex items-start gap-1.5 rounded-xl border px-3 py-2 text-[12px] leading-relaxed ${
            testMsg.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-900"
          }`}>
            {testMsg.ok ? <CheckCircle2 size={14} className="mt-0.5 shrink-0" /> : <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
            {testMsg.text}
          </p>
        )}
      </div>
      {orders.length === 0 && <p className="text-slate-500 text-sm">Ende nuk ka porosi.</p>}
      {orders.map((o) => (
        <div key={o.id} className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-slate-900">Porosia #{o.id}</p>
                <span className={`text-[10.5px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${STATUS_COLOR[o.status]}`}>
                  {STATUS_LABEL[o.status]}
                </span>
                {o.emailSent ? (
                  <span className="inline-flex items-center gap-1 text-[10.5px] text-emerald-700"><Mail size={11} /> Email u dërgua</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10.5px] text-amber-700"><MailWarning size={11} /> Email nuk u dërgua</span>
                )}
              </div>
              <p className="text-[12px] text-slate-400 mt-0.5">{new Date(o.createdAt).toLocaleString("sq-AL")}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={o.status}
                onChange={(e) => setStatus(o.id, e.target.value as OrderStatus)}
                disabled={busyId === o.id}
                className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-[12.5px]"
              >
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <button onClick={() => remove(o.id)} className="text-slate-400 hover:text-red-500">
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          <div className="mt-3 grid sm:grid-cols-3 gap-3 text-[13px] text-slate-700">
            <p className="flex items-center gap-1.5"><strong>{o.customerName}</strong></p>
            <p className="flex items-center gap-1.5"><Phone size={13} className="text-slate-400" /> {o.phone}</p>
            <p className="flex items-center gap-1.5"><MapPin size={13} className="text-slate-400" /> {o.address}</p>
          </div>
          {o.notes && <p className="mt-2 text-[12.5px] text-slate-500 italic">Shënim: {o.notes}</p>}

          <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 divide-y divide-slate-200">
            {o.items.map((it, i) => (
              <div key={i} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-slate-800 truncate">{it.name} {it.code && <span className="text-slate-400 font-normal">({it.code})</span>}</p>
                  {it.customText && <p className="text-[11.5px] text-amber-700">Tekst: &ldquo;{it.customText}&rdquo;</p>}
                </div>
                <p className="text-[13px] text-slate-600 shrink-0">x{it.qty} · {fmtEUR(it.price * it.qty)}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-right font-bold text-slate-900">Totali: {fmtEUR(o.total)}</p>
        </div>
      ))}
    </div>
  );
}
