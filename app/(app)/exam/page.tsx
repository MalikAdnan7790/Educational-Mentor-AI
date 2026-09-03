"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { FileCheck } from "lucide-react";

interface Subject {
  key: string;
  name: string;
}

interface NoteListItem {
  id: string;
  title: string;
  sourceType: string;
}

interface ExamListItem {
  id: string;
  title: string;
  subjectKey: string | null;
  topic: string | null;
  difficulty: string;
  questionCount: number;
  score: number | null;
  status: string;
  sourceNoteId: string | null;
  createdAt: string;
}

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;

export default function ExamPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [source, setSource] = useState<"topic" | "note">("topic");
  const [subjectKey, setSubjectKey] = useState("");
  const [topic, setTopic] = useState("");
  const [noteId, setNoteId] = useState("");
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>("MEDIUM");
  const [questionCount, setQuestionCount] = useState(8);
  const [timeLimitMin, setTimeLimitMin] = useState(15);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/subjects")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setSubjects(data.map((s: any) => ({ key: s.key, name: s.name }))))
      .catch(() => {});
    fetch("/api/notes")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setNotes(data.map((n: any) => ({ id: n.id, title: n.title, sourceType: n.sourceType }))))
      .catch(() => {});
    refreshExams();
  }, []);

  async function refreshExams() {
    const res = await fetch("/api/exam");
    if (res.ok) setExams(await res.json());
    setLoading(false);
  }

  async function createExam() {
    setError(null);
    if (source === "topic" && !topic.trim() && !subjectKey) {
      setError("Choose a subject or enter a topic.");
      return;
    }
    if (source === "note" && !noteId) {
      setError("Choose a note to generate the quiz from.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          source === "note"
            ? { sourceNoteId: noteId, difficulty, questionCount, timeLimitMin }
            : {
                subjectKey: subjectKey || undefined,
                topic: topic.trim() || undefined,
                difficulty,
                questionCount,
                timeLimitMin,
              },
        ),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          data.error === "ai_not_configured"
            ? "AI is not configured on this server."
            : data.error === "note_not_found"
              ? "That note could not be found."
              : "Exam generation failed — the AI service may be busy. Try fewer questions or try again.",
        );
        return;
      }
      const exam = await res.json();
      router.push(`/exam/${exam.id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint-400/15 text-mint-500">
          <FileCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">Exam Simulator</h1>
          <p className="mt-0.5 text-sm text-ink-500">
            Timed practice exams on any topic — or quizzes generated from your own uploaded notes.
          </p>
        </div>
      </section>

      {/* Create */}
      <section className="rounded-2xl border-2 border-ink-100 bg-white max-w-xl p-6">
        <div className="flex gap-1 rounded-xl border-2 border-ink-200 bg-white p-1">
          {(
            [
              { value: "topic", label: "From a topic" },
              { value: "note", label: "From my notes" },
            ] as const
          ).map((s) => (
            <button
              key={s.value}
              onClick={() => setSource(s.value)}
              className={clsx(
                "flex-1 rounded-xl px-3 py-1.5 text-xs font-medium transition",
                source === s.value ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-ink-50",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-4">
          {source === "topic" ? (
            <>
              <div>
                <label className="text-xs font-medium text-ink-600">Subject (optional)</label>
                <select
                  className="input mt-1 w-full"
                  value={subjectKey}
                  onChange={(e) => setSubjectKey(e.target.value)}
                >
                  <option value="">Any subject</option>
                  {subjects.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-ink-600">Topic (optional if subject chosen)</label>
                <input
                  className="input mt-1 w-full"
                  placeholder="e.g. Fractions, Cell biology, Tenses"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  maxLength={200}
                />
              </div>
            </>
          ) : (
            <div>
              <label className="text-xs font-medium text-ink-600">Note</label>
              {notes.length === 0 ? (
                <p className="mt-2 text-xs text-ink-400">
                  No notes uploaded yet.{" "}
                  <Link href="/notes" className="underline">
                    Upload a note first
                  </Link>{" "}
                  — then quiz yourself on it.
                </p>
              ) : (
                <select
                  className="input mt-1 w-full"
                  value={noteId}
                  onChange={(e) => setNoteId(e.target.value)}
                >
                  <option value="">Choose a note…</option>
                  {notes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title} ({n.sourceType})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-ink-600">Difficulty</label>
              <div className="mt-1 flex gap-1 rounded-xl border-2 border-ink-200 bg-white p-1">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={clsx(
                      "flex-1 rounded-xl px-2 py-1.5 text-xs font-medium transition",
                      difficulty === d ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-ink-50",
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-600">Time limit: {timeLimitMin} min</label>
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={timeLimitMin}
                onChange={(e) => setTimeLimitMin(Number(e.target.value))}
                className="mt-3 w-full accent-ink-900"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-ink-600">Questions: {questionCount}</label>
            <input
              type="range"
              min={3}
              max={15}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="mt-2 w-full accent-ink-900"
            />
          </div>

          {error && <p className="text-xs text-coral-500">{error}</p>}
          <button
            onClick={createExam}
            disabled={busy || (source === "note" && notes.length === 0)}
            className="btn-primary w-full"
          >
            {busy ? "Generating exam… (this takes a moment)" : "Generate exam"}
          </button>
        </div>
      </section>

      {/* Past exams */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-ink-500">Recent exams</h2>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {loading && <div className="col-span-full text-sm text-ink-500">Loading…</div>}
          {!loading && exams.length === 0 && (
            <div className="col-span-full rounded-2xl border-2 border-dashed border-ink-200 p-6 text-center text-sm text-ink-500">
              No exams yet — generate your first one above.
            </div>
          )}
          {exams.map((ex) => (
            <Link
              key={ex.id}
              href={`/exam/${ex.id}`}
              className="rounded-2xl border-2 border-ink-100 bg-white p-4 transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-ink-900">{ex.title}</span>
                <span
                  className={clsx(
                    "shrink-0 rounded-xl px-2 py-0.5 text-[10px] font-semibold",
                    ex.status === "GRADED"
                      ? ex.score != null && ex.score >= 70
                        ? "bg-mint-500/15 text-mint-700"
                        : "bg-amber-400/15 text-amber-700"
                      : ex.status === "ACTIVE"
                        ? "bg-mint-50 text-mint-600"
                        : "bg-ink-100 text-ink-500",
                  )}
                >
                  {ex.status === "GRADED" ? `${Math.round(ex.score ?? 0)}%` : ex.status === "ACTIVE" ? "In progress" : ex.status}
                </span>
              </div>
              <span className="mt-1 block text-xs text-ink-400">
                {ex.questionCount} questions · {ex.difficulty}
                {ex.sourceNoteId ? " · from notes" : ""} · {new Date(ex.createdAt).toLocaleDateString()}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
