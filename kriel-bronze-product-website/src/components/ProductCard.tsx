"use client";

import { Plus, Star } from "lucide-react";
import { fmtEUR } from "@/lib/constants";
import type { Product } from "@/lib/types";

export default function ProductCard({
  product,
  onOpen,
  featuredBadge,
  index = 0,
}: {
  product: Product;
  onOpen: (p: Product) => void;
  featuredBadge?: boolean;
  index?: number;
}) {
  return (
    <button
      onClick={() => onOpen(product)}
      style={{ animationDelay: `${Math.min(index % 8, 4) * 0.05}s` }}
      className="pop-in group relative overflow-hidden rounded-[18px] border border-line bg-ink-2 text-left transition-all duration-500 hover:border-bronze/50 hover:shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
    >
      <div className="relative aspect-[4/4.5] overflow-hidden bg-[#cfc8bb]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image || "/images/categories/germa.jpg"}
          alt={product.name}
          loading="lazy"
          className="card-img h-full w-full object-cover object-center"
        />
        {featuredBadge && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#ecd9a8] via-bronze to-bronze-2 px-2.5 py-1 text-[9.5px] font-bold tracking-[0.14em] uppercase text-ink">
            <Star size={10} fill="#14110d" /> Të preferuara
          </span>
        )}
        <span className="absolute right-3 bottom-3 w-8 h-8 rounded-full bg-bronze text-ink flex items-center justify-center opacity-0 translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-400">
          <Plus size={15} strokeWidth={2.6} />
        </span>
      </div>
      <div className="px-3.5 sm:px-4 pt-3 pb-3.5">
        <h3 className="font-display text-[16.5px] sm:text-[18px] font-semibold leading-snug text-ivory line-clamp-1">
          {product.name}
        </h3>
        {product.code ? (
          <p className="mt-0.5 text-[10px] sm:text-[10.5px] font-medium tracking-[0.16em] uppercase text-ivory-2/50 truncate">
            {product.code}
          </p>
        ) : null}
        <div className="mt-1.5 flex items-center justify-between">
          {product.variants.length > 1 ? (
            <span className="text-[15px] font-bold tracking-wide text-bronze-grad">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-ivory-2/55 mr-1">Nga</span>
              {fmtEUR(Math.min(...product.variants.map((v) => v.price)))}
            </span>
          ) : (
            <span className="text-[15px] font-bold tracking-wide text-bronze-grad">{fmtEUR(product.price)}</span>
          )}
          <span className="text-[9.5px] tracking-[0.18em] uppercase text-ivory-2/50">ME TVSH</span>
        </div>
      </div>
    </button>
  );
}
