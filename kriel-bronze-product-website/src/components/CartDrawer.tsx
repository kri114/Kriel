"use client";

import { useState } from "react";
import { X, Minus, Plus, Trash2, ShoppingBag, MessageCircle, CheckCircle2, Loader2 } from "lucide-react";
import { fmtEUR, waLink } from "@/lib/constants";
import { createOrder } from "@/lib/store";
import { isBackendConfigured } from "@/lib/supabase";
import { useCart } from "./CartContext";

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQty, updateCustomText, removeItem, clear, total } = useCart();
  const [step, setStep] = useState<"cart" | "checkout" | "success">("cart");
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [lastOrderId, setLastOrderId] = useState<number | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  if (!isOpen) return null;

  const close = () => {
    closeCart();
    window.setTimeout(() => {
      if (step === "success") setStep("cart");
    }, 300);
  };

  const submitOrder = async () => {
    setError("");
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setError("Ju lutem plotësoni emrin, telefonin dhe adresën.");
      return;
    }
    setSubmitting(true);
    try {
      if (!isBackendConfigured()) {
        setError("Porositë online nuk janë të konfiguruara ende. Ju lutem porosisni direkt në WhatsApp.");
        setSubmitting(false);
        return;
      }
      const data = await createOrder({
        customerName: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        notes: form.notes.trim(),
        items: items.map((it) => ({
          productId: it.productId,
          name: it.name,
          code: it.code,
          price: it.price,
          qty: it.qty,
          customText: it.customText,
          size: it.size,
          color: it.color,
        })),
      });
      setLastOrderId(data.order?.id ?? null);
      setEmailSent(Boolean(data.emailSent));
      setStep("success");
      clear();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Diçka shkoi keq. Provoni përsëri.");
    } finally {
      setSubmitting(false);
    }
  };

  const waFullOrderText = () => {
    const lines = [`Përshëndetje KRIEL! Dëshiroj të porosit:`];
    items.forEach((it) => {
      lines.push(
        `• ${it.name}${it.code ? ` (${it.code})` : ""} x${it.qty} — ${fmtEUR(it.price * it.qty)}${
          it.customText ? ` — tekst: "${it.customText}"` : ""
        }${it.size ? ` — madhësia: "${it.size}"` : ""}${it.color ? ` — ngjyra: "${it.color}"` : ""}`
      );
    });
    lines.push(`Totali: ${fmtEUR(total)}`);
    return lines.join("\n");
  };

  return (
    <>
      <div onClick={close} className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm fade-in" />
      <div className="sheet-shadow sheet-up fixed inset-y-0 right-0 z-[95] w-full sm:w-[420px] bg-ink-2 border-l border-bronze/25 flex flex-col">
        <div className="flex items-center justify-between px-5 h-16 border-b border-line shrink-0">
          <h3 className="font-display text-[22px] font-semibold text-ivory flex items-center gap-2">
            <ShoppingBag size={18} className="text-bronze" />
            {step === "checkout" ? "Detajet e porosisë" : step === "success" ? "Faleminderit!" : "Shporta juaj"}
          </h3>
          <button
            onClick={close}
            className="w-9 h-9 rounded-full border border-line flex items-center justify-center text-ivory-2 hover:text-bronze"
            aria-label="Mbyll"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {step === "cart" && (
            <div className="p-5 flex flex-col gap-4">
              {items.length === 0 && (
                <div className="py-16 text-center text-ivory-2/60">
                  <ShoppingBag size={30} className="mx-auto text-bronze/50 mb-3" />
                  <p className="text-[14px]">Shporta juaj është bosh.</p>
                </div>
              )}
              {items.map((it) => (
                <div key={`${it.productId}-${it.customText}-${it.size}-${it.color}`} className="flex gap-3 rounded-2xl border border-line bg-ink-3/40 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.image || "/images/categories/germa.jpg"} alt={it.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold text-ivory truncate">{it.name}</p>
                    {it.code && <p className="text-[10px] uppercase tracking-wide text-ivory-2/50">{it.code}</p>}
                    {(it.size || it.color) && (
                      <p className="mt-0.5 text-[10.5px] text-ivory-2/60">
                        {it.size && <>Madhësia: <span className="text-bronze/90">{it.size}</span></>}
                        {it.size && it.color && " · "}
                        {it.color && <>Ngjyra: <span className="text-bronze/90">{it.color}</span></>}
                      </p>
                    )}
                    {it.customText && (
                      <div className="mt-1">
                        <label className="text-[9.5px] uppercase tracking-wide text-bronze/80">Teksti i porositur</label>
                        <input
                          value={it.customText}
                          onChange={(e) => updateCustomText(it, e.target.value)}
                          className="mt-0.5 w-full rounded-lg border border-line bg-ink-2 px-2 py-1 text-[12px] text-ivory"
                        />
                      </div>
                    )}
                    <div className="mt-1.5 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full border border-line overflow-hidden">
                        <button onClick={() => updateQty(it, it.qty - 1)} className="w-6 h-6 flex items-center justify-center text-ivory-2 hover:text-bronze">
                          <Minus size={11} />
                        </button>
                        <span className="w-6 text-center text-[12px] text-ivory">{it.qty}</span>
                        <button onClick={() => updateQty(it, it.qty + 1)} className="w-6 h-6 flex items-center justify-center text-ivory-2 hover:text-bronze">
                          <Plus size={11} />
                        </button>
                      </div>
                      <span className="text-[13px] font-bold text-bronze-grad">{fmtEUR(it.price * it.qty)}</span>
                    </div>
                  </div>
                  <button onClick={() => removeItem(it)} className="text-ivory-2/40 hover:text-red-400 shrink-0" aria-label="Hiq">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {step === "checkout" && (
            <div className="p-5 flex flex-col gap-4">
              <p className="text-[12.5px] text-ivory-2/70 leading-relaxed">
                Plotësoni të dhënat tuaja — porosia dërgohet automatikisht te KRIEL.
              </p>
              <Field label="Emri i plotë *">
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="p.sh. Arben Krasniqi"
                  className="w-full rounded-xl border border-line bg-ink-3/60 px-4 py-3 text-[14px] text-ivory placeholder:text-ivory-2/35"
                />
              </Field>
              <Field label="Telefoni *">
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="p.sh. 069 12 34 567"
                  className="w-full rounded-xl border border-line bg-ink-3/60 px-4 py-3 text-[14px] text-ivory placeholder:text-ivory-2/35"
                />
              </Field>
              <Field label="Adresa e dorëzimit *">
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Rruga, qyteti, kodi postar…"
                  rows={3}
                  className="w-full rounded-xl border border-line bg-ink-3/60 px-4 py-3 text-[14px] text-ivory placeholder:text-ivory-2/35 resize-none"
                />
              </Field>
              <Field label="Shënime shtesë (opsionale)">
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Ndonjë kërkesë e veçantë…"
                  rows={2}
                  className="w-full rounded-xl border border-line bg-ink-3/60 px-4 py-3 text-[14px] text-ivory placeholder:text-ivory-2/35 resize-none"
                />
              </Field>

              <div className="rounded-2xl border border-line bg-ink-3/40 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-ivory-2/60 mb-2">Përmbledhje</p>
                {items.map((it) => (
                  <div key={`${it.productId}-${it.customText}-${it.size}-${it.color}`} className="flex justify-between text-[12.5px] text-ivory-2/80 py-0.5">
                    <span className="truncate pr-2">
                      {it.name} x{it.qty}
                      {(it.size || it.color) && (
                        <span className="text-ivory-2/55"> ({[it.size, it.color].filter(Boolean).join(" · ")})</span>
                      )}
                    </span>
                    <span className="shrink-0">{fmtEUR(it.price * it.qty)}</span>
                  </div>
                ))}
                <div className="mt-2 pt-2 border-t border-line flex justify-between font-bold text-bronze-grad text-[15px]">
                  <span>Totali</span>
                  <span>{fmtEUR(total)}</span>
                </div>
              </div>

              {error && <p className="text-[12.5px] text-red-400">{error}</p>}
            </div>
          )}

          {step === "success" && (
            <div className="p-8 flex flex-col items-center text-center gap-3">
              <CheckCircle2 size={44} className="text-bronze" />
              <h4 className="font-display text-2xl text-ivory">Porosia u regjistrua!</h4>
              <p className="text-[13px] text-ivory-2/75 leading-relaxed">
                {lastOrderId ? `Numri i porosisë: #${lastOrderId}. ` : ""}
                {emailSent
                  ? "Ju dërguam email-in me detajet e porosisë. Do t'ju kontaktojmë së shpejti për konfirmim."
                  : "E ruajtëm porosinë tuaj. Do t'ju kontaktojmë së shpejti për konfirmim — mund të na shkruani edhe në WhatsApp për siguri."}
              </p>
              <a
                href={waLink(`Përshëndetje KRIEL! Sapo bëra një porosi #${lastOrderId ?? ""} nga faqja. Ju lutem konfirmoni.`)}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ecd9a8] via-bronze to-bronze-2 px-6 py-3 text-[13px] font-bold text-ink"
              >
                <MessageCircle size={15} /> Konfirmo në WhatsApp
              </a>
              <button onClick={close} className="mt-1 text-[12.5px] text-ivory-2/60 underline underline-offset-4">
                Mbyll
              </button>
            </div>
          )}
        </div>

        {step !== "success" && items.length > 0 && (
          <div className="shrink-0 border-t border-line p-5 space-y-3">
            <div className="flex items-center justify-between text-[14px]">
              <span className="text-ivory-2/70">Totali</span>
              <span className="font-display text-[22px] font-bold text-bronze-grad">{fmtEUR(total)}</span>
            </div>
            {step === "cart" ? (
              <button
                onClick={() => setStep("checkout")}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ecd9a8] via-bronze to-bronze-2 py-3.5 text-[14px] font-bold text-ink"
              >
                Vazhdo me porosinë
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={submitOrder}
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ecd9a8] via-bronze to-bronze-2 py-3.5 text-[14px] font-bold text-ink disabled:opacity-60"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  Dërgo porosinë
                </button>
                <a
                  href={waLink(waFullOrderText())}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-bronze/45 py-3 text-[13px] font-bold text-bronze hover:bg-bronze/10"
                >
                  <MessageCircle size={15} /> Ose porosit direkt në WhatsApp
                </a>
                <button onClick={() => setStep("cart")} className="text-[12px] text-ivory-2/60 underline underline-offset-4 self-center">
                  Kthehu te shporta
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.2em] uppercase text-ivory-2/60">{label}</span>
      {children}
    </label>
  );
}
