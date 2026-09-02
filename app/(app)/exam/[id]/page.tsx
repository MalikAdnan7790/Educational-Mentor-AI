"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import clsx from "clsx";

interface ExamQuestionView {
  id: string;
  order: number;
  type: "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER" | "CONCEPTUAL" | "CODE";
  question: string;
  options: string[] | null;
  points: number;
  answer?: string;
  studentAnswer?: string | null;
  isCorrect?: boolean | null;
  analysis?: string | null;
}

interface ExamDetail {
  id: string;
  title: string;
  subjectKey: string | null;
  topic: string | null;
  difficulty: string;
  timeLimitSec: number | null;
  questionCount: number;
  sourceNoteId: string | null;
  status: string;
  score: number | null;
  summary: {
    weakTopics: string[];
    revision: string[];
    mistakeAnalysis: string[];
    feedback: string;
  } | null;
  questions: ExamQuestionView[];
}

interface SubmitResult {
  score: number;
  earned: number;
  total: number;
  summary: ExamDetail["summary"];
  questions: ExamQuestionView[];
}

export default function ExamDetailPage() {
  const params = useParams<{ id: string }>();
  const examId = params.id;

  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/exam/${examId}`)
      .then((r) => {
        if (!r.ok) throw new Error("not_found");
        return r.json();
      })
      .then((data: ExamDetail) => {
        setExam(data);
        if (data.status === "ACTIVE" && data.timeLimitSec) {
          setSecondsLeft(data.timeLimitSec);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [examId]);

  const submit = useCallback(
    async (auto = false) => {
      if (!exam || submitting) return;
      if (!auto) {
        const unanswered = exam.questions.filter((q) => !(answers[q.id] ?? "").trim()).length;
        if (unanswered > 0 && !confirm(`${unanswered} question(s) unanswered. Submit anyway?`)) return;
      }
      setSubmitting(true);
      setError(null);
      try {
        const res = await fetch(`/api/exam/${exam.id}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers: exam.questions.map((q) => ({ questionId: q.id, answer: answers[q.id] ?? "" })),
          }),
        });
        if (!res.ok) {
          setError("Submission failed — please try again.");
          return;
        }
        const data: SubmitResult = await res.json();
        setResult(data);
        setExam((e) => (e ? { ...e, status: "GRADED", score: data.score, summary: data.summary } : e));
        setSecondsLeft(null);
      } finally {
        setSubmitting(false);
      }
    },
    [exam, answers, submitting],
  );

  // Countdown with auto-submit
  useEffect(() => {
    if (secondsLeft == null || result) return;
    if (secondsLeft <= 0) {
      submit(true);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => (s == null ? null : s - 1)), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, result, submit]);

  const timerLabel = useMemo(() => {
    if (secondsLeft == null) return null;
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }, [secondsLeft]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-sm text-ink-500">Loading exam…</div>;
  }
  if (notFound || !exam) {
    return (
      <div className="card p-10 text-center text-sm text-ink-500">
        Exam not found.{" "}
        <Link href="/exam" className="underline">
          Back to exams
        </Link>
      </div>
    );
  }

  const graded = result ?? exam.status === "GRADED";
  const questions = result?.questions ?? exam.questions;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">{exam.title}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {exam.questionCount} questions · {exam.difficulty}
            {exam.sourceNoteId ? " · from your notes" : ""}
          </p>
        </div>
        {!graded && timerLabel && (
          <span
            className={clsx(
              "rounded-xl border px-4 py-2 font-mono text-lg font-semibold",
              secondsLeft != null && secondsLeft < 60
                ? "border-coral-300 bg-coral-500/10 text-coral-600"
                : "border-ink-200 bg-white text-ink-900",
            )}
          >
            {timerLabel}
          </span>
        )}
      </div>

      {graded && (
        <section className="card p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div
              className={clsx(
                "flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold",
                (result?.score ?? exam.score ?? 0) >= 70
                  ? "bg-mint-500/15 text-mint-700"
                  : (result?.score ?? exam.score ?? 0) >= 40
                    ? "bg-amber-400/15 text-amber-700"
                    : "bg-coral-500/10 text-coral-600",
              )}
            >
              {Math.round(result?.score ?? exam.score ?? 0)}%
            </div>
            <div className="flex-1">
              {result && (
                <p className="text-sm text-ink-500">
                  {result.earned} of {result.total} points
                </p>
              )}
              {(result?.summary ?? exam.summary)?.feedback && (
                <p className="mt-1 text-sm leading-relaxed text-ink-700">
                  {(result?.summary ?? exam.summary)!.feedback}
                </p>
              )}
            </div>
          </div>
          {(() => {
            const s = result?.summary ?? exam.summary;
            if (!s) return null;
            return (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {s.weakTopics.length > 0 && (
                  <div className="rounded-xl border border-coral-400/40 bg-coral-500/5 p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-coral-600">Weak topics</h3>
                    <ul className="mt-2 space-y-1 text-sm text-ink-700">
                      {s.weakTopics.map((t, i) => (
                        <li key={i}>• {t}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {s.revision.length > 0 && (
                  <div className="rounded-xl border border-ink-100 p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-500">Revision plan</h3>
                    <ul className="mt-2 space-y-1 text-sm text-ink-700">
                      {s.revision.map((t, i) => (
                        <li key={i}>• {t}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {s.mistakeAnalysis.length > 0 && (
                  <div className="rounded-xl border border-amber-400/40 bg-amber-400/5 p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-700">Mistakes</h3>
                    <ul className="mt-2 space-y-1 text-sm text-ink-700">
                      {s.mistakeAnalysis.map((t, i) => (
                        <li key={i}>• {t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })()}
        </section>
      )}

      {/* Questions */}
      <section className="space-y-4">
        {questions.map((q) => (
          <div key={q.id} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold leading-relaxed text-ink-900">
                {q.order}. {q.question}
              </h3>
              <span className="shrink-0 rounded-md bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-500">
                {q.type.replace("_", " ")} · {q.points}pt
              </span>
            </div>

            {!graded ? (
              <div className="mt-3">
                {q.options ? (
                  <div className="space-y-2">
                    {q.options.map((opt) => (
                      <label
                        key={opt}
                        className={clsx(
                          "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm transition-colors",
                          answers[q.id] === opt
                            ? "border-ink-900 bg-ink-50 font-medium"
                            : "border-ink-100 hover:border-ink-300",
                        )}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          checked={answers[q.id] === opt}
                          onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                          className="accent-ink-900"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    className="input min-h-[80px] w-full"
                    placeholder="Write your answer…"
                    value={answers[q.id] ?? ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                    maxLength={4000}
                  />
                )}
              </div>
            ) : (
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={clsx(
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                      q.isCorrect ? "bg-mint-500/15 text-mint-700" : "bg-coral-500/10 text-coral-600",
                    )}
                  >
                    {q.isCorrect ? `Correct +${q.points}` : "Wrong"}
                  </span>
                </div>
                <p className="text-ink-700">
                  <span className="font-medium text-ink-500">Your answer:</span>{" "}
                  {q.studentAnswer?.trim() ? q.studentAnswer : <span className="text-ink-400">(blank)</span>}
                </p>
                {!q.isCorrect && (
                  <p className="text-ink-700">
                    <span className="font-medium text-ink-500">Correct answer:</span> {q.answer}
                  </p>
                )}
                {q.analysis && <p className="text-ink-500">{q.analysis}</p>}
              </div>
            )}
          </div>
        ))}
      </section>

      {!graded && (
        <div className="sticky bottom-4">
          {error && <p className="mb-2 text-center text-xs text-coral-500">{error}</p>}
          <button
            onClick={() => submit(false)}
            disabled={submitting}
            className="btn-primary w-full py-3 shadow-lg"
          >
            {submitting ? "Grading… (short answers take a moment)" : "Submit exam"}
          </button>
        </div>
      )}

      {graded && (
        <div className="flex gap-2">
          <Link href="/exam" className="btn-ghost flex-1">
            Another exam
          </Link>
          <Link href="/dashboard" className="btn-primary flex-1">
            View my learning
          </Link>
        </div>
      )}
    </div>
  );
}
