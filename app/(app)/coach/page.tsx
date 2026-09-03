"use client";

import { useState } from "react";
import { Users } from "lucide-react";

interface CoachReport {
  didWell: string[];
  struggledWith: string[];
  commonMistake: string;
  revisionConcept: string;
  recommendedPractice: string;
  recommendedDifficulty: string;
  nextTopic: string;
  confidenceNote: string | null;
}

function difficultyLabel(d: string): string {
  return d === "REAL_WORLD" ? "Real-world problems" : d.charAt(0) + d.slice(1).toLowerCase();
}

export default function CoachPage() {
  const [report, setReport] = useState<CoachReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tried, setTried] = useState(false);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/coach-report", { method: "POST" });
      if (!res.ok) {
        setError(
          res.status === 503
            ? "The coach could not analyse your data right now. Try again in a moment."
            : "Could not generate the report. Please try again.",
        );
        return;
      }
      setReport(await res.json());
    } catch {
      setError("Could not generate the report. Please try again.");
    } finally {
      setBusy(false);
      setTried(true);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/15 text-sky-500">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">AI Learning Coach</h1>
          <p className="mt-0.5 text-sm text-ink-500">
            A report built only from your real data — sessions, attempts, hints, mistakes, and
            confidence checks. No invented statistics, ever.
          </p>
        </div>
      </section>

      {!report && (
        <section className="rounded-2xl border-2 border-ink-100 bg-white max-w-2xl p-6 text-center">
          <h2 className="text-lg font-bold text-ink-900">How am I really doing?</h2>
          <p className="mt-2 text-sm text-ink-500">
            The coach reviews your recent learning history and tells you what to do next:
            what is working, what is not, and the single best next step.
          </p>
          <button onClick={generate} disabled={busy} className="btn-primary mt-4">
            {busy ? "Reviewing your learning history…" : "Generate my report"}
          </button>
          {error && <p className="mt-3 text-xs text-coral-500">{error}</p>}
          {tried && !error && !busy && (
            <p className="mt-3 text-xs text-ink-400">Nothing generated yet.</p>
          )}
        </section>
      )}

      {report && (
        <>
          <section className="rounded-2xl border-2 border-ink-100 bg-white max-w-2xl p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
                What went well
              </span>
              <span className="chip ml-auto bg-mint-500/15 text-mint-700">Keep it up</span>
            </div>
            {report.didWell.length > 0 ? (
              <ul className="mt-2 space-y-1 text-sm text-ink-700">
                {report.didWell.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-ink-500">Nothing recorded yet — go solve something.</p>
            )}
          </section>

          <section className="rounded-2xl border-2 border-ink-100 bg-white max-w-2xl p-6">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
              What struggled
            </span>
            {report.struggledWith.length > 0 ? (
              <ul className="mt-2 space-y-1 text-sm text-ink-700">
                {report.struggledWith.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-ink-500">No weak spots detected in recent data.</p>
            )}
          </section>

          <section className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border-2 border-ink-100 bg-white p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500">
                Common mistake
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-800">{report.commonMistake}</p>
            </div>
            <div className="rounded-2xl border-2 border-ink-100 bg-white p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500">
                Revise this concept
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-800">
                {report.revisionConcept}
              </p>
            </div>
            <div className="rounded-2xl border-2 border-ink-100 bg-white p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500">
                Recommended practice
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-800">
                {report.recommendedPractice}
              </p>
            </div>
            <div className="rounded-2xl border-2 border-ink-100 bg-white p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500">
                Next topic
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-800">{report.nextTopic}</p>
              <span className="chip mt-3 block w-fit">
                Difficulty: {difficultyLabel(report.recommendedDifficulty)}
              </span>
            </div>
          </section>

          {report.confidenceNote && (
            <section className="rounded-2xl border-2 border-ink-100 bg-white border-l-4 border-mint-400 p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500">
                Confidence check
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-700">{report.confidenceNote}</p>
            </section>
          )}

          <button
            onClick={generate}
            disabled={busy}
            className="btn-primary max-w-2xl w-full"
          >
            {busy ? "Refreshing…" : "Refresh report"}
          </button>
        </>
      )}
    </div>
  );
}
