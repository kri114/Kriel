"use client";

import { useCallback, useEffect, useState } from "react";
import { LayoutGrid, Package, ClipboardList, LogOut, Loader2, ExternalLink, Database } from "lucide-react";
import LoginForm from "./LoginForm";
import CategoriesTab from "./CategoriesTab";
import ProductsTab from "./ProductsTab";
import OrdersTab from "./OrdersTab";
import {
  fetchCategories,
  fetchOrders,
  fetchProducts,
  getAdminSession,
  onAdminAuthChange,
  signOutAdmin,
} from "@/lib/store";
import { isBackendConfigured } from "@/lib/supabase";
import type { Category, Order, Product } from "@/lib/types";

type Tab = "categories" | "products" | "orders";

export default function AdminApp() {
  const configured = isBackendConfigured();
  const [checking, setChecking] = useState(configured);
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("products");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!configured) return;
    let mounted = true;
    getAdminSession()
      .then((session) => {
        if (mounted) setAuthed(Boolean(session));
      })
      .finally(() => {
        if (mounted) setChecking(false);
      });
    const unsubscribe = onAdminAuthChange((session) => {
      setAuthed(Boolean(session));
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [configured]);

  const loadAll = useCallback(async () => {
    setLoadingData(true);
    try {
      const [cats, prods, ords] = await Promise.all([
        fetchCategories(),
        fetchProducts(),
        fetchOrders().catch(() => [] as Order[]),
      ]);
      setCategories(cats);
      setProducts(prods);
      setOrders(ords);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (authed) loadAll();
  }, [authed, loadAll]);

  const logout = async () => {
    await signOutAdmin();
    setAuthed(false);
  };

  if (!configured) {
    return <BackendMissing />;
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-600" size={28} />
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
            <p className="text-[11.5px] text-slate-700">Menaxhoni kategoritë, produktet, të preferuarat dhe porositë</p>
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
            <Loader2 className="animate-spin text-slate-600" size={26} />
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

function BackendMissing() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-xl p-8 border border-slate-200">
        <div className="flex items-center gap-3 mb-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-200 to-amber-600 text-white">
            <Database size={18} />
          </span>
          <div>
            <h1 className="font-semibold text-lg text-slate-900 leading-tight">Paneli KRIEL</h1>
            <p className="text-[12px] text-slate-700">Backend-i nuk është konfiguruar ende</p>
          </div>
        </div>
        <p className="text-[13.5px] leading-relaxed text-slate-600">
          Paneli ka nevojë për backend-in Supabase (bazë të dhënash + autentikim falas).
          Plotësoni hapat në skedarin <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[12px] font-semibold text-slate-800">RENDER.md</code> të
          projektit, pastaj vendosni këto dy variabla mjedisi dhe ribuild-oni faqen:
        </p>
        <ul className="mt-4 space-y-2 text-[12.5px] text-slate-700">
          <li className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono">NEXT_PUBLIC_SUPABASE_URL</li>
          <li className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
        </ul>
        <p className="mt-4 text-[12px] leading-relaxed text-slate-700">
          Kyçja &quot;anon&quot; është e sigurt për t&apos;u publikuar — aksesi kufizohet nga
          rregullat Row Level Security (shih <code className="rounded bg-slate-100 px-1 py-0.5">supabase/setup.sql</code>).
          Fjalëkalimet nuk ruhen askund në kod.
        </p>
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
