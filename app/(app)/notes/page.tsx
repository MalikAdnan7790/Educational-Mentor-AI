"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { StickyNote, FileText } from "lucide-react";
import { NoteUpload, type UploadedNote } from "@/components/notes/note-upload";

interface NoteListItem {
  id: string;
  title: string;
  sourceType: string;
  charCount: number;
  summary: string | null;
  createdAt: string;
  _count: { chunks: number; exams: number };
}

interface NoteDetail {
  id: string;
  title: string;
  sourceType: string;
  charCount: number;
  summary: string | null;
  keyPoints: string[];
  flashcards: { front: string; back: string }[];
  text: string;
  createdAt: string;
}

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [pending, setPending] = useState<UploadedNote | null>(null);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<NoteDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [quizzing, setQuizzing] = useState(false);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});

  const loadNotes = useCallback(async () => {
    const res = await fetch("/api/notes");
    if (res.ok) setNotes(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    setFlipped({});
    fetch(`/api/notes/${selectedId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setDetail(d))
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  async function saveNote() {
    if (!pending) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || pending.filename.replace(/\.[^.]+$/, ""),
          sourceType: pending.sourceType,
          text: pending.text,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(
          data.error === "invalid_input"
            ? "The document is too short (need at least 100 characters of text)."
            : "Failed to save this note. Please try again.",
        );
        return;
      }
      const data = await res.json();
      setPending(null);
      setTitle("");
      await loadNotes();
      setSelectedId(data.note.id);
    } finally {
      setSaving(false);
    }
  }

  async function deleteNote(id: string) {
    if (!confirm("Delete this note and its flashcards? Quizzes already generated from it are kept.")) return;
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (selectedId === id) setSelectedId(null);
    loadNotes();
  }

  async function quizFromNote(noteId: string) {
    setQuizzing(true);
    try {
      const res = await fetch("/api/exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceNoteId: noteId, difficulty: "MEDIUM", questionCount: 8 }),
      });
      if (!res.ok) {
        alert("Quiz generation failed. Please try again.");
        return;
      }
      const exam = await res.json();
      router.push(`/exam/${exam.id}`);
    } finally {
      setQuizzing(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15 text-amber-500">
          <StickyNote className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">My Notes</h1>
          <p className="mt-1 text-sm text-ink-500">
            Upload your study material (PDF, DOCX, TXT, MD). Your AI teacher summarizes it, makes
            flashcards, quizzes you on it — and prioritizes it when you ask questions in chat.
          </p>
        </div>
      </section>

      {/* Upload */}
      <section className="rounded-2xl border-2 border-ink-100 bg-white p-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-400/15 text-sky-500">
            <FileText className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-bold text-ink-900">Upload study material</h2>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <NoteUpload
            onLoaded={(n) => {
              setPending(n);
              setTitle(n.filename.replace(/\.[^.]+$/, ""));
              setSaveError(null);
            }}
            disabled={saving}
          />
          {pending && (
            <span className="text-xs text-ink-500">
              {pending.filename} · {pending.sourceType} · {pending.text.length.toLocaleString()} characters
            </span>
          )}
        </div>
        {pending && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              className="input flex-1 min-w-[220px]"
              placeholder="Note title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
            <button onClick={saveNote} disabled={saving} className="btn-primary">
              {saving ? "Analyzing…" : "Save & analyze"}
            </button>
            <button onClick={() => setPending(null)} disabled={saving} className="btn-ghost">
              Cancel
            </button>
          </div>
        )}
        {saveError && <p className="mt-2 text-xs text-coral-500">{saveError}</p>}
        <p className="mt-2 text-xs text-ink-400">
          The AI summary, key points, and flashcards are generated once on upload and cached.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        {/* List */}
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink-500">
            {loading ? "Loading…" : `${notes.length} note${notes.length === 1 ? "" : "s"}`}
          </h2>
          {!loading && notes.length === 0 && (
            <div className="rounded-2xl border border-dashed border-ink-200 p-6 text-center text-sm text-ink-500">
              No notes yet. Upload your first study material above.
            </div>
          )}
          {notes.map((n) => (
            <button
              key={n.id}
              onClick={() => setSelectedId(n.id)}
              className={clsx(
                "w-full rounded-2xl border-2 p-3 text-left transition-colors",
                selectedId === n.id
                  ? "border-mint-400 bg-mint-50"
                  : "border-ink-100 bg-white hover:border-ink-300",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-ink-900">{n.title}</span>
                <span className="rounded-md bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-600">
                  {n.sourceType}
                </span>
              </div>
              <span className="mt-1 block text-xs text-ink-400">
                {n.charCount.toLocaleString()} chars · {n._count.exams} quiz{n._count.exams === 1 ? "" : "zes"}
              </span>
            </button>
          ))}
        </section>

        {/* Detail */}
        <section>
          {!selectedId && (
            <div className="rounded-2xl border border-dashed border-ink-200 p-10 text-center text-sm text-ink-500">
              Select a note to see its summary, key points, and flashcards.
            </div>
          )}
          {selectedId && detailLoading && (
            <div className="rounded-2xl border-2 border-ink-100 bg-white p-10 text-center text-sm text-ink-500">Loading note…</div>
          )}
          {detail && (
            <div className="space-y-5">
              <div className="rounded-2xl border-2 border-ink-100 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-ink-900">{detail.title}</h2>
                    <span className="text-xs text-ink-400">
                      {detail.sourceType} · {detail.charCount.toLocaleString()} characters
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => quizFromNote(detail.id)} disabled={quizzing} className="btn-primary">
                      {quizzing ? "Generating…" : "Quiz me from this note"}
                    </button>
                    <button onClick={() => deleteNote(detail.id)} className="btn-ghost text-coral-600">
                      Delete
                    </button>
                  </div>
                </div>
                {detail.summary ? (
                  <p className="mt-3 text-sm leading-relaxed text-ink-700">{detail.summary}</p>
                ) : (
                  <p className="mt-3 text-sm text-ink-400">
                    AI analysis is not ready yet — reopen this note to retry.
                  </p>
                )}
              </div>

              {detail.keyPoints.length > 0 && (
                <div className="rounded-2xl border-2 border-ink-100 bg-white p-5">
                  <h3 className="text-sm font-bold text-ink-900">Key points</h3>
                  <ul className="mt-2 space-y-1.5">
                    {detail.keyPoints.map((k, i) => (
                      <li key={i} className="flex gap-2 text-sm text-ink-700">
                        <span className="text-mint-600">•</span>
                        {k}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {detail.flashcards.length > 0 && (
                <div className="rounded-2xl border-2 border-ink-100 bg-white p-5">
                  <h3 className="text-sm font-bold text-ink-900">
                    Flashcards <span className="font-normal text-ink-400">— tap to flip</span>
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {detail.flashcards.map((f, i) => (
                      <button
                        key={i}
                        onClick={() => setFlipped((s) => ({ ...s, [i]: !s[i] }))}
                        className={clsx(
                          "min-h-[90px] rounded-xl border p-4 text-left text-sm transition-colors",
                          flipped[i]
                            ? "border-mint-400 bg-mint-500/10 text-ink-900"
                            : "border-ink-100 bg-white text-ink-700 hover:border-ink-300",
                        )}
                      >
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                          {flipped[i] ? "Answer" : "Question"}
                        </span>
                        <p className="mt-1 leading-relaxed">{flipped[i] ? f.back : f.front}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <details className="rounded-2xl border-2 border-ink-100 bg-white p-5">
                <summary className="cursor-pointer text-sm font-bold text-ink-900">
                  View full note text
                </summary>
                <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-ink-600">
                  {detail.text}
                </pre>
              </details>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
