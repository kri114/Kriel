import { useState } from "react";
import { Gem } from "lucide-react";

/**
 * Tries the real photo first; if it is missing (the live deploy
 * currently 404s on /products/...), renders a calm bronze tile
 * with the product code — never a broken-image icon.
 */
export default function ProductImage({
  src,
  alt,
  code,
  className = "",
  imgClassName = "",
}: {
  src: string;
  alt: string;
  code?: string;
  className?: string;
  imgClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden ${className}`}
        style={{
          background:
            "radial-gradient(120% 120% at 30% 15%, #2e2519 0%, #1b1712 55%, #14110d 100%)",
        }}
      >
        <div className="spin-slow absolute h-[150%] w-[150%] rounded-full border border-bronze/10" />
        <div className="absolute h-[75%] w-[75%] rounded-full border border-bronze/15" />
        <Gem className="relative text-bronze/45" size={30} strokeWidth={1.2} />
        <span className="relative mt-2 px-3 text-center font-display text-[13px] italic tracking-wide text-ivory-2/55 line-clamp-2">
          {alt}
        </span>
        {code ? (
          <span className="absolute bottom-2.5 text-[8.5px] font-bold tracking-[0.22em] text-bronze/50 uppercase">
            {code}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`h-full w-full bg-[#cfc8bb] ${className}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`h-full w-full object-contain object-center ${imgClassName}`}
      />
    </div>
  );
}
