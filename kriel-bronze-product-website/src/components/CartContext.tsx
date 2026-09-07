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

type CartContextValue = {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, opts?: { qty?: number; customText?: string }) => void;
  updateQty: (productId: number, qty: number) => void;
  updateCustomText: (productId: number, text: string) => void;
  removeItem: (productId: number) => void;
  clear: () => void;
  count: number;
  total: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "kriel-cart-v1";

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

  const addItem = useCallback((product: Product, opts?: { qty?: number; customText?: string }) => {
    setItems((prev) => {
      const qty = opts?.qty ?? 1;
      const customText = opts?.customText ?? "";
      const idx = prev.findIndex((it) => it.productId === product.id && it.customText === customText);
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
          price: product.price,
          image: product.image,
          qty,
          customText,
        },
      ];
    });
    setIsOpen(true);
  }, []);

  const updateQty = useCallback((productId: number, qty: number) => {
    setItems((prev) =>
      prev
        .map((it) => (it.productId === productId ? { ...it, qty: Math.max(1, qty) } : it))
        .filter((it) => it.qty > 0)
    );
  }, []);

  const updateCustomText = useCallback((productId: number, text: string) => {
    setItems((prev) => prev.map((it) => (it.productId === productId ? { ...it, customText: text } : it)));
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((it) => it.productId !== productId));
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
