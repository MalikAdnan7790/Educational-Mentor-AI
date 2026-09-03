"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Map, Loader2 } from "lucide-react";

interface SubjectOverview {
  key: string;
  topics: number;
  avgMastery: number;
  weakestTopic: string | null;
}

interface PathData {
  currentLevel: string;
  currentTopic: string;
  weakPrerequisite: string | null;
  practice: string;
  nextTopic: string;
  challenge: string;
  rationale: string;
}

export function LearningPathCard() {
  const [subjects, setSubjects] = useState<SubjectOverview[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [path, setPath] = useState<PathData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/learning-path")
      .then((r) => (r.ok ? r.json() : { subjects: [] }))
      .then((data) => {
        setSubjects(data.subjects ?? []);
        if (data.subjects?.length > 0) setSelected(data.subjects[0].key);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  async function buildPath() {
    setLoading(true);
    setError(null);
    setPath(null);
    try {
      const res = await fetch("/api/learning-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: selected || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Could not build the path. Try again.");
        return;
      }
      setPath(data.path);
    } catch {
      setError("Could not build the path. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border-2 border-ink-100 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15">
            <Map className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-ink-900">My Learning Path</h3>
            <p className="mt-0.5 text-xs text-ink-500">
              Built from your real scores — foundations first, never skipping weak prerequisites.
            </p>
          </div>
        </div>
        {subjects.length > 0 && (
          <select
            className="input max-w-[180px] rounded-xl py-1.5 text-xs font-medium"
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value);
              setPath(null);
            }}
          >
            {subjects.map((s) => (
              <option key={s.key} value={s.key}>
                {s.key} · {s.avgMastery}%
              </option>
            ))}
          </select>
        )}
      </div>

      {loaded && subjects.length === 0 && (
        <p className="mt-4 text-sm text-ink-500">
          Complete a session, challenge, viva or exam to unlock your learning path.
        </p>
      )}

      {subjects.length > 0 && !path && (
        <button onClick={buildPath} disabled={loading} className="btn-primary mt-4 rounded-xl">
          {loading ? "Building your path..." : "Build my learning path"}
        </button>
      )}

      {error && <p className="mt-3 text-xs font-medium text-coral-500">{error}</p>}

      {path && (
        <div className="mt-4 space-y-4">
          <div>
            <span className="rounded-full bg-mint-400/15 px-3 py-1 text-xs font-bold text-mint-600">{path.currentLevel}</span>
            <h4 className="mt-2 text-sm font-bold text-ink-900">
              Working on now: {path.currentTopic}
            </h4>
            {path.weakPrerequisite && (
              <p className="mt-1 rounded-xl border-2 border-amber-400/40 bg-amber-400/10 p-2.5 text-xs font-medium text-amber-700">
                Fix this first: {path.weakPrerequisite} — your foundation needs repair before
                advancing.
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border-2 border-ink-100 p-3">
              <h5 className="text-[10px] font-bold uppercase tracking-wide text-ink-400">
                Practice today
              </h5>
              <p className="mt-1 text-xs font-medium leading-relaxed text-ink-700">{path.practice}</p>
            </div>
            <div className="rounded-xl border-2 border-ink-100 p-3">
              <h5 className="text-[10px] font-bold uppercase tracking-wide text-ink-400">
                Then
              </h5>
              <p className="mt-1 text-xs font-medium leading-relaxed text-ink-700">{path.nextTopic}</p>
            </div>
            <div className="rounded-xl border-2 border-ink-100 p-3">
              <h5 className="text-[10px] font-bold uppercase tracking-wide text-ink-400">
                Stretch challenge
              </h5>
              <p className="mt-1 text-xs font-medium leading-relaxed text-ink-700">{path.challenge}</p>
            </div>
          </div>

          <p className="text-xs font-medium leading-relaxed text-ink-500">
            <strong className="font-bold text-ink-700">Why this order:</strong> {path.rationale}
          </p>

          <button
            onClick={buildPath}
            disabled={loading}
            className={clsx("btn-ghost text-xs rounded-xl", loading && "opacity-50")}
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Rebuilding...
              </span>
            ) : "Rebuild path"}
          </button>
        </div>
      )}
    </div>
  );
}
