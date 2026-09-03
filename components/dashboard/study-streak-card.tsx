"use client";

import clsx from "clsx";
import { Flame, BookOpen, MessageCircle, Route } from "lucide-react";

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
    <div className="rounded-2xl border-2 border-ink-100 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-extrabold text-ink-900">Study Activity</h2>
        {fireActive && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-400/15">
            <Flame className="h-5 w-5 text-orange-500" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StreakStat
          value={data.currentStreak}
          label="Day Streak"
          highlight={fireActive}
          icon={<Flame className={clsx("h-5 w-5", fireActive ? "text-orange-500" : "text-ink-300")} />}
        />
        <StreakStat
          value={data.longestStreak}
          label="Best Streak"
          icon={<BookOpen className="h-5 w-5 text-ink-300" />}
        />
        <StreakStat
          value={data.lessonsCompleted}
          label="Lessons Done"
          icon={<BookOpen className="h-5 w-5 text-ink-300" />}
        />
        <StreakStat
          value={data.conversationsTotal}
          label="Conversations"
          icon={<MessageCircle className="h-5 w-5 text-ink-300" />}
        />
      </div>

      {data.roadmapsActive > 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-400/15">
            <Route className="h-4 w-4 text-blue-500" />
          </div>
          <span className="rounded-full bg-blue-400/15 px-2.5 py-0.5 font-bold text-blue-600">
            {data.roadmapsActive} active roadmap{data.roadmapsActive !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}

function StreakStat({ value, label, highlight, icon }: { value: number; label: string; highlight?: boolean; icon: React.ReactNode }) {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <div className={clsx(
        "text-3xl font-extrabold tabular-nums",
        highlight ? "text-orange-500" : "text-ink-900",
      )}>
        {value}
      </div>
      <div className="text-xs font-medium text-ink-500 mt-0.5">{label}</div>
    </div>
  );
}
