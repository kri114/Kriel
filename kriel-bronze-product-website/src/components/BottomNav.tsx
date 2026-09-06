import { useEffect, useState } from "react";
import { Home, Grid3X3, BookOpen, Phone } from "lucide-react";

const ITEMS = [
  { href: "#kreu", label: "Kreu", icon: Home, id: "kreu" },
  { href: "#kategorite", label: "Kategoritë", icon: Grid3X3, id: "kategorite" },
  { href: "#katalogu", label: "Katalogu", icon: BookOpen, id: "katalogu" },
  { href: "#kontakt", label: "Kontakt", icon: Phone, id: "kontakt" },
];

export default function BottomNav() {
  const [active, setActive] = useState("kreu");

  useEffect(() => {
    const secs = ITEMS.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    secs.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-[60] px-4 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-md rounded-full border border-bronze/25 bg-ink/88 backdrop-blur-xl shadow-[0_-8px_40px_rgba(0,0,0,0.5)] px-2 py-2 flex justify-between">
        {ITEMS.map((it) => {
          const is = active === it.id;
          return (
            <a
              key={it.id}
              href={it.href}
              className={`flex flex-col items-center gap-0.5 rounded-full px-4 py-1.5 transition-all duration-300 ${
                is ? "bg-gradient-to-b from-bronze/30 to-transparent text-bronze" : "text-ivory-2/65"
              }`}
            >
              <it.icon size={17} strokeWidth={is ? 2.2 : 1.7} />
              <span className="text-[9px] font-bold tracking-[0.12em] uppercase">{it.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
