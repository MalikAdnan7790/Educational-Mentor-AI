"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

interface Subject {
  key: string;
  name: string;
}

interface Lesson {
  concept: string;
  example: string;
  check: string;
  question: string;
}

interface CheckResult {
  passed: boolean;
  score: number;
  feedback: string;
}

type View = "setup" | "lesson" | "result";

export default function SixtySecondPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [view, setView] = useState<View>("setup");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/subjects")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setSubjects(data.map((s: any) => ({ key: s.key, name: s.name }))))
      .catch(() => {});
  }, []);

  async function startLesson() {
    if (topic.trim().length < 2) {
      setError("Which topic do you need in 60 seconds?");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/sixty-second", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject || undefined, topic: topic.trim() }),
      });
      if (!res.ok) {
        setError("Could not build the lesson. Please try again.");
        return;
      }
      setLesson(await res.json());
      setAnswer("");
      setResult(null);
      setView("lesson");
    } finally {
      setBusy(false);
    }
  }

  async function submitAnswer() {
    if (!lesson || !answer.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/sixty-second/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          question: lesson.question,
          answer: answer.trim(),
        }),
      });
      if (!res.ok) {
        setError("Could not check your answer. Please try again.");
        return;
      }
      setResult(await res.json());
      setView("result");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setView("setup");
    setLesson(null);
    setResult(null);
    setAnswer("");
    setError(null);
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-ink-900">60-Second Teacher</h1>
        <p className="mt-1 text-sm text-ink-500">
          Any topic, one minute: 30 seconds of concept, 20 seconds of example, a 10-second
          mini-check — then one question to prove it stuck. Not a summary — a real micro-lesson.
        </p>
      </section>

      {view === "setup" && (
        <section className="card max-w-xl p-6">
          <h2 className="text-sm font-semibold text-ink-900">What should I teach you?</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-ink-600">Subject (optional)</label>
              <select
                className="input mt-1 w-full"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                <option value="">General / no subject</option>
                {subjects.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-600">Topic</label>
              <input
                className="input mt-1 w-full"
                placeholder="e.g. Electricity, Cell division, Tenses in English"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={200}
              />
            </div>
            {error && <p className="text-xs text-coral-500">{error}</p>}
            <button onClick={startLesson} disabled={busy} className="btn-primary w-full">
              {busy ? "Preparing your minute…" : "Teach me in 60 seconds"}
            </button>
          </div>
        </section>
      )}

      {view === "lesson" && lesson && (
        <section className="card max-w-2xl p-6">
          <div className="flex items-center justify-between text-xs text-ink-400">
            <span>{topic}</span>
            <span>Your 60-second lesson</span>
          </div>

          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-ink-100 bg-white p-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-mint-500/15 px-2 py-0.5 text-[10px] font-semibold text-mint-700">
                  30 sec
                </span>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  The concept
                </h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-800">{lesson.concept}</p>
            </div>

            <div className="rounded-xl border border-ink-100 bg-white p-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  20 sec
                </span>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  The example
                </h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-800">{lesson.example}</p>
            </div>

            <div className="rounded-xl border border-ink-100 bg-white p-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-coral-500/10 px-2 py-0.5 text-[10px] font-semibold text-coral-600">
                  10 sec
                </span>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Mini-check
                </h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-800">{lesson.check}</p>
            </div>

            <div className="rounded-xl border border-ink-200 bg-ink-50/50 p-4">
              <h3 className="text-sm font-semibold text-ink-900">Your question</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-800">{lesson.question}</p>
              <textarea
                className="input mt-3 min-h-[90px] w-full"
                placeholder="Your answer…"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                maxLength={4000}
                disabled={busy}
              />
              {error && <p className="mt-2 text-xs text-coral-500">{error}</p>}
              <button
                onClick={submitAnswer}
                disabled={busy || !answer.trim()}
                className="btn-primary mt-3 w-full"
              >
                {busy ? "Checking…" : "Check my answer"}
              </button>
            </div>
          </div>
        </section>
      )}

      {view === "result" && result && lesson && (
        <section className="card max-w-2xl p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={clsx(
                "rounded-full px-2.5 py-1 text-xs font-semibold",
                result.passed ? "bg-mint-500/15 text-mint-700" : "bg-coral-500/10 text-coral-600",
              )}
            >
              {result.passed ? "Got it" : "Not yet"}
            </span>
            <span className="text-xs text-ink-500">
              Score: <strong className="text-ink-800">{Math.round(result.score)}/100</strong>
            </span>
            <span className="ml-auto text-xs text-ink-400">{topic}</span>
          </div>
          <p className="mt-2 text-sm font-medium leading-relaxed text-ink-800">
            {lesson.question}
          </p>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-700">
            {result.feedback}
          </p>
          <div className="mt-4 flex gap-2">
            <button onClick={reset} className="btn-primary flex-1">
              Another 60-second lesson
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
