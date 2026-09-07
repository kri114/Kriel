"use client";

import { useCallback, useEffect, useState } from "react";
import { LayoutGrid, Package, ClipboardList, LogOut, Loader2, ExternalLink } from "lucide-react";
import LoginForm from "./LoginForm";
import CategoriesTab from "./CategoriesTab";
import ProductsTab from "./ProductsTab";
import OrdersTab from "./OrdersTab";
import type { Category, Order, Product } from "@/lib/types";

type Tab = "categories" | "products" | "orders";

export default function AdminApp() {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("products");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const checkAuth = useCallback(async () => {
    const res = await fetch("/api/admin/me");
    const data = await res.json();
    setAuthed(Boolean(data.authenticated));
    setChecking(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const loadAll = useCallback(async () => {
    setLoadingData(true);
    try {
      const [catsRes, prodsRes, ordersRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/products?all=1"),
        fetch("/api/orders"),
      ]);
      const cats = await catsRes.json();
      const prods = await prodsRes.json();
      setCategories(cats.categories ?? []);
      setProducts(prods.products ?? []);
      if (ordersRes.ok) {
        const ord = await ordersRes.json();
        setOrders(ord.orders ?? []);
      }
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (authed) loadAll();
  }, [authed, loadAll]);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={28} />
      </div>
    );
  }

  if (!authed) {
    return <LoginForm onSuccess={() => setAuthed(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-5 h-16 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-slate-900">Paneli i Administratorit — KRIEL</h1>
            <p className="text-[11.5px] text-slate-500">Menaxhoni kategoritë, produktet, të preferuarat dhe porositë</p>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-600 hover:text-amber-600">
              <ExternalLink size={13} /> Shiko faqen
            </a>
            <button onClick={logout} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-[12.5px] font-semibold text-slate-600 hover:border-red-300 hover:text-red-500">
              <LogOut size={13} /> Dil
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
          <NavBtn active={tab === "products"} onClick={() => setTab("products")} icon={Package}>Produktet</NavBtn>
          <NavBtn active={tab === "categories"} onClick={() => setTab("categories")} icon={LayoutGrid}>Kategoritë</NavBtn>
          <NavBtn active={tab === "orders"} onClick={() => setTab("orders")} icon={ClipboardList}>
            Porositë {orders.length > 0 && `(${orders.length})`}
          </NavBtn>
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-slate-400" size={26} />
          </div>
        ) : (
          <>
            {tab === "categories" && <CategoriesTab categories={categories} reload={loadAll} />}
            {tab === "products" && <ProductsTab categories={categories} products={products} reload={loadAll} />}
            {tab === "orders" && <OrdersTab orders={orders} reload={loadAll} />}
          </>
        )}
      </div>
    </div>
  );
}

function NavBtn({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Package;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap transition-colors ${
        active ? "bg-slate-900 text-white" : "bg-white border border-slate-300 text-slate-600 hover:border-amber-400"
      }`}
    >
      <Icon size={14} /> {children}
    </button>
  );
}
