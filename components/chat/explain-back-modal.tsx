"use client";

import { useState } from "react";
import { X, Brain, AlertTriangle, CheckCircle2 } from "lucide-react";

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
      <div className="rounded-2xl border-2 border-ink-100 bg-white w-full max-w-lg p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-400/15 text-purple-500">
              <Brain className="h-5 w-5" />
            </span>
            <h3 className="text-lg font-extrabold text-ink-900">Explain It Back</h3>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ink-100 text-ink-400 hover:text-ink-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!result ? (
          <>
            <p className="text-sm text-ink-500 mb-3">
              In your own words, explain what you just learned about <strong className="text-ink-700">{topic || "this topic"}</strong>.
            </p>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="I learned that..."
              className="mb-3 w-full rounded-xl border-2 border-ink-200 px-4 py-3 text-sm text-ink-800 placeholder:text-ink-400 focus:border-sky-500 focus:outline-none"
              rows={5}
              disabled={loading}
            />
            {error && <p className="text-xs text-coral-500 mb-2">{error}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="btn-ghost text-sm rounded-xl">Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={!explanation.trim() || loading}
                className="btn-primary text-sm rounded-xl"
              >
                {loading ? "Analyzing..." : "Submit"}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {/* Score ring */}
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-mint-400/15 border-2 border-mint-200">
                <span className="text-xl font-bold text-mint-600">{Math.round(result.understandingScore)}</span>
              </div>
              <div>
                <p className="font-extrabold text-ink-900">Understanding Score</p>
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
                <p className="text-sm font-extrabold text-ink-800 mb-1.5 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Areas to review:
                </p>
                <ul className="space-y-2">
                  {result.misconceptions.map((mc, i) => (
                    <li key={i} className="rounded-xl border-2 border-amber-200 bg-amber-50 p-2.5 text-xs">
                      <p className="text-ink-700">{mc.description}</p>
                      <p className="text-mint-600 mt-1 font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {mc.correction}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end">
              <button onClick={onClose} className="btn-primary text-sm rounded-xl">Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 80 ? "bg-mint-400" : value >= 50 ? "bg-amber-400" : "bg-coral-500";

  return (
    <div>
      <p className="text-xs font-medium text-ink-500 mb-1">{label}</p>
      <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.round(value)}%` }} />
      </div>
      <p className="text-xs font-bold text-ink-700 mt-0.5">{Math.round(value)}%</p>
    </div>
  );
}
