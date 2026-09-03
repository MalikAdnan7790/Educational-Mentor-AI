"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  Map,
  BookOpen,
  Pencil,
  HelpCircle,
  RotateCcw,
  Dumbbell,
  Video,
  ClipboardList,
} from "lucide-react";

interface RoadmapTask {
  title: string;
  description: string;
  activityType: "READ" | "PRACTICE" | "QUIZ" | "REVIEW" | "EXERCISE" | "VIDEO";
  topic: string;
  estimatedMinutes: number;
}

interface RoadmapWeek {
  week: number;
  theme: string;
  tasks: RoadmapTask[];
}

interface RoadmapData {
  title: string;
  weeks: RoadmapWeek[];
}

interface RoadmapItem {
  id: string;
  title: string;
  subjectKey: string | null;
  status: string;
  createdAt: string;
  roadmap: RoadmapData;
}

const ACTIVITY_COLORS: Record<string, string> = {
  READ: "bg-blue-100 text-blue-700",
  PRACTICE: "bg-emerald-100 text-emerald-700",
  QUIZ: "bg-purple-100 text-purple-700",
  REVIEW: "bg-amber-100 text-amber-700",
  EXERCISE: "bg-coral-500/10 text-coral-600",
  VIDEO: "bg-pink-100 text-pink-700",
};

const ACTIVITY_ICON_COLORS: Record<string, string> = {
  READ: "bg-sky-400/15 text-sky-500",
  PRACTICE: "bg-mint-400/15 text-mint-500",
  QUIZ: "bg-purple-400/15 text-purple-500",
  REVIEW: "bg-amber-400/15 text-amber-500",
  EXERCISE: "bg-coral-400/15 text-coral-500",
  VIDEO: "bg-pink-400/15 text-pink-500",
};

const ACTIVITY_ICON_COMPONENTS: Record<string, React.ElementType> = {
  READ: BookOpen,
  PRACTICE: Pencil,
  QUIZ: HelpCircle,
  REVIEW: RotateCcw,
  EXERCISE: Dumbbell,
  VIDEO: Video,
};

export default function RoadmapPage() {
  const [roadmaps, setRoadmaps] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [subjectKey, setSubjectKey] = useState("");
  const [topic, setTopic] = useState("");
  const [weekCount, setWeekCount] = useState(4);
  const [subjects, setSubjects] = useState<{ key: string; name: string }[]>([]);

  const fetchRoadmaps = useCallback(async () => {
    try {
      const res = await fetch("/api/roadmap");
      if (res.ok) {
        const data = await res.json();
        setRoadmaps(data.roadmaps);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoadmaps();
    fetch("/api/subjects")
      .then((r) => (r.ok ? r.json() : { subjects: [] }))
      .then((d) => setSubjects(d.subjects ?? []))
      .catch(() => {});
  }, [fetchRoadmaps]);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectKey: subjectKey || undefined,
          topic: topic || undefined,
          weekCount,
        }),
      });
      if (!res.ok) {
        setError("Failed to generate roadmap. Try again.");
        return;
      }
      const data = await res.json();
      setRoadmaps((prev) => [data, ...prev]);
      setTopic("");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-sm text-ink-500">Loading roadmaps…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-400/15 text-purple-500">
          <Map className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">Study Roadmap</h1>
          <p className="mt-1 text-sm text-ink-500">
            AI-generated week-by-week study plans based on your strengths and weaknesses.
          </p>
        </div>
      </div>

      {/* Generator form */}
      <section className="rounded-2xl border-2 border-ink-100 bg-white p-5">
        <h2 className="text-sm font-bold text-ink-900">Generate new roadmap</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
          <select
            className="input"
            value={subjectKey}
            onChange={(e) => setSubjectKey(e.target.value)}
          >
            <option value="">All subjects</option>
            {subjects.map((s) => (
              <option key={s.key} value={s.key}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder="Focus topic (optional)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <select
            className="input"
            value={weekCount}
            onChange={(e) => setWeekCount(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 6, 8, 12].map((n) => (
              <option key={n} value={n}>
                {n} week{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
          <button
            onClick={generate}
            disabled={generating}
            className="btn-primary disabled:opacity-50"
          >
            {generating ? "Generating…" : "Generate"}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-coral-500">{error}</p>}
      </section>

      {/* Roadmap list */}
      {roadmaps.length === 0 ? (
        <div className="rounded-2xl border-2 border-ink-100 bg-white p-10 text-center text-sm text-ink-500">
          No roadmaps yet. Generate one above to get started.
        </div>
      ) : (
        <div className="space-y-6">
          {roadmaps.map((rm) => (
            <section key={rm.id} className="rounded-2xl border-2 border-ink-100 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-ink-900">{rm.title}</h2>
                  <p className="text-xs text-ink-500">
                    {rm.subjectKey ?? "All subjects"} · {rm.roadmap.weeks.length} weeks ·{" "}
                    {new Date(rm.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                {rm.roadmap.weeks.map((w) => (
                  <div key={w.week} className="relative pl-6">
                    {/* Timeline line */}
                    <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-ink-200" />
                    {/* Week dot */}
                    <div className="absolute left-0.5 top-1 h-4 w-4 rounded-full border-2 border-blue-500 bg-white" />

                    <div className="rounded-2xl border-2 border-ink-100 bg-white p-4">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-purple-400/15 px-2 py-0.5 text-xs font-bold text-purple-600">
                          Week {w.week}
                        </span>
                        <span className="text-sm font-medium text-ink-800">{w.theme}</span>
                      </div>

                      <div className="mt-3 space-y-2">
                        {w.tasks.map((t, i) => {
                          const IconComp = ACTIVITY_ICON_COMPONENTS[t.activityType] ?? ClipboardList;
                          const iconColor = ACTIVITY_ICON_COLORS[t.activityType] ?? "bg-ink-100 text-ink-500";
                          return (
                            <div
                              key={i}
                              className="flex items-start gap-3 rounded-xl bg-ink-50/50 p-3"
                            >
                              <div className={clsx("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", iconColor)}>
                                <IconComp className="h-4 w-4" />
                              </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium text-ink-900">{t.title}</span>
                                <span
                                  className={clsx(
                                    "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                    ACTIVITY_COLORS[t.activityType] ?? "bg-ink-100 text-ink-600",
                                  )}
                                >
                                  {t.activityType}
                                </span>
                                <span className="text-[10px] text-ink-400">{t.estimatedMinutes} min</span>
                              </div>
                              <p className="mt-0.5 text-xs text-ink-600">{t.description}</p>
                              <p className="mt-0.5 text-[10px] text-ink-400">Topic: {t.topic}</p>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Link href="/dashboard" className="btn-ghost block text-center">
        Back to dashboard
      </Link>
    </div>
  );
}
