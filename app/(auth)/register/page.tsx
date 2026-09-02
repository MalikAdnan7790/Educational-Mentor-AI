"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const EDUCATION_LEVELS = [
  { value: "SCHOOL", label: "School" },
  { value: "COLLEGE", label: "College" },
  { value: "UNIVERSITY", label: "University" },
  { value: "PROFESSIONAL", label: "Professional" },
] as const;

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [educationLevel, setEducationLevel] = useState<string>("SCHOOL");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, educationLevel }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.error === "email_taken") {
          setError(data.message);
        } else {
          setError("Could not create your account. Please check your details and try again.");
        }
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-12">
      <div className="card w-full max-w-md p-8">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-mint-500/15 text-2xl">
            🎓
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-ink-900">Create your account</h1>
          <p className="mt-1 text-sm text-ink-500">
            Your AI mentor adapts to your level — and pushes you toward independence.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-coral-500/30 bg-coral-500/10 px-4 py-3 text-sm text-coral-500">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink-700">
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              autoComplete="name"
              className="input"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
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
              minLength={8}
              autoComplete="new-password"
              className="input"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="level" className="mb-1.5 block text-sm font-medium text-ink-700">
              Education level
            </label>
            <select
              id="level"
              className="input"
              value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value)}
            >
              {EDUCATION_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-mint-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
