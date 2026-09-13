import type { Metadata } from "next";
import AdminApp from "@/components/admin/AdminApp";

export const metadata: Metadata = {
  title: "Paneli i Administratorit — KRIEL",
  robots: { index: false, follow: false },
};

// Static shell — the panel is a client-side app that talks directly to the
// external Supabase backend (auth + database), so it works on a static host.
export default function AdminPage() {
  return <AdminApp />;
}
