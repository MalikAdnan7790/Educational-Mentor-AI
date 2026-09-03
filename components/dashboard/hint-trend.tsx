import clsx from "clsx";
import { TrendingDown, TrendingUp, Minus, Lightbulb } from "lucide-react";

interface HintTrendProps {
  lastWeek: number;
  thisWeek: number;
  deltaPct: number;
}

export function HintTrend({ lastWeek, thisWeek, deltaPct }: HintTrendProps) {
  const improving = deltaPct > 0;
  const flat = Math.abs(deltaPct) < 1;

  return (
    <div className="rounded-2xl border-2 border-ink-100 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15">
          <Lightbulb className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-ink-500">
            Hint Dependency
          </div>
          <div className="text-sm font-medium text-ink-600">Average hints per problem</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 items-end gap-4">
        <div>
          <div className="text-xs font-medium text-ink-500">Last Week</div>
          <div className="text-xl font-bold tabular-nums text-ink-900">{lastWeek.toFixed(1)}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-ink-500">This Week</div>
          <div className="text-xl font-bold tabular-nums text-ink-900">{thisWeek.toFixed(1)}</div>
        </div>
        <div
          className={clsx(
            "flex items-center justify-end gap-1 text-right text-xl font-bold tabular-nums",
            improving ? "text-mint-500" : flat ? "text-ink-700" : "text-coral-500"
          )}
        >
          {flat ? (
            <Minus className="h-5 w-5" />
          ) : improving ? (
            <TrendingDown className="h-5 w-5" />
          ) : (
            <TrendingUp className="h-5 w-5" />
          )}
          {flat ? "—" : `${Math.abs(deltaPct).toFixed(0)}%`}
        </div>
      </div>

      <p className="mt-4 text-sm text-ink-600">
        {improving
          ? "You're becoming more independent. You needed fewer hints this week."
          : flat
          ? "Hint usage is steady. Try to solve the first step on your own before asking."
          : "You leaned on hints more this week. Try an AI-Free challenge to reset."}
      </p>
    </div>
  );
}
