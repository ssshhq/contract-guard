"use client";

import { useMemo, useState } from "react";
import { Lock, Loader2 } from "lucide-react";

interface PasswordGateProps {
  onAuthed: () => void;
}

export default function PasswordGate({ onAuthed }: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => password.trim().length > 0 && !submitting,
    [password, submitting]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "验证失败");
        return;
      }
      try {
        window.localStorage.setItem("contract-guard-authed-v1", "1");
      } catch {
        // ignore storage errors
      }
      onAuthed();
    } catch (err: any) {
      setError(err?.message || "网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto flex w-full max-w-5xl flex-col px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pt-16">
        <section className="rounded-3xl border border-slate-200 bg-white/80 px-6 py-10 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur-sm sm:px-10">
          <div className="mx-auto max-w-md">
            <div className="flex items-center gap-2 text-slate-900">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 ring-1 ring-sky-100">
                <Lock className="h-5 w-5" />
              </span>
              <h1 className="text-lg font-semibold tracking-tight">
                请输入访问密码
              </h1>
            </div>

            <p className="mt-3 text-sm leading-7 text-slate-600">
              此页面受密码保护。输入正确密码后即可进入合同审查页面。
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-3">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="访问密码"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                  autoFocus
                />
                {error && (
                  <p className="mt-2 text-xs text-red-600">{error}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(56,189,248,0.45)] transition enabled:hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                验证进入
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

