"use client";

import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";

interface Section {
  title: string;
  content: string;
  checkQuestion: string;
  checkAnswer: string;
}

interface LessonItem {
  id: string;
  topic: string;
  subjectKey: string | null;
  currentStep: number;
  status: string;
  scorePct: number;
  createdAt: string;
  sections: Section[];
}

type View = "list" | "learn" | "complete";

export default function LessonsPage() {
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [topic, setTopic] = useState("");
  const [sectionCount, setSectionCount] = useState(4);

  const [activeLesson, setActiveLesson] = useState<LessonItem | null>(null);
  const [view, setView] = useState<View>("list");

  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<{ correct: boolean; expected: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const fetchLessons = useCallback(async () => {
    try {
      const res = await fetch("/api/lessons");
      if (!res.ok) throw new Error("Failed to load lessons");
      const data = await res.json();
      setLessons(data.lessons);
    } catch {
      setError("Could not load your lessons.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), sectionCount }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const lesson: LessonItem = await res.json();
      setLessons((prev) => [lesson, ...prev]);
      setActiveLesson(lesson);
      setView("learn");
      setAnswer("");
      setFeedback(null);
      setTopic("");
    } catch {
      setError("Could not generate lesson. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  function openLesson(lesson: LessonItem) {
    if (lesson.status === "COMPLETED") {
      setActiveLesson(lesson);
      setFinalScore(lesson.scorePct);
      setView("complete");
    } else {
      setActiveLesson(lesson);
      setView("learn");
      setAnswer("");
      setFeedback(null);
    }
  }

  async function handleSubmitAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (!activeLesson || !answer.trim()) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/lessons/${activeLesson.id}/step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: answer.trim() }),
      });
      if (!res.ok) throw new Error("Submit failed");
      const data = await res.json();

      setFeedback({ correct: data.isCorrect, expected: data.expectedAnswer });

      if (data.completed) {
        setFinalScore(data.scorePct);
        setView("complete");
        setActiveLesson((prev) => prev ? { ...prev, status: "COMPLETED", scorePct: data.scorePct } : prev);
        fetchLessons();
      } else {
        setActiveLesson((prev) =>
          prev ? { ...prev, currentStep: data.nextStep } : prev,
        );
      }
      setAnswer("");
    } catch {
      setError("Could not submit answer.");
    } finally {
      setSubmitting(false);
    }
  }

  function backToList() {
    setView("list");
    setActiveLesson(null);
    setFeedback(null);
    setAnswer("");
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-ink-400 text-sm">Loading lessons…</div>
      </div>
    );
  }

  if (view === "learn" && activeLesson) {
    return <LearnView lesson={activeLesson} answer={answer} setAnswer={setAnswer} feedback={feedback} submitting={submitting} onSubmit={handleSubmitAnswer} onBack={backToList} />;
  }

  if (view === "complete" && activeLesson) {
    return <CompleteView lesson={activeLesson} score={finalScore} onBack={backToList} onRetry={() => { setView("learn"); setFeedback(null); setAnswer(""); }} />;
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Mini Lessons</h1>
          <p className="text-sm text-ink-500 mt-1">Interactive lessons that teach you step by step, with check questions along the way.</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleGenerate} className="rounded-xl border border-ink-200 bg-white p-4 space-y-3">
          <h2 className="text-sm font-medium text-ink-700">Start a new lesson</h2>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="What do you want to learn? e.g. Photosynthesis, Quadratic equations"
            className="input w-full text-sm"
            disabled={generating}
          />
          <div className="flex items-center gap-3">
            <label className="text-xs text-ink-500">Sections:</label>
            <select
              value={sectionCount}
              onChange={(e) => setSectionCount(Number(e.target.value))}
              className="input text-sm py-1.5 px-2"
              disabled={generating}
            >
              {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!topic.trim() || generating}
              className="btn-primary ml-auto px-4 py-1.5 text-sm"
            >
              {generating ? "Generating…" : "Generate Lesson"}
            </button>
          </div>
        </form>

        {lessons.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink-200 py-12 text-center">
            <div className="text-3xl mb-2">📚</div>
            <p className="text-sm text-ink-500">No lessons yet. Generate one above to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-ink-600">Your lessons</h2>
            {lessons.map((lesson) => {
              const total = lesson.sections.length;
              const progress = Math.round((lesson.currentStep / total) * 100);
              return (
                <button
                  key={lesson.id}
                  onClick={() => openLesson(lesson)}
                  className="w-full text-left rounded-xl border border-ink-200 bg-white p-4 hover:border-ink-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-medium text-ink-900 text-sm truncate">{lesson.topic}</h3>
                      <p className="text-xs text-ink-500 mt-0.5">
                        {total} sections · {new Date(lesson.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {lesson.status === "COMPLETED" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          {lesson.scorePct}%
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                          {lesson.currentStep}/{total}
                        </span>
                      )}
                    </div>
                  </div>
                  {lesson.status !== "COMPLETED" && (
                    <div className="mt-2 h-1.5 rounded-full bg-ink-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function LearnView({
  lesson,
  answer,
  setAnswer,
  feedback,
  submitting,
  onSubmit,
  onBack,
}: {
  lesson: LessonItem;
  answer: string;
  setAnswer: (v: string) => void;
  feedback: { correct: boolean; expected: string } | null;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}) {
  const currentStep = lesson.currentStep;
  const section = lesson.sections[currentStep];
  const total = lesson.sections.length;

  if (!section) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-ink-500">No more sections.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <button onClick={onBack} className="text-sm text-ink-500 hover:text-ink-700 flex items-center gap-1">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to lessons
        </button>

        <div>
          <h1 className="text-lg font-semibold text-ink-900">{lesson.topic}</h1>
          <p className="text-xs text-ink-500 mt-0.5">Section {currentStep + 1} of {total}</p>
        </div>

        <div className="flex gap-1.5">
          {lesson.sections.map((_, i) => (
            <div
              key={i}
              className={clsx(
                "h-1.5 flex-1 rounded-full transition-colors",
                i < currentStep ? "bg-emerald-400" : i === currentStep ? "bg-blue-500" : "bg-ink-100",
              )}
            />
          ))}
        </div>

        <div className="rounded-xl border border-ink-200 bg-white p-5 space-y-4">
          <h2 className="font-medium text-ink-900">{section.title}</h2>
          <div className="text-sm text-ink-700 leading-relaxed whitespace-pre-line">
            {section.content}
          </div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 space-y-3">
          <h3 className="text-sm font-medium text-blue-900">Check your understanding</h3>
          <p className="text-sm text-blue-800">{section.checkQuestion}</p>

          <form onSubmit={onSubmit} className="space-y-3">
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Your answer…"
              className="input w-full text-sm"
              disabled={submitting}
              autoFocus
            />
            <button
              type="submit"
              disabled={!answer.trim() || submitting}
              className="btn-primary w-full py-2 text-sm"
            >
              {submitting ? "Checking…" : "Check Answer"}
            </button>
          </form>

          {feedback && (
            <div className={clsx(
              "rounded-lg px-3 py-2 text-sm",
              feedback.correct ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800",
            )}>
              {feedback.correct ? (
                <span>Correct! Moving to the next section.</span>
              ) : (
                <div>
                  <span>Not quite. The expected answer was: </span>
                  <span className="font-medium">{feedback.expected}</span>
                  <span className="block mt-1 text-xs opacity-75">Don't worry — you've still learned the material. Keep going!</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CompleteView({
  lesson,
  score,
  onBack,
  onRetry,
}: {
  lesson: LessonItem;
  score: number;
  onBack: () => void;
  onRetry: () => void;
}) {
  const emoji = score >= 80 ? "🌟" : score >= 50 ? "👍" : "📖";
  const message = score >= 80
    ? "Excellent work! You've got a strong grasp of this topic."
    : score >= 50
    ? "Good effort! Review the sections you missed and try again."
    : "Keep learning! Re-read the material and give it another shot.";

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-md mx-auto px-4 py-12 text-center space-y-5">
        <div className="text-5xl">{emoji}</div>
        <h1 className="text-xl font-semibold text-ink-900">Lesson Complete!</h1>
        <p className="text-sm text-ink-600">{lesson.topic}</p>

        <div className="rounded-xl border border-ink-200 bg-white p-6">
          <div className="text-4xl font-bold text-ink-900">{score}%</div>
          <p className="text-xs text-ink-500 mt-1">Your score</p>
          <p className="text-sm text-ink-600 mt-3">{message}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 rounded-lg border border-ink-200 px-4 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50 transition-colors"
          >
            All Lessons
          </button>
          <button
            onClick={onRetry}
            className="flex-1 btn-primary py-2.5 text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
