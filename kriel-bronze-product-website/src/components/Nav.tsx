import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Phone, X } from "lucide-react";
import { SITE } from "../data/catalog";

const LINKS = [
  { href: "#kreu", label: "Kreu" },
  { href: "#kategorite", label: "Kategoritë" },
  { href: "#katalogu", label: "Katalogu" },
  { href: "#mjeshtria", label: "Mjeshtëria" },
  { href: "#rreth", label: "Rreth nesh" },
  { href: "#kontakt", label: "Kontakt" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled ? "bg-ink/85 backdrop-blur-xl border-b border-line" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6">
          <a href="#kreu" className="flex items-center gap-2.5">
            <span
              className="font-display italic leading-none"
              style={{
                fontSize: 32,
                background: "linear-gradient(120deg,#ecd9a8,#c9a35c 45%,#8a6434)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              K
            </span>
            <span className="text-[13px] font-extrabold tracking-[0.34em] uppercase text-ivory">
              Kriel
            </span>
            <span className="hidden text-[9px] font-semibold tracking-[0.2em] uppercase text-ivory-2/50 sm:block">
              · Caggiati Italia
            </span>
          </a>

          <nav className="hidden items-center gap-7 lg:flex">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-[11.5px] font-semibold tracking-[0.14em] uppercase text-ivory-2/70 transition-colors hover:text-bronze"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={SITE.phoneHref}
              className="hidden items-center gap-2 rounded-full border border-bronze/40 bg-bronze/10 px-4 py-2 text-[11px] font-bold tracking-[0.12em] uppercase text-bronze transition-all hover:bg-bronze hover:text-ink hover:shadow-[0_10px_35px_rgba(201,163,92,0.3)] sm:inline-flex"
            >
              <Phone size={13} strokeWidth={2.4} />
              {SITE.phone}
            </a>
            <button
              onClick={() => setOpen(true)}
              aria-label="Hap menynë"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ivory-2 transition-colors hover:border-bronze/50 hover:text-bronze lg:hidden"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-ink/96 backdrop-blur-2xl lg:hidden"
          >
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-[13px] font-extrabold tracking-[0.34em] uppercase text-ivory">
                Kriel
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Mbyll menynë"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ivory-2 hover:text-bronze"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="mt-8 flex flex-col items-center gap-2 px-8">
              {LINKS.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full border-b border-line/60 py-4 text-center font-display text-[30px] font-medium text-ivory transition-colors hover:text-bronze"
                >
                  {l.label}
                </motion.a>
              ))}
              <motion.a
                href={SITE.phoneHref}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-bronze px-6 py-3 text-[12px] font-bold tracking-[0.14em] uppercase text-ink shadow-[0_10px_35px_rgba(201,163,92,0.3)]"
              >
                <Phone size={14} strokeWidth={2.4} /> {SITE.phone}
              </motion.a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
