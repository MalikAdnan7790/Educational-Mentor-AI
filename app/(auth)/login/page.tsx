"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, Mail, Lock } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || "Could not sign you in. Please try again.");
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-mint-400 text-white shadow-[0_4px_0_0_#368a00]">
          <GraduationCap className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-3xl font-extrabold text-ink-900">Welcome back!</h1>
        <p className="mt-2 text-sm font-medium text-ink-400">
          Sign in to continue your learning journey
        </p>
      </div>

      <div className="rounded-2xl border-2 border-ink-100 bg-white p-8 shadow-card">
        <form onSubmit={onSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl border-2 border-coral-400/30 bg-coral-400/10 px-4 py-3 text-sm font-semibold text-coral-500">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-bold text-ink-700">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="input pl-10"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-bold text-ink-700">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                className="input pl-10"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full text-base">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm font-semibold text-ink-400">
        New here?{" "}
        <Link href="/register" className="font-bold text-mint-500 hover:text-mint-600">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-mint-400/5 via-white to-sky-400/5 px-4 py-12">
      <Suspense fallback={<div className="text-ink-400 font-semibold">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
