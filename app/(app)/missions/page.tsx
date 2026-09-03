"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Target } from "lucide-react";

interface MissionListItem {
  id: string;
  title: string;
  description: string;
  topic: string;
  weaknessKey: string;
  status: string;
  createdAt: string;
  stepsTotal: number;
  stepsCompleted: number;
}

interface MissionStepView {
  id: string;
  order: number;
  kind: string;
  content: string;
  status: string;
  attempts: number;
  studentAnswer: string | null;
  score: number | null;
  analysis: { passed?: boolean; score?: number; feedback?: string } | null;
  answer: string | null;
}

interface MissionDetail {
  id: string;
  title: string;
  description: string;
  topic: string;
  weaknessKey: string;
  status: string;
  steps: MissionStepView[];
}

interface MistakeItem {
  id: string;
  mistakeType: string;
  description: string;
  subjectKey: string | null;
  topic: string | null;
  occurrences: number;
  status: string;
}

const STEP_LABELS: Record<string, string> = {
  MINI_LESSON: "Mini lesson",
  PRACTICE_1: "Practice 1",
  PRACTICE_2: "Practice 2",
  CHALLENGE: "Challenge",
  RE_TEST: "Re-test",
};

export default function MissionsPage() {
  const [missions, setMissions] = useState<MissionListItem[]>([]);
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [active, setActive] = useState<MissionDetail | null>(null);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFeedback, setLastFeedback] = useState<{
    passed: boolean;
    score: number | null;
    feedback: string;
    answer: string | null;
  } | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    const [m, s] = await Promise.all([
      fetch("/api/missions").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/mistakes?status=OPEN").then((r) => (r.ok ? r.json() : [])),
    ]);
    setMissions(m);
    setMistakes(s.filter((x: MistakeItem) => x.occurrences >= 2));
  }

  async function startMission(mistakeId?: string) {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mistakeId ? { mistakeId } : {}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "no_recurring_mistake"
            ? data.message ?? "No recurring mistake to repair yet."
            : "Could not build the mission. Please try again.",
        );
        return;
      }
      await openMission(data.id);
      refresh();
    } catch {
      setError("Could not build the mission. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  async function openMission(id: string) {
    setBusy(true);
    setError(null);
    setLastFeedback(null);
    setAnswer("");
    try {
      const res = await fetch(`/api/missions/${id}`);
      if (!res.ok) throw new Error();
      setActive(await res.json());
    } catch {
      setError("Could not load the mission.");
    } finally {
      setBusy(false);
    }
  }

  async function submitAnswer() {
    if (!active) return;
    const step = active.steps.find((s) => s.status === "PENDING");
    if (!step) return;
    if (step.kind !== "MINI_LESSON" && !answer.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/missions/${active.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: answer.trim() || "(read)" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "grading_failed"
            ? "Grading failed — submit again."
            : "Could not submit your answer.",
        );
        return;
      }
      setLastFeedback({
        passed: data.passed,
        score: data.score ?? null,
        feedback: data.feedback,
        answer: data.answer ?? null,
      });
      setAnswer("");
      await openMission(active.id);
      if (data.missionCompleted) refresh();
    } catch {
      setError("Could not submit your answer.");
    } finally {
      setBusy(false);
    }
  }

  async function abandonMission() {
    if (!active || !confirm("Abandon this mission? The mistake stays on your record.")) return;
    await fetch(`/api/missions/${active.id}`, { method: "DELETE" });
    setActive(null);
    setLastFeedback(null);
    refresh();
  }

  // ---------- Mission detail view ----------
  if (active) {
    const currentStep = active.steps.find((s) => s.status === "PENDING");
    const completed = active.steps.filter((s) => s.status === "COMPLETED").length;
    const missionDone = active.status === "COMPLETED";

    return (
      <div className="space-y-6">
        <section>
          <button
            onClick={() => {
              setActive(null);
              setLastFeedback(null);
            }}
            className="text-xs text-ink-400 hover:text-ink-900"
          >
            ← All missions
          </button>
          <h1 className="mt-1 text-2xl font-bold text-ink-900">{active.title}</h1>
          <p className="mt-1 text-sm text-ink-500">{active.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="chip">{active.topic}</span>
            <span className="chip bg-amber-400/20 text-amber-700">{active.weaknessKey}</span>
            <span
              className={clsx(
                "chip",
                missionDone ? "bg-mint-500/20 text-mint-700" : "bg-ink-100 text-ink-600",
              )}
            >
              {completed}/{active.steps.length} steps
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-mint-500 transition-all"
              style={{ width: `${(completed / active.steps.length) * 100}%` }}
            />
          </div>
        </section>

        {missionDone && (
          <section className="card border-mint-400/40 bg-mint-500/5 p-6">
            <h2 className="text-lg font-semibold text-mint-700">Mission complete</h2>
            <p className="mt-1 text-sm text-ink-700">
              You repaired this weakness — the mistake has been marked resolved on your record.
            </p>
            <button
              onClick={() => {
                setActive(null);
                setLastFeedback(null);
                refresh();
              }}
              className="btn-primary mt-4"
            >
              Back to missions
            </button>
          </section>
        )}

        {/* Step timeline */}
        <section className="space-y-3">
          {active.steps.map((s) => {
            const isCurrent = !missionDone && s.id === currentStep?.id;
            const done = s.status === "COMPLETED";
            return (
              <div
                key={s.id}
                className={clsx(
                  "card p-5",
                  isCurrent && "border-mint-400/50 ring-1 ring-mint-400/30",
                  !isCurrent && !done && "opacity-60",
                )}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className={clsx("font-semibold", done ? "text-mint-700" : "text-ink-500")}>
                    {done ? "✓" : s.order}. {STEP_LABELS[s.kind] ?? s.kind}
                  </span>
                  {done && s.score != null && (
                    <span className="text-ink-400">{Math.round(s.score)}/100</span>
                  )}
                  {!done && s.attempts > 0 && (
                    <span className="text-ink-400">{s.attempts} attempt{s.attempts > 1 ? "s" : ""}</span>
                  )}
                </div>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-800">
                  {s.content}
                </p>

                {done && s.answer && s.kind !== "MINI_LESSON" && (
                  <p className="mt-3 rounded-lg bg-mint-500/10 p-3 text-sm text-ink-700">
                    <strong>Model answer:</strong> {s.answer}
                  </p>
                )}
                {done && s.analysis?.feedback && (
                  <p className="mt-2 text-xs text-ink-500">{s.analysis.feedback}</p>
                )}

                {isCurrent && s.kind === "MINI_LESSON" && (
                  <button onClick={submitAnswer} disabled={busy} className="btn-primary mt-4">
                    {busy ? "Saving…" : "I've read this — start practice"}
                  </button>
                )}

                {isCurrent && s.kind !== "MINI_LESSON" && (
                  <div className="mt-4">
                    <textarea
                      className="input min-h-[100px] w-full"
                      placeholder="Write your answer in your own words…"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      maxLength={4000}
                      disabled={busy}
                    />
                    <button
                      onClick={submitAnswer}
                      disabled={busy || !answer.trim()}
                      className="btn-primary mt-3 w-full"
                    >
                      {busy ? "Checking…" : "Submit answer"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {lastFeedback && (
          <section
            className={clsx(
              "card p-5",
              lastFeedback.passed ? "border-mint-400/50 bg-mint-500/5" : "border-coral-400/40 bg-coral-500/5",
            )}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={clsx(
                  "rounded-full px-2.5 py-1 text-xs font-semibold",
                  lastFeedback.passed ? "bg-mint-500/15 text-mint-700" : "bg-coral-500/10 text-coral-600",
                )}
              >
                {lastFeedback.passed ? "Passed" : "Not yet — try again"}
              </span>
              {lastFeedback.score != null && (
                <span className="text-xs text-ink-500">
                  Score: <strong className="text-ink-800">{Math.round(lastFeedback.score)}/100</strong>
                </span>
              )}
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-700">
              {lastFeedback.feedback}
            </p>
            {lastFeedback.passed && lastFeedback.answer && (
              <p className="mt-3 rounded-lg bg-white/70 p-3 text-sm text-ink-700">
                <strong>Model answer:</strong> {lastFeedback.answer}
              </p>
            )}
          </section>
        )}

        {error && <p className="text-sm text-coral-500">{error}</p>}

        {!missionDone && (
          <button onClick={abandonMission} disabled={busy} className="btn-ghost text-xs text-coral-600">
            Abandon mission
          </button>
        )}
      </div>
    );
  }

  // ---------- List view ----------
  const activeMission = missions.find((m) => m.status === "ACTIVE");

  return (
    <div className="space-y-6">
      <section className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-coral-400/15 text-coral-500">
          <Target className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">Mistake → Mission</h1>
          <p className="mt-0.5 text-sm text-ink-500">
            When a mistake repeats, it becomes a repair mission: a mini lesson, guided practice, a
            challenge, and a final re-test. Pass the re-test and the mistake is resolved.
          </p>
        </div>
      </section>

      {activeMission && (
        <section className="card border-mint-400/40 bg-mint-500/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-ink-900">Mission in progress</h2>
              <p className="mt-1 text-sm text-ink-700">
                {activeMission.title} — {activeMission.stepsCompleted}/{activeMission.stepsTotal} steps done
              </p>
            </div>
            <button onClick={() => openMission(activeMission.id)} className="btn-primary">
              Continue mission
            </button>
          </div>
        </section>
      )}

      <section className="card max-w-2xl p-6">
        <h2 className="text-sm font-semibold text-ink-900">Your recurring mistakes</h2>
        {mistakes.length === 0 ? (
          <p className="mt-2 text-sm text-ink-500">
            No repeating mistakes yet. Mistakes are recorded when you get something wrong twice —
            come back after a few practice sessions, exams or vivas.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {mistakes.map((m) => (
              <li key={m.id} className="rounded-xl border border-ink-100 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-ink-900">{m.mistakeType}</span>
                  <span className="chip bg-amber-400/20 text-amber-700">
                    {m.occurrences}× repeated
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-600">{m.description}</p>
                {m.topic && <p className="mt-1 text-xs text-ink-400">Topic: {m.topic}</p>}
                <button
                  onClick={() => startMission(m.id)}
                  disabled={creating}
                  className="btn-primary mt-3 text-xs"
                >
                  {creating ? "Building mission…" : "Build repair mission"}
                </button>
              </li>
            ))}
          </ul>
        )}
        {mistakes.length === 0 && missions.length === 0 && (
          <button onClick={() => startMission()} disabled={creating} className="btn-ghost mt-4 text-xs">
            {creating ? "Checking…" : "Try auto-detect"}
          </button>
        )}
        {error && <p className="mt-3 text-xs text-coral-500">{error}</p>}
      </section>

      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-ink-500">Mission history</h2>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {missions.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-ink-200 p-6 text-center text-sm text-ink-500">
              No missions yet.
            </div>
          )}
          {missions.map((m) => (
            <button key={m.id} onClick={() => openMission(m.id)} className="card p-4 text-left">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-ink-900">{m.title}</span>
                <span
                  className={clsx(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    m.status === "COMPLETED"
                      ? "bg-mint-500/15 text-mint-700"
                      : m.status === "ABANDONED"
                        ? "bg-ink-100 text-ink-400"
                        : "bg-amber-400/20 text-amber-700",
                  )}
                >
                  {m.status === "COMPLETED"
                    ? `${m.stepsCompleted}/${m.stepsTotal}`
                    : m.status}
                </span>
              </div>
              <span className="mt-1 block text-xs text-ink-400">
                {m.topic} · {new Date(m.createdAt).toLocaleDateString()}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
