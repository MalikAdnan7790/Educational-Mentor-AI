"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { AlertTriangle, Trophy } from "lucide-react";
import { AttemptInput } from "@/components/session/attempt-input";
import { FeedbackPanel } from "@/components/session/feedback-panel";
import { HintPanel } from "@/components/session/hint-panel";
import { AttemptHistory } from "@/components/session/attempt-history";
import { ConfidenceSelector } from "@/components/session/confidence-selector";
import { ReflectionForm } from "@/components/session/reflection-form";
import { ExplainAnswerCard } from "@/components/session/explain-answer-card";
import type { AnalysisResult } from "@/lib/independent-engine";

interface Attempt {
  id: string;
  attemptNumber: number;
  answer: string;
  isCorrect: boolean;
  hintLevelUsed: number;
  timeTakenSec: number | null;
  mistakeType: string;
  reasoning: string;
  aiFeedback: string;
}

interface Hint {
  level: number;
  content: string;
  kind: string;
}

interface MistakePrediction {
  likelyMistake: string;
  warning: string;
  tip: string;
}

interface SessionData {
  id: string;
  mode: string;
  isAiFree: boolean;
  status: string;
  currentHintLevel: number;
  startedAt: string;
  finishedAt: string | null;
  problem: {
    id: string;
    title: string;
    content: string;
    solution: string;
    topic: string;
    subject: string;
    difficulty: string;
  };
  attempts: Attempt[];
  hintEvents: { level: number; content: string }[];
  confidenceChecks: { confidence: number; actualCorrect: boolean }[];
  reflections: { question: string; answer: string }[];
  explainAnswers: {
    id: string;
    answerWasCorrect: boolean;
    explanation: string;
    reasoningCorrect: boolean;
    reasoningScore: number;
    feedback: string;
    createdAt: string;
  }[];
}

function guessHintKind(level: number): string {
  return (
    {
      1: "question",
      2: "concept",
      3: "method",
      4: "step-guide",
      5: "partial-solution",
      6: "full-solution",
    }[level] ?? "hint"
  );
}

