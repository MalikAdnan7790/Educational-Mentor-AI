"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { Mic, MessageSquare, Image, FileText, Sparkles } from "lucide-react";
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
    icon: Mic,
    title: "Talk to your AI teacher",
    desc: "Speak naturally in English, Urdu, or Roman Urdu.",
    iconBg: "bg-sky-400/15",
    iconColor: "text-sky-500",
    borderColor: "hover:border-sky-400",
  },
  {
    href: "/ask",
    icon: MessageSquare,
    title: "Ask by text",
    desc: "Type any question and get a guided answer.",
    iconBg: "bg-mint-400/15",
    iconColor: "text-mint-500",
    borderColor: "hover:border-mint-400",
  },
  {
    href: "/ask",
    icon: Image,
    title: "Ask from image",
    desc: "Upload a photo of a problem for help.",
    iconBg: "bg-amber-400/15",
    iconColor: "text-amber-500",
    borderColor: "hover:border-amber-400",
  },
  {
    href: "/ask",
    icon: FileText,
    title: "Ask from PDF",
    desc: "Upload a PDF and ask questions about it.",
    iconBg: "bg-purple-400/15",
    iconColor: "text-purple-500",
    borderColor: "hover:border-purple-400",
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
          <div className="skeleton mx-auto h-10 w-72" />
          <div className="skeleton mx-auto mt-4 h-5 w-96" />
        </section>
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-36 w-full rounded-2xl" />
          ))}
        </section>
        <section>
          <div className="skeleton h-7 w-56 mb-5" />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-52 w-full rounded-2xl" />
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center py-4 fade-in-up">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-mint-400/15">
          <Sparkles className="h-7 w-7 text-mint-500" />
        </div>
        <h1 className="text-3xl font-extrabold text-ink-900 sm:text-4xl tracking-tight">
          Your AI Learning Mentor
        </h1>
        <p className="mt-3 text-base font-medium text-ink-400 max-w-lg mx-auto">
          Ask questions, practice problems, and learn at your own pace — in English, Urdu, or Roman Urdu.
        </p>
      </section>

      {/* Feature cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <Link
              key={i}
              href={f.href}
              className={clsx(
                "card p-5 transition-all hover:-translate-y-0.5 border-2",
                f.borderColor,
              )}
            >
              <div className={clsx("flex h-12 w-12 items-center justify-center rounded-xl", f.iconBg)}>
                <Icon className={clsx("h-6 w-6", f.iconColor)} />
              </div>
              <h3 className="mt-3 text-sm font-bold text-ink-900">{f.title}</h3>
              <p className="mt-1 text-xs font-medium text-ink-400">{f.desc}</p>
            </Link>
          );
        })}
      </section>

      {/* Practice section */}
      <section>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-ink-900">Practice Independently</h2>
            <p className="text-sm font-medium text-ink-400 mt-1">Solve problems with progressive hints.</p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div>
            <label className="text-xs font-bold text-ink-500 uppercase tracking-wider">Mode</label>
            <div className="mt-1.5 flex gap-1 rounded-xl border-2 border-ink-100 bg-white p-1">
              {(["INDEPENDENT", "GUIDED", "ADAPTIVE", "DEPENDENT"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={clsx(
                    "rounded-lg px-3 py-2 text-xs font-bold transition-all",
                    mode === m
                      ? "bg-mint-400 text-white shadow-[0_2px_0_0_#368a00]"
                      : "text-ink-500 hover:bg-ink-50",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-ink-500 uppercase tracking-wider">Subject</label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="input ml-2 w-auto mt-1.5"
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
            <label className="text-xs font-bold text-ink-500 uppercase tracking-wider">Difficulty</label>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="input ml-2 w-auto mt-1.5"
            >
              <option value="ALL">All</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProblemCard
              key={p.id}
              problem={p as any}
              onStart={() => startSession(p.id, false)}
              onStartAiFree={() => startSession(p.id, true)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-2xl border-2 border-dashed border-ink-200 p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-ink-100">
                <FileText className="h-6 w-6 text-ink-400" />
              </div>
              <p className="mt-3 text-sm font-bold text-ink-700">No problems match your filters</p>
              <p className="mt-1 text-xs font-medium text-ink-400">
                Try a different subject or difficulty, or{" "}
                <Link href="/ask" className="font-bold text-mint-500 hover:text-mint-600">
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
