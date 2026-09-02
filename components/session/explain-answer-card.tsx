"use client";

import { useState } from "react";
import clsx from "clsx";

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
      <div className="card p-5">
        <div className="text-xs font-medium uppercase tracking-wider text-ink-500">
          Explain your answer
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={clsx(
              "rounded-full px-2.5 py-1 text-xs font-semibold",
              result.answerWasCorrect
                ? "bg-mint-500/15 text-mint-700"
                : "bg-coral-500/10 text-coral-600",
            )}
          >
            Answer: {result.answerWasCorrect ? "correct" : "incorrect"}
          </span>
          <span
            className={clsx(
              "rounded-full px-2.5 py-1 text-xs font-semibold",
              result.reasoningCorrect
                ? "bg-mint-500/15 text-mint-700"
                : "bg-amber-400/20 text-amber-700",
            )}
          >
            Reasoning: {result.reasoningCorrect ? "sound" : "needs work"}
          </span>
          <span className="ml-auto text-xs text-ink-500">
            {Math.round(result.reasoningScore)}/100
          </span>
        </div>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-700">
          {result.feedback}
        </p>
        <p className="mt-3 text-xs text-ink-400">
          A right answer with shaky reasoning is not the same as understanding — both are graded
          separately on purpose.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="text-xs font-medium uppercase tracking-wider text-ink-500">
        Explain your answer
      </div>
      <p className="mt-2 text-sm font-medium text-ink-800">
        Why do you think your answer is correct?
      </p>
      <p className="mt-1 text-xs text-ink-500">
        Your reasoning is graded separately from the answer itself — this is where real
        understanding shows.
      </p>
      <textarea
        value={explanation}
        onChange={(e) => setExplanation(e.target.value)}
        className="textarea mt-3"
        rows={3}
        placeholder="Explain your reasoning — why must the answer be what it is?"
        maxLength={8000}
      />
      {error && <p className="mt-2 text-xs text-coral-500">{error}</p>}
      <button
        disabled={busy || explanation.trim().length < 5}
        onClick={submit}
        className="btn-mint mt-3 w-full"
      >
        {busy ? "Analysing…" : "Explain my reasoning"}
      </button>
    </div>
  );
}