export function SessionView({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [hints, setHints] = useState<Hint[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [prediction, setPrediction] = useState<MistakePrediction | null>(null);
  const [confidenceValue, setConfidenceValue] = useState<number | null>(null);
  const [showConfidencePrompt, setShowConfidencePrompt] = useState(false);
  const [newAchievements, setNewAchievements] = useState<
    { key: string; title: string; description: string }[]
  >([]);

  const attemptStartRef = useRef<number>(Date.now());

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (!res.ok) throw new Error("Failed to load session");
        const data: SessionData = await res.json();
        setSession(data);
        setAttempts(data.attempts);
        setHints(
          data.hintEvents.map((h) => ({
            level: h.level,
            content: h.content,
            kind: guessHintKind(h.level),
          }))
        );
        if (data.confidenceChecks.length > 0) {
          const last = data.confidenceChecks[data.confidenceChecks.length - 1];
          setConfidenceValue(last.confidence);
        }
        attemptStartRef.current = Date.now();

        // Predict My Mistake: personal warning before the first attempt only
        if (data.status === "ACTIVE" && data.attempts.length === 0) {
          fetch("/api/predict-mistake", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              problem: data.problem.content,
              subject: data.problem.subject,
              topic: data.problem.topic,
              difficulty: data.problem.difficulty,
            }),
          })
            .then((r) => (r.ok ? r.json() : null))
            .then((p) => {
              if (p && p.likelyMistake) setPrediction(p);
            })
            .catch(() => {});
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  const submitAttempt = async () => {
    if (!session || !answer.trim()) return;
    setSubmitting(true);
    try {
      const timeTakenSec = Math.round((Date.now() - attemptStartRef.current) / 1000);
      const res = await fetch(`/api/sessions/${sessionId}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: answer.trim(), timeTakenSec }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to submit");
      }
      const { attempt, analysis: a, newAchievements: earned } = await res.json();
      const nextAttempts = [...attempts, attempt as Attempt];
      setAttempts(nextAttempts);
      setAnalysis(a as AnalysisResult);
      setAnswer("");
      attemptStartRef.current = Date.now();
      if (Array.isArray(earned) && earned.length > 0) setNewAchievements(earned);

      // In AI-Free mode, prompt for confidence after the first attempt
      if (session.isAiFree && nextAttempts.length === 1 && confidenceValue === null) {
        setShowConfidencePrompt(true);
      }

      if (a.nextAction === "accept") {
        setSession({ ...session, status: "COMPLETED" });
      } else if (a.nextAction === "reveal") {
        setHints((prev) => [
          ...prev,
          { level: 6, content: session.problem.solution, kind: "full-solution" },
        ]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  const requestHint = async () => {
    if (!session) return;
    setHintLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/hint`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to request hint");
      const { hint } = await res.json();
      setHints((prev) => [...prev, { ...hint, kind: hint.kind }]);
      setSession({ ...session, currentHintLevel: hint.level });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setHintLoading(false);
    }
  };

  const recordConfidence = async (val: number) => {
    setConfidenceValue(val);
    setShowConfidencePrompt(false);
    try {
      await fetch(`/api/sessions/${sessionId}/confidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confidence: val }),
      });
    } catch {
      // non-critical — swallow
    }
  };

  const finishSession = async (payload: {
    confidence?: number;
    reflection?: { question: string; answer: string };
  }) => {
    if (!session) return;
    setFinishing(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to finish");
      const result = await res.json();
      setSession({ ...session, status: result.sessionStatus });
      setNewAchievements(result.newAchievements ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setFinishing(false);
    }
  };

  const abandon = async () => {
    if (!confirm("Abandon this session? Your progress will be lost.")) return;
    await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border-2 border-ink-100 bg-white px-6 py-4 shadow-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint-400/15 text-mint-500">
            <AlertTriangle className="h-5 w-5 animate-pulse" />
          </span>
          <div className="text-sm font-bold text-ink-700">Loading session…</div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-2xl border-2 border-ink-100 bg-white max-w-md p-6 text-center">
          <h2 className="text-lg font-extrabold text-ink-900">Something went wrong</h2>
          <p className="mt-2 text-sm text-ink-600">{error ?? "Session not found"}</p>
          <button onClick={() => router.push("/")} className="btn-primary mt-4">
            Back to home
          </button>
        </div>
      </div>
    );
  }

  const isComplete =
    session.status === "COMPLETED" ||
    session.status === "REVEALED" ||
    session.status === "ABANDONED";
  const aiFreeLocked = session.isAiFree && attempts.length === 0;
  const showSolution = session.status === "REVEALED" || hints.some((h) => h.level === 6);
  const lastAttempt = attempts.at(-1);
  const lastConfidence = session.confidenceChecks.at(-1);

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="border-b-2 border-ink-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-ink-500">
              <button onClick={() => router.push("/")} className="hover:text-ink-900">
                Home
              </button>
              <span>/</span>
              <span>Session</span>
            </div>
            <h1 className="mt-1 text-lg font-extrabold text-ink-900">
              {session.problem.title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="chip">{session.mode}</span>
            {session.isAiFree && (
              <span className="chip bg-amber-400/20 text-amber-700">AI-Free</span>
            )}
            <span
              className={clsx(
                "chip",
                session.status === "ACTIVE" && "bg-mint-500/15 text-mint-700",
                session.status === "COMPLETED" && "bg-mint-500/25 text-mint-800",
                session.status === "REVEALED" && "bg-coral-500/15 text-coral-700"
              )}
            >
              {session.status}
            </span>
            {!isComplete && (
              <button onClick={abandon} className="btn-ghost text-xs">
                Abandon
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {newAchievements.length > 0 && (
          <div className="mb-6 rounded-2xl border-2 border-mint-500/40 bg-mint-500/10 p-5">
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-mint-800">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-mint-400/20 text-mint-600">
                <Trophy className="h-4 w-4" />
              </span>
              Achievement{newAchievements.length > 1 ? "s" : ""} Unlocked
            </h3>
            <ul className="mt-2 space-y-1">
              {newAchievements.map((a) => (
                <li key={a.key} className="text-sm text-mint-700">
                  <strong>{a.title}</strong> — {a.description}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <div className="rounded-2xl border-2 border-ink-100 bg-white p-6">
              <div className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
                <span className="chip">{session.problem.subject}</span>
                <span className="chip">{session.problem.topic}</span>
                <span className="chip">{session.problem.difficulty}</span>
              </div>
              <h2 className="mt-3 text-xl font-extrabold text-ink-900">
                {session.problem.title}
              </h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
                {session.problem.content}
              </p>
            </div>

            {prediction && !isComplete && (
              <div className="rounded-2xl border-2 border-amber-400/40 bg-amber-400/10 p-6">
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-amber-700">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-amber-400/20 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                  Watch out
                </h3>
                {attempts.length === 0 ? (
                  <>
                    <p className="mt-2 text-sm font-medium text-ink-900">
                      {prediction.likelyMistake}
                    </p>
                    <p className="mt-1 text-sm text-ink-700">{prediction.warning}</p>
                    <p className="mt-3 rounded-lg bg-white/70 p-3 text-sm text-ink-800">
                      <strong>Before you start:</strong> {prediction.tip}
                    </p>
                  </>
                ) : (
                  lastAttempt &&
                  !lastAttempt.isCorrect && (
                    <p className="mt-2 text-sm text-ink-700">
                      <strong>Predicted mistake:</strong> {prediction.likelyMistake}
                      <br />
                      <strong>What actually happened:</strong> {lastAttempt.mistakeType}
                      <em className="mt-1 block text-xs text-amber-700">
                        Compare the two — if they match, this is your pattern. Fix it before the next attempt.
                      </em>
                    </p>
                  )
                )}
              </div>
            )}

            {showSolution && (
              <div className="rounded-2xl border-2 border-coral-500/30 bg-coral-500/5 p-6">
                <h3 className="text-sm font-extrabold text-coral-700">Full Solution</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm text-ink-800">
                  {session.problem.solution}
                </p>
              </div>
            )}

            <AttemptHistory attempts={attempts as any} />
          </div>

          <div className="space-y-6 lg:col-span-2">
            {!isComplete && (
              <div className="rounded-2xl border-2 border-ink-100 bg-white p-6">
                <h3 className="text-sm font-extrabold text-ink-900">Your attempt</h3>
                <div className="mt-3">
                  <AttemptInput
                    value={answer}
                    onChange={setAnswer}
                    onSubmit={submitAttempt}
                    disabled={submitting}
                    placeholder={
                      aiFreeLocked
                        ? "Solve this problem on your own. No hints allowed until you submit."
                        : "Show your reasoning, not just the final answer…"
                    }
                  />
                </div>
              </div>
            )}

            {analysis && lastAttempt && (
              <FeedbackPanel analysis={analysis} attemptNumber={lastAttempt.attemptNumber} />
            )}

            {showConfidencePrompt && confidenceValue === null && lastAttempt && (
              <ConfidenceSelector
                onSubmit={recordConfidence}
                actualCorrect={lastAttempt.isCorrect}
              />
            )}

            {!isComplete && (
              <HintPanel
                hints={hints}
                onRequest={requestHint}
                loading={hintLoading}
                locked={aiFreeLocked}
                lockReason={
                  aiFreeLocked
                    ? "Hints are locked in AI-Free mode until you submit your first attempt."
                    : undefined
                }
              />
            )}

            {isComplete && session.status !== "ABANDONED" && lastConfidence === undefined && (
              <ConfidenceSelector
                onSubmit={recordConfidence}
                actualCorrect={!!lastAttempt?.isCorrect}
              />
            )}

            {isComplete && session.status !== "ABANDONED" && (
              <ReflectionForm
                onSubmit={(r) => finishSession({ reflection: r })}
                loading={finishing}
              />
            )}

            {isComplete && session.status !== "ABANDONED" && attempts.length > 0 && (
              <ExplainAnswerCard
                sessionId={sessionId}
                existing={session.explainAnswers ?? []}
              />
            )}

            {isComplete && (
              <div className="rounded-2xl border-2 border-ink-100 bg-white p-6 text-center">
                <h3 className="text-lg font-extrabold text-ink-900">Session complete</h3>
                <p className="mt-2 text-sm text-ink-600">
                  {session.status === "COMPLETED"
                    ? "Great work — you solved it."
                    : session.status === "REVEALED"
                    ? "The full solution was revealed. Study it, then try a similar problem."
                    : "This session was abandoned."}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="btn-ghost flex-1"
                  >
                    View dashboard
                  </button>
                  <button onClick={() => router.push("/")} className="btn-primary flex-1">
                    Next problem
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
