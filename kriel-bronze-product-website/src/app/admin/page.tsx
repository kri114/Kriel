import type { Metadata } from "next";
import AdminApp from "@/components/admin/AdminApp";

export const metadata: Metadata = {
  title: "Paneli i Administratorit — KRIEL",
  robots: { index: false, follow: false },
};

// The admin panel is a pure client-side app (Supabase Auth + RLS), so the
// shell can be exported statically.
export const dynamic = "force-static";

export default function AdminPage() {
  return <AdminApp />;
}
