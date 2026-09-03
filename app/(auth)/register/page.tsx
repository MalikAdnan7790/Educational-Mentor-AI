"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, Mail, Lock, User } from "lucide-react";

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
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-mint-400/5 via-white to-sky-400/5 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-mint-400 text-white shadow-[0_4px_0_0_#368a00]">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-3xl font-extrabold text-ink-900">Create your account</h1>
          <p className="mt-2 text-sm font-medium text-ink-400">
            Your AI mentor adapts to you and pushes you toward independence
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
              <label htmlFor="name" className="mb-2 block text-sm font-bold text-ink-700">
                Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
                <input
                  id="name"
                  type="text"
                  required
                  autoComplete="name"
                  className="input pl-10"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
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
                  minLength={8}
                  autoComplete="new-password"
                  className="input pl-10"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="level" className="mb-2 block text-sm font-bold text-ink-700">
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
            <button type="submit" disabled={loading} className="btn-primary w-full text-base">
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm font-semibold text-ink-400">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-mint-500 hover:text-mint-600">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
