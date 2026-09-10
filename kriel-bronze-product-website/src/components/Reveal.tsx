"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: "-8% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "reveal-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.32em] uppercase text-bronze">
      <span className="h-px w-8 bg-gradient-to-r from-transparent to-bronze/60" />
      {children}
      <span className="h-px w-8 bg-gradient-to-l from-transparent to-bronze/60" />
    </span>
  );
}

export function Logo({ size = 38 }: { size?: number }) {
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 44 44" className="absolute inset-0 spin-slow" style={{ animationDuration: "60s" }}>
        <circle cx="22" cy="22" r="20.5" fill="none" stroke="url(#lg1)" strokeWidth="1" strokeDasharray="3 5" />
        <defs>
          <linearGradient id="lg1" x1="0" y1="0" x2="44" y2="44">
            <stop stopColor="#ecd9a8" />
            <stop offset="1" stopColor="#96682f" />
          </linearGradient>
        </defs>
      </svg>
      <span
        className="font-display italic"
        style={{
          fontSize: size * 0.55,
          lineHeight: 1,
          background: "linear-gradient(120deg,#ecd9a8,#c9a35c 45%,#8a6434)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        K
      </span>
    </span>
  );
}
