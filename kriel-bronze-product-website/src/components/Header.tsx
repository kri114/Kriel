"use client";

import { useEffect, useState } from "react";
import { Phone, Menu, X, ShoppingBag } from "lucide-react";
import { Logo } from "./Reveal";
import { PHONE_DISPLAY, PHONE_TEL } from "@/lib/constants";
import { useCart } from "./CartContext";

const LINKS = [
  { href: "#kreu", label: "Kreu" },
  { href: "#kategorite", label: "Kategoritë" },
  { href: "#katalogu", label: "Katalogu" },
  { href: "#mjeshtria", label: "Mjeshtëria" },
  { href: "#rreth", label: "Rreth nesh" },
  { href: "#kontakt", label: "Kontakt" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { count, openCart } = useCart();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled ? "bg-ink/85 backdrop-blur-xl border-b border-line" : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="#kreu" className="flex items-center gap-3">
            <Logo size={36} />
            <span className="leading-none">
              <span className="block font-display text-[22px] font-semibold tracking-[0.18em] text-ivory">KRIEL</span>
              <span className="block text-[8.5px] tracking-[0.42em] uppercase text-bronze/90 mt-0.5">Arti i Bronzit</span>
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-8">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-[12.5px] font-medium tracking-[0.14em] uppercase text-ivory-2/80 hover:text-bronze transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${PHONE_TEL}`}
              className="hidden sm:inline-flex items-center gap-2 rounded-full border border-bronze/40 px-4 py-2 text-[12px] font-semibold tracking-wide text-bronze hover:bg-bronze hover:text-ink transition-all duration-300"
            >
              <Phone size={14} strokeWidth={2.2} />
              {PHONE_DISPLAY}
            </a>
            <button
              onClick={openCart}
              className="relative inline-flex items-center justify-center w-10 h-10 rounded-full border border-line text-ivory-2 hover:text-bronze hover:border-bronze/50 transition-colors"
              aria-label="Hap shportën"
            >
              <ShoppingBag size={18} />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-bronze px-1 text-[10px] font-bold text-ink">
                  {count}
                </span>
              )}
            </button>
            <button
              onClick={() => setOpen(true)}
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-full border border-line text-ivory-2 hover:text-bronze hover:border-bronze/50 transition-colors"
              aria-label="Hap menynë"
            >
              <Menu size={19} />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[70] bg-ink/97 backdrop-blur-2xl flex flex-col fade-in">
          <div className="flex items-center justify-between px-5 h-16">
            <div className="flex items-center gap-3">
              <Logo size={32} />
              <span className="font-display text-xl tracking-[0.18em] text-ivory">KRIEL</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-10 h-10 rounded-full border border-line inline-flex items-center justify-center text-ivory-2"
              aria-label="Mbyll menynë"
            >
              <X size={19} />
            </button>
          </div>
          <nav className="flex-1 flex flex-col justify-center px-8 gap-1">
            {LINKS.map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="group flex items-baseline gap-4 py-3.5 border-b border-line/60"
              >
                <span className="text-[11px] font-semibold tracking-[0.3em] text-bronze/70">0{i + 1}</span>
                <span className="font-display text-[34px] font-medium text-ivory group-hover:text-bronze transition-colors">
                  {l.label}
                </span>
              </a>
            ))}
          </nav>
          <div className="px-8 pb-10">
            <a
              href={`tel:${PHONE_TEL}`}
              className="flex items-center justify-center gap-2.5 w-full rounded-full bg-gradient-to-r from-[#ecd9a8] via-bronze to-bronze-2 py-4 text-ink font-bold text-[15px] tracking-wide"
            >
              <Phone size={17} strokeWidth={2.4} />
              Na telefononi tani
            </a>
            <p className="text-center text-[11px] tracking-[0.28em] uppercase text-ivory-2/50 mt-5">
              Krijime origjinale në bronz · Punuar me pasion
            </p>
          </div>
        </div>
      )}
    </>
  );
}
