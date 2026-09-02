"use client";

import { useState } from "react";

interface ExplainBackResult {
  understandingScore: number;
  accuracyPct: number;
  completenessPct: number;
  reasoningPct: number;
  misconceptions: { description: string; correction: string }[];
  feedback: string;
}

interface ExplainBackModalProps {
  conversationId: string;
  subjectKey: string | null;
  topic: string | null;
  onClose: () => void;
}

export function ExplainBackModal({
  conversationId,
  subjectKey,
  topic,
  onClose,
}: ExplainBackModalProps) {
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExplainBackResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!explanation.trim() || !topic) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/explain-back", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          subjectKey: subjectKey ?? undefined,
          topic,
          explanation: explanation.trim(),
        }),
      });

      if (!res.ok) {
        setError("Failed to analyze. Try again.");
        return;
      }

      const data = await res.json();
      setResult(data);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-sm p-4">
      <div className="card w-full max-w-lg p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-ink-900">Explain It Back</h3>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-600 text-xl leading-none">×</button>
        </div>

        {!result ? (
          <>
            <p className="text-sm text-ink-500 mb-3">
              In your own words, explain what you just learned about <strong>{topic || "this topic"}</strong>.
            </p>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="I learned that…"
              className="textarea mb-3"
              rows={5}
              disabled={loading}
            />
            {error && <p className="text-xs text-coral-500 mb-2">{error}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="btn-ghost text-sm">Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={!explanation.trim() || loading}
                className="btn-primary text-sm"
              >
                {loading ? "Analyzing…" : "Submit"}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {/* Score ring */}
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-mint-500/15 text-mint-600">
                <span className="text-xl font-bold">{Math.round(result.understandingScore)}</span>
              </div>
              <div>
                <p className="font-medium text-ink-900">Understanding Score</p>
                <p className="text-sm text-ink-500">{result.feedback}</p>
              </div>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-3 gap-3">
              <ScoreBar label="Accuracy" value={result.accuracyPct} />
              <ScoreBar label="Completeness" value={result.completenessPct} />
              <ScoreBar label="Reasoning" value={result.reasoningPct} />
            </div>

            {/* Misconceptions */}
            {result.misconceptions.length > 0 && (
              <div>
                <p className="text-sm font-medium text-ink-800 mb-1.5">Areas to review:</p>
                <ul className="space-y-2">
                  {result.misconceptions.map((mc, i) => (
                    <li key={i} className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-2.5 text-xs">
                      <p className="text-ink-700">{mc.description}</p>
                      <p className="text-mint-600 mt-1">{mc.correction}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end">
              <button onClick={onClose} className="btn-primary text-sm">Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 80 ? "bg-mint-500" : value >= 50 ? "bg-amber-400" : "bg-coral-500";

  return (
    <div>
      <p className="text-xs text-ink-500 mb-1">{label}</p>
      <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.round(value)}%` }} />
      </div>
      <p className="text-xs font-medium text-ink-700 mt-0.5">{Math.round(value)}%</p>
    </div>
  );
}
