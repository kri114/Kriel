"use client";

import { useState } from "react";
import { Mail, MailWarning, Phone, MapPin, Trash2, Send, Loader2 } from "lucide-react";
import { fmtEUR } from "@/lib/constants";
import { deleteOrder, sendTestOrderEmail, updateOrderStatus } from "@/lib/store";
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
  anulluar: "bg-slate-200 text-slate-700",
};

export default function OrdersTab({ orders, reload }: { orders: Order[]; reload: () => Promise<void> }) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);

  const testEmail = async (id: number) => {
    setTestingId(id);
    try {
      const result = await sendTestOrderEmail(id);
      if (result.sent) {
        alert(`Email u dërgua me sukses për porosinë #${id}! Kontrolloni kutinë postare (dhe folderin Spam).`);
      } else {
        alert(
          `Email NUK u dërgua për porosinë #${id}.\n\nArsyeja: ${result.error || result.reason || "e panjohur"}\n\nPër më shumë detaje, kontrolloni Supabase Dashboard → Edge Functions → send-order-email → Logs.`
        );
      }
      await reload();
    } catch (err) {
      showError(err);
    } finally {
      setTestingId(null);
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
                  <span className="inline-flex items-center gap-1 text-[10.5px] text-amber-700"><MailWarning size={11} /> Email jo i konfiguruar</span>
                )}
              </div>
              <p className="text-[12px] text-slate-500 mt-0.5">{new Date(o.createdAt).toLocaleString("sq-AL")}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={o.status}
                onChange={(e) => setStatus(o.id, e.target.value as OrderStatus)}
                disabled={busyId === o.id}
                className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-[12.5px] text-slate-900 bg-white"
              >
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <button
                onClick={() => testEmail(o.id)}
                disabled={testingId === o.id}
                title="Test Email"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 hover:border-amber-400 hover:text-amber-700 disabled:opacity-50"
              >
                {testingId === o.id ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                Test Email
              </button>
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
                  <p className="text-[13px] font-medium text-slate-800 truncate">{it.name} {it.code && <span className="text-slate-500 font-normal">({it.code})</span>}</p>
                  {(it.color || it.size) && (
                    <p className="text-[11.5px] text-indigo-700">{[it.color, it.size].filter(Boolean).join(" · ")}</p>
                  )}
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
