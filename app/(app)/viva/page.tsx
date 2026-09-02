"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

interface Subject {
  key: string;
  name: string;
}

interface VivaQuestionView {
  id: string;
  order: number;
  question: string;
  concept: string | null;
  studentAnswer?: string | null;
  isCorrect?: boolean | null;
  understanding?: number | null;
  feedback?: string | null;
}

interface VivaDetail {
  id: string;
  topic: string;
  subjectKey: string | null;
  difficulty: string;
  language: string;
  status: string;
  totalScore: number | null;
  questionCount: number;
  summary: {
    strongAreas: string[];
    weakAreas: string[];
    practiceTopics: string[];
    feedback: string;
  } | null;
  questions: VivaQuestionView[];
}

interface VivaListItem {
  id: string;
  topic: string;
  status: string;
  totalScore: number | null;
  difficulty: string;
  createdAt: string;
  _count: { questions: number };
}

type View = "setup" | "question" | "feedback" | "summary";

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;
const LANGUAGES = [
  { value: "EN", label: "English" },
  { value: "UR", label: "اردو Urdu" },
  { value: "ROMAN_UR", label: "Roman Urdu" },
] as const;

export default function VivaPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [past, setPast] = useState<VivaListItem[]>([]);

  const [subjectKey, setSubjectKey] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>("MEDIUM");
  const [language, setLanguage] = useState<(typeof LANGUAGES)[number]["value"]>("EN");
  const [questionCount, setQuestionCount] = useState(5);

  const [view, setView] = useState<View>("setup");
  const [viva, setViva] = useState<VivaDetail | null>(null);
  const [current, setCurrent] = useState<VivaQuestionView | null>(null);
  const [graded, setGraded] = useState<VivaQuestionView | null>(null);
  const [summary, setSummary] = useState<VivaDetail["summary"]>(null);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/subjects")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setSubjects(data.map((s: any) => ({ key: s.key, name: s.name }))))
      .catch(() => {});
    refreshPast();
  }, []);

  async function refreshPast() {
    const res = await fetch("/api/viva");
    if (res.ok) setPast(await res.json());
  }

  // Restore an in-progress viva on page load
  useEffect(() => {
    if (view !== "setup" || past.length === 0) return;
    const active = past.find((v) => v.status === "ACTIVE");
    if (!active) return;
    fetch(`/api/viva/${active.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: VivaDetail | null) => {
        if (!d) return;
        setViva(d);
        const last = d.questions.at(-1);
        if (!last) return;
        if (last.studentAnswer) {
          setGraded(last);
          setView("feedback");
        } else {
          setCurrent(last);
          setView("question");
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [past]);

  async function startViva() {
    if (!topic.trim()) {
      setError("Enter a topic for your viva.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/viva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectKey: subjectKey || undefined,
          topic: topic.trim(),
          difficulty,
          language,
          questionCount,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          data.error === "ai_not_configured"
            ? "AI is not configured on this server."
            : "Could not start the viva. Please try again.",
        );
        return;
      }
      const data = await res.json();
      setViva({ id: data.viva.id, topic: data.viva.topic, subjectKey: data.viva.subjectKey, difficulty: data.viva.difficulty, language: data.viva.language, status: "ACTIVE", totalScore: null, questionCount, summary: null, questions: [data.question] });
      setCurrent(data.question);
      setGraded(null);
      setSummary(null);
      setAnswer("");
      setView("question");
    } finally {
      setBusy(false);
    }
  }

  async function submitAnswer() {
    if (!viva || !current || !answer.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/viva/${viva.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: answer.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error === "grading_failed" ? "Grading failed — please submit again." : "Could not submit your answer.");
        return;
      }
      const data = await res.json();
      setGraded(data.question);
      setView("feedback");
      setAnswer("");
    } finally {
      setBusy(false);
    }
  }

  async function nextStep() {
    if (!viva) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/viva/${viva.id}/next`, { method: "POST" });
      if (!res.ok) {
        setError("Could not load the next question. Press Next again to retry.");
        return;
      }
      const data = await res.json();
      if (data.finished) {
        setSummary(data.summary);
        setFinalScore(data.totalScore);
        setViva((v) => (v ? { ...v, status: "COMPLETED", totalScore: data.totalScore, summary: data.summary } : v));
        setView("summary");
        refreshPast();
      } else {
        setCurrent(data.question);
        setGraded(null);
        setView("question");
      }
    } finally {
      setBusy(false);
    }
  }

  async function abandonViva() {
    if (!viva || !confirm("End this viva without completing it?")) return;
    await fetch(`/api/viva/${viva.id}`, { method: "DELETE" });
    resetToSetup();
    refreshPast();
  }

  function resetToSetup() {
    setView("setup");
    setViva(null);
    setCurrent(null);
    setGraded(null);
    setSummary(null);
    setAnswer("");
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-ink-900">AI Viva</h1>
        <p className="mt-1 text-sm text-ink-500">
          An oral exam, one question at a time. Answer in your own words — the AI grades your
          understanding, not just correctness.
        </p>
      </section>

      {view === "setup" && (
        <section className="card max-w-xl p-6">
          <h2 className="text-sm font-semibold text-ink-900">Start a viva</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-ink-600">Subject (optional)</label>
              <select
                className="input mt-1 w-full"
                value={subjectKey}
                onChange={(e) => setSubjectKey(e.target.value)}
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
                placeholder="e.g. Photosynthesis, World War II, Python loops"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={200}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-ink-600">Difficulty</label>
                <div className="mt-1 flex gap-1 rounded-xl border border-ink-200 bg-white p-1">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={clsx(
                        "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition",
                        difficulty === d ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-ink-50",
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-ink-600">Language</label>
                <select
                  className="input mt-1 w-full"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-600">Questions: {questionCount}</label>
              <input
                type="range"
                min={3}
                max={8}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="mt-2 w-full accent-ink-900"
              />
            </div>
            {error && <p className="text-xs text-coral-500">{error}</p>}
            <button onClick={startViva} disabled={busy} className="btn-primary w-full">
              {busy ? "Starting…" : "Start viva"}
            </button>
          </div>
        </section>
      )}

      {view === "question" && viva && current && (
        <section className="card max-w-2xl p-6">
          <div className="flex items-center justify-between text-xs text-ink-400">
            <span>
              {viva.topic} · {viva.difficulty}
            </span>
            <span>
              Question {current.order} of {viva.questionCount}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-mint-500 transition-all"
              style={{ width: `${((current.order - 1) / viva.questionCount) * 100}%` }}
            />
          </div>
          <h2 className="mt-5 text-lg font-semibold leading-relaxed text-ink-900">{current.question}</h2>
          {current.concept && (
            <p className="mt-1 text-xs text-ink-400">Tests: {current.concept}</p>
          )}
          <textarea
            className="input mt-4 min-h-[110px] w-full"
            placeholder="Answer in your own words, as if speaking to your teacher…"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            maxLength={4000}
            disabled={busy}
          />
          {error && <p className="mt-2 text-xs text-coral-500">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button onClick={submitAnswer} disabled={busy || !answer.trim()} className="btn-primary flex-1">
              {busy ? "Grading…" : "Submit answer"}
            </button>
            <button onClick={abandonViva} disabled={busy} className="btn-ghost text-coral-600">
              End viva
            </button>
          </div>
        </section>
      )}

      {view === "feedback" && viva && graded && (
        <section className="card max-w-2xl p-6">
          <span className="text-xs text-ink-400">
            Question {graded.order} of {viva.questionCount} — feedback
          </span>
          <h2 className="mt-2 text-sm font-medium leading-relaxed text-ink-700">{graded.question}</h2>
          <div className="mt-4 rounded-xl border border-ink-100 bg-ink-50/50 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={clsx(
                  "rounded-full px-2.5 py-1 text-xs font-semibold",
                  graded.isCorrect ? "bg-mint-500/15 text-mint-700" : "bg-coral-500/10 text-coral-600",
                )}
              >
                {graded.isCorrect ? "Correct" : "Needs work"}
              </span>
              {graded.understanding != null && (
                <span className="text-xs text-ink-500">
                  Understanding: <strong className="text-ink-800">{Math.round(graded.understanding)}/100</strong>
                </span>
              )}
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-700">
              {graded.feedback}
            </p>
          </div>
          {error && <p className="mt-3 text-xs text-coral-500">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button onClick={nextStep} disabled={busy} className="btn-primary flex-1">
              {busy
                ? "Thinking…"
                : graded.order >= viva.questionCount
                  ? "Finish viva & see report"
                  : "Next question"}
            </button>
          </div>
        </section>
      )}

      {view === "summary" && summary && (
        <section className="card max-w-2xl p-6">
          <h2 className="text-lg font-semibold text-ink-900">Viva report — {viva?.topic}</h2>
          {finalScore != null && (
            <p className="mt-1 text-sm text-ink-500">
              Overall understanding score:{" "}
              <strong className="text-ink-900">{Math.round(finalScore)}/100</strong>
            </p>
          )}
          <p className="mt-3 text-sm leading-relaxed text-ink-700">{summary.feedback}</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {summary.strongAreas.length > 0 && (
              <div className="rounded-xl border border-mint-400/40 bg-mint-500/5 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-mint-700">Strong areas</h3>
                <ul className="mt-2 space-y-1 text-sm text-ink-700">
                  {summary.strongAreas.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {summary.weakAreas.length > 0 && (
              <div className="rounded-xl border border-coral-400/40 bg-coral-500/5 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-coral-600">Needs practice</h3>
                <ul className="mt-2 space-y-1 text-sm text-ink-700">
                  {summary.weakAreas.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {summary.practiceTopics.length > 0 && (
            <div className="mt-3 rounded-xl border border-ink-100 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-500">Practice next</h3>
              <ul className="mt-2 space-y-1 text-sm text-ink-700">
                {summary.practiceTopics.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
          )}
          <button onClick={resetToSetup} className="btn-primary mt-5">
            Start another viva
          </button>
        </section>
      )}

      {/* Past vivas */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-400">Recent vivas</h2>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {past.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-ink-200 p-6 text-center text-sm text-ink-500">
              No vivas yet.
            </div>
          )}
          {past.map((v) => (
            <div key={v.id} className="card p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-ink-900">{v.topic}</span>
                <span
                  className={clsx(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    v.status === "COMPLETED" ? "bg-mint-500/15 text-mint-700" : "bg-ink-100 text-ink-500",
                  )}
                >
                  {v.status === "COMPLETED" ? `${Math.round(v.totalScore ?? 0)}/100` : v.status}
                </span>
              </div>
              <span className="mt-1 block text-xs text-ink-400">
                {v._count.questions} questions · {v.difficulty} · {new Date(v.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
