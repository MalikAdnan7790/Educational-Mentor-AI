"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Brain } from "lucide-react";

interface Subject {
  key: string;
  name: string;
}

interface TeachEvaluation {
  accuracyPct: number;
  missingConcepts: string[];
  misconceptions: string[];
  clarityPct: number;
  exampleQualityPct: number;
  understandingScore: number;
  feedback: string;
}

type View = "setup" | "teach" | "result";

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-ink-600">{label}</span>
        <span className="font-semibold text-ink-900">{Math.round(value)}%</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-ink-100">
        <div
          className={clsx(
            "h-full rounded-full transition-all",
            value >= 70 ? "bg-mint-500" : value >= 40 ? "bg-amber-400" : "bg-coral-400",
          )}
          style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

export default function TeachPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [prompt, setPrompt] = useState<string | null>(null);
  const [explanation, setExplanation] = useState("");
  const [evaluation, setEvaluation] = useState<TeachEvaluation | null>(null);
  const [view, setView] = useState<View>("setup");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/subjects")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setSubjects(data.map((s: any) => ({ key: s.key, name: s.name }))))
      .catch(() => {});
  }, []);

  async function startTeaching() {
    if (topic.trim().length < 2) {
      setError("What topic will you teach?");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/teach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject || undefined, topic: topic.trim() }),
      });
      if (!res.ok) {
        setError("Could not start the teaching session. Please try again.");
        return;
      }
      const data = await res.json();
      setPrompt(data.prompt);
      setExplanation("");
      setEvaluation(null);
      setView("teach");
    } finally {
      setBusy(false);
    }
  }

  async function submitExplanation() {
    if (!topic.trim() || explanation.trim().length < 10) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/teach/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject || undefined,
          topic: topic.trim(),
          explanation: explanation.trim(),
        }),
      });
      if (!res.ok) {
        setError("Could not evaluate your explanation. Please try again.");
        return;
      }
      setEvaluation(await res.json());
      setView("result");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setView("setup");
    setPrompt(null);
    setExplanation("");
    setEvaluation(null);
    setError(null);
  }

  return (
    <div className="space-y-6">
      <section className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-400/15 text-purple-500">
          <Brain className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">Teach Me</h1>
          <p className="mt-1 text-sm text-ink-500">
            The best test of understanding is teaching. You become the teacher — the AI becomes
            your student — and gets evaluated on accuracy, clarity, and examples.
          </p>
        </div>
      </section>

      {view === "setup" && (
        <section className="rounded-2xl border-2 border-ink-100 bg-white max-w-xl p-6">
          <h2 className="text-sm font-bold text-ink-900">Pick a topic to teach</h2>
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
              <label className="text-xs font-medium text-ink-600">Topic you will teach</label>
              <input
                className="input mt-1 w-full"
                placeholder="e.g. Inheritance, Photosynthesis, Newton's third law"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={200}
              />
            </div>
            {error && <p className="text-xs text-coral-500">{error}</p>}
            <button onClick={startTeaching} disabled={busy} className="btn-primary w-full">
              {busy ? "Preparing your student…" : "Start teaching"}
            </button>
          </div>
        </section>
      )}

      {view === "teach" && prompt && (
        <section className="rounded-2xl border-2 border-ink-100 bg-white max-w-2xl p-6">
          <div className="flex items-center gap-2 text-xs text-ink-400">
            <span className="chip bg-purple-500/15 text-purple-700">Your student asks</span>
            <span>{topic}</span>
          </div>
          <p className="mt-3 text-lg font-medium leading-relaxed text-ink-900">{prompt}</p>
          <div className="mt-4 rounded-2xl border-2 border-ink-100 bg-ink-50/50 p-3 text-xs text-ink-500">
            Teach in your own words. Use an example or an analogy if you can — good examples are
            part of the grade.
          </div>
          <textarea
            className="input mt-4 min-h-[160px] w-full"
            placeholder="Okay, imagine… Here is how it works…"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            maxLength={8000}
            disabled={busy}
          />
          {error && <p className="mt-2 text-xs text-coral-500">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button
              onClick={submitExplanation}
              disabled={busy || explanation.trim().length < 10}
              className="btn-primary flex-1"
            >
              {busy ? "Your student is listening…" : "Teach it"}
            </button>
            <button onClick={reset} disabled={busy} className="btn-ghost">
              Cancel
            </button>
          </div>
        </section>
      )}

      {view === "result" && evaluation && (
        <section className="rounded-2xl border-2 border-ink-100 bg-white max-w-2xl p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
              {topic} — teacher evaluation
            </span>
            <span
              className={clsx(
                "ml-auto rounded-xl px-2.5 py-1 text-xs font-semibold",
                evaluation.understandingScore >= 70
                  ? "bg-mint-500/15 text-mint-700"
                  : evaluation.understandingScore >= 40
                    ? "bg-amber-400/20 text-amber-700"
                    : "bg-coral-500/10 text-coral-600",
              )}
            >
              Understanding: {Math.round(evaluation.understandingScore)}/100
            </span>
          </div>

          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink-800">
            {evaluation.feedback}
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ScoreBar label="Accuracy" value={evaluation.accuracyPct} />
            <ScoreBar label="Clarity" value={evaluation.clarityPct} />
            <ScoreBar label="Example quality" value={evaluation.exampleQualityPct} />
          </div>

          {(evaluation.missingConcepts.length > 0 || evaluation.misconceptions.length > 0) && (
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {evaluation.missingConcepts.length > 0 && (
                <div className="rounded-2xl border-2 border-amber-400/40 bg-amber-400/10 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700">
                    Missing concepts
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-ink-700">
                    {evaluation.missingConcepts.map((m, i) => (
                      <li key={i}>• {m}</li>
                    ))}
                  </ul>
                </div>
              )}
              {evaluation.misconceptions.length > 0 && (
                <div className="rounded-2xl border-2 border-coral-400/40 bg-coral-500/5 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-coral-600">
                    Misconceptions to fix
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-ink-700">
                    {evaluation.misconceptions.map((m, i) => (
                      <li key={i}>• {m}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <p className="mt-4 text-xs text-ink-400">
            Teaching a topic well counts as mastery evidence for it.
          </p>
          <button onClick={reset} className="btn-primary mt-4">
            Teach another topic
          </button>
        </section>
      )}
    </div>
  );
}
