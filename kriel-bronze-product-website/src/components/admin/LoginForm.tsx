"use client";

import { useState } from "react";
import { Lock, Loader2 } from "lucide-react";

export default function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Hyrja dështoi.");
        return;
      }
      onSuccess();
    } catch {
      setError("Nuk u lidh me serverin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-white shadow-xl p-8 border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-200 to-amber-600 text-white">
            <Lock size={18} />
          </span>
          <div>
            <h1 className="font-semibold text-lg text-slate-900 leading-tight">Paneli KRIEL</h1>
            <p className="text-[12px] text-slate-500">Hyrje e administratorit</p>
          </div>
        </div>
        <label className="block mb-3">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Përdoruesi</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-[14px]"
            autoFocus
          />
        </label>
        <label className="block mb-5">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Fjalëkalimi</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-[14px]"
          />
        </label>
        {error && <p className="mb-4 text-[13px] text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 via-amber-500 to-amber-700 py-3 text-[14px] font-bold text-white disabled:opacity-60"
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          Hyr
        </button>
      </form>
    </div>
  );
}
