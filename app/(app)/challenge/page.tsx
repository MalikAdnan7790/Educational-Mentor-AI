"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Trophy } from "lucide-react";

interface ChallengeItem {
  id: string;
  subjectKey: string | null;
  topic: string | null;
  difficulty: string;
  problemText: string;
  score: number | null;
  confidencePct: number | null;
  status: string;
  createdAt: string;
}

interface Grade {
  isCorrect: boolean;
  score: number;
  analysis: string;
  confidenceNote?: string | null;
  adaptiveNext?: string;
}

const DIFFICULTY_ORDER = ["EASY", "MEDIUM", "HARD", "REAL_WORLD"];

function difficultyLabel(d: string): string {
  return d === "REAL_WORLD" ? "REAL-WORLD" : d;
}

function sameDay(iso: string): boolean {
  return new Date(iso).toDateString() === new Date().toDateString();
}

export default function ChallengePage() {
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [current, setCurrent] = useState<ChallengeItem | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [answer, setAnswer] = useState("");
  const [confidence, setConfidence] = useState(70);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grade, setGrade] = useState<Grade | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    try {
      const res = await fetch("/api/challenge");
      if (res.ok) setChallenges(await res.json());
    } finally {
      setLoaded(true);
    }
  }

  // On first load, resume today's challenge if there is one
  useEffect(() => {
    if (!loaded || initialized) return;
    setInitialized(true);
    const todays = challenges.find((c) => sameDay(c.createdAt));
    if (todays) setCurrent(todays);
  }, [loaded, initialized, challenges]);

  const todays = challenges.find((c) => sameDay(c.createdAt));
  const solvedToday = !!todays && todays.status === "GRADED";

  async function getChallenge() {
    setBusy(true);
    setError(null);
    setGrade(null);
    try {
      const res = await fetch("/api/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        setError("Could not generate today's challenge. Please try again.");
        return;
      }
      const data: ChallengeItem = await res.json();
      setCurrent(data);
      setAnswer("");
      refresh();
    } catch {
      setError("Could not generate today's challenge. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // Adaptive follow-up: the server picks the next difficulty from how the
  // student just performed — Easy → Medium → Hard → Real-world.
  async function getAdaptiveChallenge() {
    if (!current) return;
    setBusy(true);
    setError(null);
    setGrade(null);
    try {
      const res = await fetch("/api/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adaptFrom: current.id }),
      });
      if (!res.ok) {
        setError("Could not generate the next problem. Please try again.");
        return;
      }
      const data: ChallengeItem = await res.json();
      setCurrent(data);
      setAnswer("");
      setConfidence(70);
      refresh();
    } catch {
      setError("Could not generate the next problem. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitAnswer() {
    if (!current || !answer.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/challenge/${current.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: answer.trim(), confidence }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "already_submitted"
            ? "You already submitted this challenge."
            : "Could not submit. Please try again.",
        );
        return;
      }
      setGrade(data);
      setCurrent({ ...current, status: "GRADED", score: data.score, confidencePct: confidence });
      refresh();
    } catch {
      setError("Could not submit. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15 text-amber-500">
          <Trophy className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">Daily AI Challenge</h1>
          <p className="mt-0.5 text-sm text-ink-500">
            One problem a day, picked from your weakest areas — slightly harder than your comfort
            zone. Solve it without hints.
          </p>
        </div>
      </section>

      {/* Today's challenge */}
      {(!current || current.status === "GRADED") && !grade && (
        <section className="rounded-2xl border-2 border-ink-100 bg-white max-w-2xl p-6 text-center">
          {solvedToday ? (
            <>
              <h2 className="text-lg font-bold text-ink-900">
                Today&apos;s challenge is done — score {Math.round(todays!.score ?? 0)}/100
              </h2>
              <p className="mt-2 text-sm text-ink-500">
                Come back tomorrow for a new one, or practice more in the meantime.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold text-ink-900">Ready for today&apos;s problem?</h2>
              <p className="mt-2 text-sm text-ink-500">
                It will be generated from your real performance data — no topic picking needed.
              </p>
              <button onClick={getChallenge} disabled={busy} className="btn-primary mt-4">
                {busy ? "Generating…" : "Get my challenge"}
              </button>
            </>
          )}
          {error && <p className="mt-3 text-xs text-coral-500">{error}</p>}
        </section>
      )}

      {current && current.status === "PENDING" && (
        <section className="rounded-2xl border-2 border-ink-100 bg-white max-w-2xl p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
            {current.subjectKey && <span className="chip">{current.subjectKey}</span>}
            {current.topic && <span className="chip">{current.topic}</span>}
            <span
              className={clsx(
                "chip",
                current.difficulty === "REAL_WORLD" && "bg-ink-900 text-white",
                current.difficulty === "HARD" && "bg-coral-500/10 text-coral-600",
                current.difficulty === "MEDIUM" && "bg-amber-400/20 text-amber-700",
              )}
            >
              {difficultyLabel(current.difficulty)}
            </span>
            <span className="ml-auto">Today&apos;s challenge</span>
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink-800">
            {current.problemText}
          </p>
          <textarea
            className="input mt-4 min-h-[110px] w-full"
            placeholder="Work it out, then write your answer and reasoning…"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            maxLength={4000}
            disabled={busy}
          />
          <div className="mt-3">
            <label className="text-xs font-medium text-ink-600">
              How confident are you? {confidence}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={10}
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="mt-1 w-full accent-ink-900"
            />
          </div>
          {error && <p className="mt-2 text-xs text-coral-500">{error}</p>}
          <button onClick={submitAnswer} disabled={busy || !answer.trim()} className="btn-primary mt-4 w-full">
            {busy ? "Grading…" : "Submit answer"}
          </button>
        </section>
      )}

      {grade && (
        <section
          className={clsx(
            "rounded-2xl border-2 max-w-2xl p-6",
            grade.isCorrect ? "border-mint-400/50 bg-mint-500/5" : "border-coral-400/40 bg-coral-500/5",
          )}
        >
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={clsx(
                "rounded-xl px-2.5 py-1 text-xs font-semibold",
                grade.isCorrect ? "bg-mint-500/15 text-mint-700" : "bg-coral-500/10 text-coral-600",
              )}
            >
              {grade.isCorrect ? "Solved" : "Not quite"}
            </span>
            <span className="text-xs text-ink-500">
              Score: <strong className="text-ink-800">{Math.round(grade.score)}/100</strong>
            </span>
          </div>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-700">
            {grade.analysis}
          </p>
          {grade.confidenceNote && (
            <p className="mt-3 rounded-xl border-l-4 border-mint-400 bg-mint-500/5 p-3 text-sm leading-relaxed text-ink-700">
              {grade.confidenceNote}
            </p>
          )}
          {grade.adaptiveNext && current && (
            <div className="mt-4">
              <button onClick={getAdaptiveChallenge} disabled={busy} className="btn-primary w-full">
                {busy
                  ? "Generating…"
                  : DIFFICULTY_ORDER.indexOf(grade.adaptiveNext) >
                      DIFFICULTY_ORDER.indexOf(current.difficulty)
                    ? `Level up: try a ${difficultyLabel(grade.adaptiveNext).toLowerCase()} problem`
                    : DIFFICULTY_ORDER.indexOf(grade.adaptiveNext) <
                        DIFFICULTY_ORDER.indexOf(current.difficulty)
                      ? "Build confidence: try an easier one"
                      : "Practice another at this level"}
              </button>
              <p className="mt-2 text-xs text-ink-400">
                The difficulty adapts to you — solve well and it steps up, struggle and it eases
                off. A brand-new daily challenge unlocks tomorrow.
              </p>
            </div>
          )}
        </section>
      )}

      {/* History */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-ink-500">
          Past challenges
        </h2>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {loaded && challenges.length === 0 && (
            <div className="col-span-full rounded-2xl border-2 border-dashed border-ink-200 p-6 text-center text-sm text-ink-500">
              No challenges yet — get your first one above.
            </div>
          )}
          {challenges.map((c) => (
            <div key={c.id} className="rounded-2xl border-2 border-ink-100 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-ink-900">
                  {c.topic ?? c.subjectKey ?? "General"}
                </span>
                <span
                  className={clsx(
                    "rounded-xl px-2 py-0.5 text-[10px] font-semibold",
                    c.status === "GRADED"
                      ? (c.score ?? 0) >= 60
                        ? "bg-mint-500/15 text-mint-700"
                        : "bg-amber-400/20 text-amber-700"
                      : "bg-ink-100 text-ink-500",
                  )}
                >
                  {c.status === "GRADED" ? `${Math.round(c.score ?? 0)}/100` : c.status}
                </span>
              </div>
              <span className="mt-1 block text-xs text-ink-400">
                {difficultyLabel(c.difficulty)} · {new Date(c.createdAt).toLocaleDateString()}
                {c.confidencePct != null && ` · confidence ${c.confidencePct}%`}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
