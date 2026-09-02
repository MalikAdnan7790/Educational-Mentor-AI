"use client";

import clsx from "clsx";

interface DependencyMeterProps {
  score: number;
  trend: "improving" | "stable" | "declining";
  thisWeek: number;
  lastWeek: number;
}

export function DependencyMeter({ score, trend, thisWeek, lastWeek }: DependencyMeterProps) {
  const independenceScore = Math.round(100 - score);
  const color =
    independenceScore >= 70 ? "text-mint-500" : independenceScore >= 40 ? "text-amber-500" : "text-coral-500";

  const trendLabel =
    trend === "improving" ? "Improving" : trend === "declining" ? "Declining" : "Stable";
  const trendColor =
    trend === "improving" ? "text-mint-600" : trend === "declining" ? "text-coral-500" : "text-ink-500";

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-ink-800">AI Independence</h3>
        <span className={clsx("text-xs font-medium", trendColor)}>{trendLabel}</span>
      </div>

      <div className="flex items-end gap-3">
        <span className={clsx("text-3xl font-bold tabular-nums", color)}>{independenceScore}</span>
        <span className="text-sm text-ink-500 pb-0.5">/ 100</span>
      </div>

      <div className="mt-3 h-2.5 rounded-full bg-ink-100 overflow-hidden">
        <div
          className={clsx(
            "h-full rounded-full transition-all duration-700",
            independenceScore >= 70 ? "bg-mint-500" : independenceScore >= 40 ? "bg-amber-400" : "bg-coral-500",
          )}
          style={{ width: `${independenceScore}%` }}
        />
      </div>

      <div className="mt-3 flex gap-4 text-xs text-ink-500">
        <span>This week: <strong className="text-ink-700">{Math.round(100 - thisWeek)}</strong></span>
        <span>Last week: <strong className="text-ink-700">{Math.round(100 - lastWeek)}</strong></span>
      </div>
    </div>
  );
}
