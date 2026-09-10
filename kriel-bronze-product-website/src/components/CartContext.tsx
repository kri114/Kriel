"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem, Product } from "@/lib/types";

type AddItemOptions = {
  qty?: number;
  customText?: string;
  color?: string;
  size?: string;
  /** Resolved price for the selected color/size combination, if different from product.price. */
  price?: number;
};

type CartContextValue = {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, opts?: AddItemOptions) => void;
  updateQty: (key: string, qty: number) => void;
  updateCustomText: (key: string, text: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  count: number;
  total: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "kriel-cart-v1";

function makeCartKey(productId: number, color: string, size: string, customText: string): string {
  return `${productId}::${color}::${size}::${customText}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CartItem>[];
        // Backfill items saved before variants existed (no key/color/size).
        const migrated: CartItem[] = parsed.map((it) => {
          const color = it.color ?? "";
          const size = it.size ?? "";
          const customText = it.customText ?? "";
          return {
            key: it.key ?? makeCartKey(it.productId ?? 0, color, size, customText),
            productId: it.productId ?? 0,
            name: it.name ?? "",
            code: it.code ?? "",
            price: it.price ?? 0,
            image: it.image ?? "",
            color,
            size,
            qty: it.qty ?? 1,
            customText,
          };
        });
        setItems(migrated);
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, hydrated]);

  const addItem = useCallback((product: Product, opts?: AddItemOptions) => {
    setItems((prev) => {
      const qty = opts?.qty ?? 1;
      const customText = opts?.customText ?? "";
      const color = opts?.color ?? "";
      const size = opts?.size ?? "";
      const price = opts?.price ?? product.price;
      const key = makeCartKey(product.id, color, size, customText);
      const idx = prev.findIndex((it) => it.key === key);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      return [
        ...prev,
        {
          key,
          productId: product.id,
          name: product.name,
          code: product.code,
          price,
          image: product.image,
          color,
          size,
          qty,
          customText,
        },
      ];
    });
    setIsOpen(true);
  }, []);

  const updateQty = useCallback((key: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((it) => (it.key === key ? { ...it, qty: Math.max(1, qty) } : it))
        .filter((it) => it.qty > 0)
    );
  }, []);

  const updateCustomText = useCallback((key: string, text: string) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, customText: text } : it)));
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((sum, it) => sum + it.qty, 0), [items]);
  const total = useMemo(() => items.reduce((sum, it) => sum + it.qty * it.price, 0), [items]);

  const value: CartContextValue = {
    items,
    isOpen,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    addItem,
    updateQty,
    updateCustomText,
    removeItem,
    clear,
    count,
    total,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
