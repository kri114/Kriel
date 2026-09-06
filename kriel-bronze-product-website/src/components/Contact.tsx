import { useState, type FormEvent } from "react";
import { Clock, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { SITE, waLink } from "../data/catalog";
import Reveal from "./Reveal";

const FacebookIcon = ({ size = 17 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = ({ size = 17 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export default function Contact() {
  const [form, setForm] = useState({ name: "", phone: "", msg: "" });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = `Përshëndetje Kriel! Unë jam ${form.name || "—"} (${form.phone || "—"}). ${
      form.msg || "Dëshiroj informacion mbi produktet Caggiati."
    }`;
    window.open(waLink(text), "_blank");
  };

  const info = [
    { icon: Phone, label: "Telefoni", value: SITE.phone, href: SITE.phoneHref },
    { icon: Mail, label: "Email", value: SITE.email, href: `mailto:${SITE.email}` },
    { icon: MapPin, label: "Adresa", value: "Shiko në Google Maps", href: SITE.maps },
    { icon: Clock, label: "Orari", value: SITE.hours, href: undefined },
  ];

  return (
    <section id="kontakt" className="relative border-t border-line py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <Reveal>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.3em] text-bronze/80">
            Kontakt
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-[36px] font-medium leading-[1.06] text-ivory sm:text-[48px]">
            Jemi një <span className="text-bronze-grad">telefonatë</span> larg
          </h2>
          <p className="mt-4 max-w-xl text-[14.5px] font-light leading-relaxed text-ivory-2/75">
            Për çmime, disponueshmëri, modele nga katalogu i plotë 2025 ose porosi të
            personalizuara — jemi një telefonatë larg.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-1">
            {info.map((it, i) => {
              const Inner = (
                <>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-bronze/30 bg-bronze/10 text-bronze">
                    <it.icon size={16} strokeWidth={1.9} />
                  </span>
                  <span>
                    <span className="block text-[9.5px] font-bold uppercase tracking-[0.2em] text-ivory-2/50">
                      {it.label}
                    </span>
                    <span className="mt-1 block text-[14px] font-semibold text-ivory">
                      {it.value}
                    </span>
                  </span>
                </>
              );
              return (
                <Reveal key={it.label} delay={0.08 + i * 0.05}>
                  {it.href ? (
                    <a
                      href={it.href}
                      target={it.href.startsWith("http") ? "_blank" : undefined}
                      rel="noreferrer"
                      className="flex items-center gap-4 rounded-2xl border border-line bg-ink-2/70 p-4 transition-all hover:border-bronze/45"
                    >
                      {Inner}
                    </a>
                  ) : (
                    <div className="flex items-center gap-4 rounded-2xl border border-line bg-ink-2/70 p-4">
                      {Inner}
                    </div>
                  )}
                </Reveal>
              );
            })}

            <Reveal delay={0.3}>
              <div className="flex items-center gap-3">
                {[
                  { Icon: FacebookIcon, label: "Facebook", href: "https://www.facebook.com/" },
                  { Icon: InstagramIcon, label: "Instagram", href: "https://www.instagram.com/" },
                  { Icon: MessageCircle, label: "WhatsApp", href: waLink("Përshëndetje Kriel!") },
                ].map(({ Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-line text-ivory-2 transition-colors hover:border-bronze/45 hover:text-bronze"
                  >
                    <Icon size={17} />
                  </a>
                ))}
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.18} className="lg:col-span-3">
            <form
              onSubmit={submit}
              className="relative h-full overflow-hidden rounded-[24px] border border-line bg-ink-2 p-6 sm:p-8"
            >
              <span className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-bronze/10 blur-3xl" />
              <h3 className="font-display text-[26px] font-semibold text-ivory">Kërkesë e shpejtë</h3>
              <p className="mt-1 text-[12.5px] font-light text-ivory-2/65">
                Plotësoni formularin — mesazhi hapet direkt në WhatsApp.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ivory-2/55">
                    Emri
                  </span>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Emri juaj"
                    className="mt-2 w-full rounded-xl border border-line bg-ink-3/60 px-4 py-3 text-[13.5px] text-ivory transition-colors placeholder:text-ivory-2/35"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ivory-2/55">
                    Telefoni
                  </span>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+355 6X XXX XXXX"
                    className="mt-2 w-full rounded-xl border border-line bg-ink-3/60 px-4 py-3 text-[13.5px] text-ivory transition-colors placeholder:text-ivory-2/35"
                  />
                </label>
              </div>
              <label className="mt-4 block">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ivory-2/55">
                  Mesazhi
                </span>
                <textarea
                  value={form.msg}
                  onChange={(e) => setForm({ ...form, msg: e.target.value })}
                  rows={4}
                  placeholder="Për cilin produkt jeni i interesuar?"
                  className="mt-2 w-full resize-none rounded-xl border border-line bg-ink-3/60 px-4 py-3 text-[13.5px] text-ivory transition-colors placeholder:text-ivory-2/35"
                />
              </label>

              <button
                type="submit"
                className="mt-6 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-bronze py-4 text-[12.5px] font-bold uppercase tracking-[0.18em] text-ink shadow-[0_10px_35px_rgba(201,163,92,0.3)] transition-all hover:shadow-[0_14px_45px_rgba(201,163,92,0.45)] sm:w-auto sm:px-10"
              >
                <Send size={15} strokeWidth={2.4} />
                Dërgo në WhatsApp
              </button>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
