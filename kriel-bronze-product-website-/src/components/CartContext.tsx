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

type AddOptions = { qty?: number; customText?: string; size?: string; color?: string; price?: number };

type CartContextValue = {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, opts?: AddOptions) => void;
  updateQty: (item: CartItem, qty: number) => void;
  updateCustomText: (item: CartItem, text: string) => void;
  removeItem: (item: CartItem) => void;
  clear: () => void;
  count: number;
  total: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "kriel-cart-v2";

/** Two cart lines are the same line only when product + all variants match. */
function sameLine(a: CartItem, ref: { productId: number; customText: string; size: string; color: string }): boolean {
  return (
    a.productId === ref.productId &&
    a.customText === ref.customText &&
    a.size === ref.size &&
    a.color === ref.color
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
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

  const addItem = useCallback((product: Product, opts?: AddOptions) => {
    const qty = opts?.qty ?? 1;
    const customText = opts?.customText ?? "";
    const size = opts?.size ?? "";
    const color = opts?.color ?? "";
    setItems((prev) => {
      const idx = prev.findIndex((it) => sameLine(it, { productId: product.id, customText, size, color }));
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          code: product.code,
          price: opts?.price ?? product.price,
          image: product.image || product.images[0] || "",
          qty,
          customText,
          size,
          color,
        },
      ];
    });
    setIsOpen(true);
  }, []);

  const updateQty = useCallback((item: CartItem, qty: number) => {
    setItems((prev) =>
      prev
        .map((it) => (sameLine(it, item) ? { ...it, qty: Math.max(1, qty) } : it))
        .filter((it) => it.qty > 0)
    );
  }, []);

  const updateCustomText = useCallback((item: CartItem, text: string) => {
    setItems((prev) => prev.map((it) => (sameLine(it, item) ? { ...it, customText: text } : it)));
  }, []);

  const removeItem = useCallback((item: CartItem) => {
    setItems((prev) => prev.filter((it) => !sameLine(it, item)));
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
