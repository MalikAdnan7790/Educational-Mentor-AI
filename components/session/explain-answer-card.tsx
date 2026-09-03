"use client";

import { useState } from "react";
import clsx from "clsx";
import { BookOpen } from "lucide-react";

export interface ExplainAnswerRecord {
  id: string;
  answerWasCorrect: boolean;
  explanation: string;
  reasoningCorrect: boolean;
  reasoningScore: number;
  feedback: string;
  createdAt: string;
}

interface ExplainResult {
  answerWasCorrect: boolean;
  reasoningCorrect: boolean;
  reasoningScore: number;
  feedback: string;
}

export function ExplainAnswerCard({
  sessionId,
  existing,
}: {
  sessionId: string;
  existing: ExplainAnswerRecord[];
}) {
  const [explanation, setExplanation] = useState("");
  const [result, setResult] = useState<ExplainResult | null>(existing.at(-1) ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (explanation.trim().length < 5) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ explanation: explanation.trim() }),
      });
      if (!res.ok) {
        setError("Could not analyse your reasoning. Please try again.");
        return;
      }
      setResult(await res.json());
    } catch {
      setError("Could not analyse your reasoning. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="rounded-2xl border-2 border-ink-100 bg-white p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-400/15 text-purple-500">
            <BookOpen className="h-5 w-5" />
          </span>
          <div className="text-xs font-bold uppercase tracking-wider text-ink-500">
            Explain your answer
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={clsx(
              "rounded-xl px-2.5 py-1 text-xs font-bold",
              result.answerWasCorrect
                ? "bg-mint-500/15 text-mint-700"
                : "bg-coral-500/10 text-coral-600",
            )}
          >
            Answer: {result.answerWasCorrect ? "correct" : "incorrect"}
          </span>
          <span
            className={clsx(
              "rounded-xl px-2.5 py-1 text-xs font-bold",
              result.reasoningCorrect
                ? "bg-mint-500/15 text-mint-700"
                : "bg-amber-400/20 text-amber-700",
            )}
          >
            Reasoning: {result.reasoningCorrect ? "sound" : "needs work"}
          </span>
          <span className="ml-auto text-xs font-bold text-ink-500">
            {Math.round(result.reasoningScore)}/100
          </span>
        </div>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-700">
          {result.feedback}
        </p>
        <p className="mt-3 text-xs font-medium text-ink-400">
          A right answer with shaky reasoning is not the same as understanding — both are graded
          separately on purpose.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-ink-100 bg-white p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-400/15 text-purple-500">
          <BookOpen className="h-5 w-5" />
        </span>
        <div className="text-xs font-bold uppercase tracking-wider text-ink-500">
          Explain your answer
        </div>
      </div>
      <p className="mt-2 text-sm font-bold text-ink-800">
        Why do you think your answer is correct?
      </p>
      <p className="mt-1 text-xs font-medium text-ink-500">
        Your reasoning is graded separately from the answer itself — this is where real
        understanding shows.
      </p>
      <textarea
        value={explanation}
        onChange={(e) => setExplanation(e.target.value)}
        className="mt-3 w-full rounded-xl border-2 border-ink-200 px-4 py-3 text-sm text-ink-800 placeholder:text-ink-400 focus:border-sky-500 focus:outline-none"
        rows={3}
        placeholder="Explain your reasoning — why must the answer be what it is?"
        maxLength={8000}
      />
      {error && <p className="mt-2 text-xs font-medium text-coral-500">{error}</p>}
      <button
        disabled={busy || explanation.trim().length < 5}
        onClick={submit}
        className="btn-primary mt-3 w-full"
      >
        {busy ? "Analysing…" : "Explain my reasoning"}
      </button>
    </div>
  );
}
