"use client";

import clsx from "clsx";
import { Shield, TrendingUp, TrendingDown, Minus } from "lucide-react";

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
    trend === "improving" ? "text-mint-500" : trend === "declining" ? "text-coral-500" : "text-ink-500";
  const TrendIcon = trend === "improving" ? TrendingUp : trend === "declining" ? TrendingDown : Minus;

  return (
    <div className="rounded-2xl border-2 border-ink-100 bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={clsx(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            independenceScore >= 70 ? "bg-mint-400/15" : independenceScore >= 40 ? "bg-amber-400/15" : "bg-coral-500/15"
          )}>
            <Shield className={clsx("h-5 w-5", color)} />
          </div>
          <h3 className="text-sm font-bold text-ink-800">AI Independence</h3>
        </div>
        <span className={clsx("flex items-center gap-1 text-xs font-bold", trendColor)}>
          <TrendIcon className="h-3.5 w-3.5" />
          {trendLabel}
        </span>
      </div>

      <div className="flex items-end gap-3">
        <span className={clsx("text-3xl font-extrabold tabular-nums", color)}>{independenceScore}</span>
        <span className="text-sm font-medium text-ink-500 pb-0.5">/ 100</span>
      </div>

      <div className="mt-3 h-3 rounded-full bg-ink-100 overflow-hidden">
        <div
          className={clsx(
            "h-full rounded-full transition-all duration-700",
            independenceScore >= 70 ? "bg-mint-400" : independenceScore >= 40 ? "bg-amber-400" : "bg-coral-500",
          )}
          style={{ width: `${independenceScore}%` }}
        />
      </div>

      <div className="mt-3 flex gap-4 text-xs text-ink-500">
        <span>This week: <strong className="font-bold text-ink-700">{Math.round(100 - thisWeek)}</strong></span>
        <span>Last week: <strong className="font-bold text-ink-700">{Math.round(100 - lastWeek)}</strong></span>
      </div>
    </div>
  );
}
