"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { ProblemCard } from "@/components/session/problem-card";

interface Problem {
  id: string;
  title: string;
  content: string;
  subject: string;
  topic: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
}

const FEATURES = [
  {
    href: "/voice",
    icon: "🎙️",
    title: "Talk to your AI teacher",
    desc: "Speak naturally in English, Urdu, or Roman Urdu.",
    color: "bg-blue-50 border-blue-100",
  },
  {
    href: "/ask",
    icon: "💬",
    title: "Ask by text",
    desc: "Type any question and get a guided answer.",
    color: "bg-mint-500/5 border-mint-500/15",
  },
  {
    href: "/ask",
    icon: "🖼️",
    title: "Ask from image",
    desc: "Upload a photo of a problem for help.",
    color: "bg-amber-400/5 border-amber-400/15",
  },
  {
    href: "/ask",
    icon: "📄",
    title: "Ask from PDF",
    desc: "Upload a PDF and ask questions about it.",
    color: "bg-purple-50 border-purple-100",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  const [subjectFilter, setSubjectFilter] = useState<string>("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("ALL");
  const [mode, setMode] = useState<"INDEPENDENT" | "GUIDED" | "DEPENDENT" | "ADAPTIVE">("INDEPENDENT");

  useEffect(() => {
    fetch("/api/problems")
      .then((r) => r.json())
      .then((data) => setProblems(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const startSession = async (problemId: string, isAiFree: boolean) => {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemId, mode, isAiFree }),
    });
    if (!res.ok) {
      alert("Failed to start session");
      return;
    }
    const session = await res.json();
    router.push(`/session/${session.id}`);
  };

  const filtered = problems.filter((p) => {
    if (subjectFilter !== "ALL" && p.subject !== subjectFilter) return false;
    if (difficultyFilter !== "ALL" && p.difficulty !== difficultyFilter) return false;
    return true;
  });

  const subjects = Array.from(new Set(problems.map((p) => p.subject)));

  if (loading) {
    return (
      <div className="space-y-10">
        <section className="text-center py-4">
          <div className="skeleton mx-auto h-8 w-64" />
          <div className="skeleton mx-auto mt-3 h-4 w-80" />
        </section>
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-28 w-full" />
          ))}
        </section>
        <section>
          <div className="skeleton h-6 w-48 mb-4" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-48 w-full" />
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="text-center py-4">
        <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">
          Your AI Learning Mentor
        </h1>
        <p className="mt-2 text-sm text-ink-500 max-w-md mx-auto">
          Ask questions, practice problems, and learn at your own pace — in English, Urdu, or Roman Urdu.
        </p>
      </section>

      {/* Feature cards */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <Link
            key={i}
            href={f.href}
            className={clsx(
              "card p-5 transition-all hover:shadow-md hover:-translate-y-0.5 border",
              f.color,
            )}
          >
            <span className="text-2xl">{f.icon}</span>
            <h3 className="mt-2 text-sm font-semibold text-ink-900">{f.title}</h3>
            <p className="mt-1 text-xs text-ink-500">{f.desc}</p>
          </Link>
        ))}
      </section>

      {/* Practice section */}
      <section>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">Practice Independently</h2>
            <p className="text-sm text-ink-500 mt-0.5">Solve problems with progressive hints.</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div>
            <label className="text-xs font-medium text-ink-600">Mode</label>
            <div className="mt-1 flex gap-1 rounded-xl border border-ink-200 bg-white p-1">
              {(["INDEPENDENT", "GUIDED", "ADAPTIVE", "DEPENDENT"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={clsx(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                    mode === m ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-ink-50",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-ink-600">Subject</label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="input ml-2 w-auto"
            >
              <option value="ALL">All subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-ink-600">Difficulty</label>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="input ml-2 w-auto"
            >
              <option value="ALL">All</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProblemCard
              key={p.id}
              problem={p as any}
              onStart={() => startSession(p.id, false)}
              onStartAiFree={() => startSession(p.id, true)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-ink-200 p-10 text-center">
              <div className="text-3xl mb-2">📝</div>
              <p className="text-sm font-medium text-ink-700">No problems match your filters</p>
              <p className="mt-1 text-xs text-ink-500">
                Try a different subject or difficulty, or{" "}
                <Link href="/ask" className="text-mint-600 underline hover:text-mint-500">
                  ask a question directly
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
