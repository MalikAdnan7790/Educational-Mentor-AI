"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

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
    <div className="card w-full max-w-md p-8">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-mint-500/15 text-2xl">
          🎓
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-ink-900">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-500">Sign in to continue learning independently.</p>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-xl border border-coral-500/30 bg-coral-500/10 px-4 py-3 text-sm text-coral-500">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            className="input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        New here?{" "}
        <Link href="/register" className="font-medium text-mint-600 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-12">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
