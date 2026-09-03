"use client";

import clsx from "clsx";

interface StudyStreakData {
  currentStreak: number;
  longestStreak: number;
  lessonsCompleted: number;
  roadmapsActive: number;
  conversationsTotal: number;
}

export function StudyStreakCard({ data }: { data: StudyStreakData }) {
  const fireActive = data.currentStreak > 0;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-ink-700">Study Activity</h2>
        {fireActive && (
          <span className="text-lg" title="Active streak!">🔥</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StreakStat
          value={data.currentStreak}
          label="Day Streak"
          highlight={fireActive}
        />
        <StreakStat
          value={data.longestStreak}
          label="Best Streak"
        />
        <StreakStat
          value={data.lessonsCompleted}
          label="Lessons Done"
        />
        <StreakStat
          value={data.conversationsTotal}
          label="Conversations"
        />
      </div>

      {data.roadmapsActive > 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-ink-500">
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700 font-medium">
            {data.roadmapsActive} active roadmap{data.roadmapsActive !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}

function StreakStat({ value, label, highlight }: { value: number; label: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <div className={clsx(
        "text-2xl font-bold",
        highlight ? "text-coral-500" : "text-ink-900",
      )}>
        {value}
      </div>
      <div className="text-xs text-ink-500 mt-0.5">{label}</div>
    </div>
  );
}
