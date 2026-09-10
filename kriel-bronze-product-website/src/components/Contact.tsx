"use client";

import { useState } from "react";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { Reveal, Eyebrow } from "./Reveal";
import { ADDRESS, CONTACT_EMAIL, HOURS, PHONE_DISPLAY, PHONE_TEL, FACEBOOK_URL, INSTAGRAM_URL, waLink } from "@/lib/constants";

const FbIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const IgIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export default function Contact() {
  const [form, setForm] = useState({ name: "", phone: "", msg: "" });

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Përshëndetje KRIEL! Unë jam ${form.name || "—"} (${form.phone || "—"}). ${
      form.msg || "Dëshiroj informacion mbi produktet tuaja."
    }`;
    window.open(waLink(text), "_blank");
  };

  const cards = [
    { icon: Phone, k: "Telefoni", v: PHONE_DISPLAY, href: `tel:${PHONE_TEL}` },
    { icon: Mail, k: "Email", v: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
    { icon: MapPin, k: "Adresa", v: ADDRESS, href: "https://maps.app.goo.gl/VyvyX9iwWCG66DFM7" },
    { icon: Clock, k: "Orari", v: HOURS },
  ];

  return (
    <section id="kontakt" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="text-center">
          <Reveal><Eyebrow>Kontakt</Eyebrow></Reveal>
          <Reveal delay={0.08}>
            <h2 className="mt-4 font-display text-4xl sm:text-[52px] font-medium leading-[1.02] text-ivory">
              Na gjeni <em className="text-bronze-grad not-italic font-semibold">pranë jush</em>
            </h2>
          </Reveal>
          <Reveal delay={0.14}>
            <p className="mx-auto mt-4 max-w-lg text-[14.5px] leading-relaxed text-ivory-2/80 font-light">
              Për çmime, disponueshmëri, modele nga katalogu ynë i plotë ose porosi
              të personalizuara — jemi një telefonatë larg.
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 flex flex-col gap-4">
            {cards.map((c, i) => (
              <Reveal key={c.k} delay={0.1 + i * 0.06}>
                <a
                  href={c.href ?? "#kontakt"}
                  target={c.href?.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className="group flex items-center gap-4 rounded-2xl border border-line bg-ink-2 px-5 py-4 transition-colors hover:border-bronze/45"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-bronze/30 bg-gradient-to-br from-bronze/25 to-transparent text-bronze">
                    <c.icon size={18} strokeWidth={1.9} />
                  </span>
                  <div>
                    <p className="text-[10px] tracking-[0.24em] uppercase text-ivory-2/55">{c.k}</p>
                    <p className="mt-0.5 text-[15px] font-semibold text-ivory group-hover:text-bronze transition-colors">{c.v}</p>
                  </div>
                </a>
              </Reveal>
            ))}
            <Reveal delay={0.35}>
              <div className="flex gap-3">
                <a href={FACEBOOK_URL} aria-label="Facebook" target="_blank" rel="noreferrer" className="flex h-11 w-11 items-center justify-center rounded-xl border border-line text-ivory-2 hover:text-bronze hover:border-bronze/45 transition-colors">
                  <FbIcon />
                </a>
                <a href={INSTAGRAM_URL} aria-label="Instagram" target="_blank" rel="noreferrer" className="flex h-11 w-11 items-center justify-center rounded-xl border border-line text-ivory-2 hover:text-bronze hover:border-bronze/45 transition-colors">
                  <IgIcon />
                </a>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.18} className="lg:col-span-3">
            <form onSubmit={send} className="relative h-full overflow-hidden rounded-[24px] border border-line bg-ink-2 p-6 sm:p-8">
              <span className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-bronze/10 blur-3xl" />
              <h3 className="font-display text-[26px] font-semibold text-ivory">Kërkesë e shpejtë</h3>
              <p className="mt-1 text-[12.5px] text-ivory-2/65 font-light">
                Plotësoni formularin — mesazhi hapet direkt në WhatsApp.
              </p>
              <div className="mt-6 grid sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.2em] uppercase text-ivory-2/60">Emri juaj</span>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="p.sh. Arben Krasniqi"
                    className="w-full rounded-xl border border-line bg-white px-4 py-3 text-[14px] text-slate-900 placeholder:text-slate-400 transition-colors"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.2em] uppercase text-ivory-2/60">Telefoni</span>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="p.sh. 069 12 34 567"
                    className="w-full rounded-xl border border-line bg-white px-4 py-3 text-[14px] text-slate-900 placeholder:text-slate-400 transition-colors"
                  />
                </label>
              </div>
              <label className="mt-4 block">
                <span className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.2em] uppercase text-ivory-2/60">Mesazhi</span>
                <textarea
                  value={form.msg}
                  onChange={(e) => setForm({ ...form, msg: e.target.value })}
                  rows={4}
                  placeholder="Shkruani kërkesën tuaj…"
                  className="w-full rounded-xl border border-line bg-white px-4 py-3 text-[14px] text-slate-900 placeholder:text-slate-400 transition-colors resize-none"
                />
              </label>
              <button
                type="submit"
                className="mt-5 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ecd9a8] via-bronze to-bronze-2 px-8 py-3.5 text-[14px] font-bold text-ink"
              >
                Dërgo në WhatsApp
              </button>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
