import clsx from "clsx";

interface HintTrendProps {
  lastWeek: number;
  thisWeek: number;
  deltaPct: number;
}

export function HintTrend({ lastWeek, thisWeek, deltaPct }: HintTrendProps) {
  const improving = deltaPct > 0;
  const flat = Math.abs(deltaPct) < 1;

  return (
    <div className="card p-5">
      <div className="text-xs font-medium uppercase tracking-wider text-ink-500">
        Hint Dependency
      </div>
      <div className="mt-3 text-sm text-ink-600">Average hints per problem</div>

      <div className="mt-4 grid grid-cols-3 items-end gap-4">
        <div>
          <div className="text-xs text-ink-500">Last Week</div>
          <div className="text-xl font-semibold tabular-nums">{lastWeek.toFixed(1)}</div>
        </div>
        <div>
          <div className="text-xs text-ink-500">This Week</div>
          <div className="text-xl font-semibold tabular-nums">{thisWeek.toFixed(1)}</div>
        </div>
        <div
          className={clsx(
            "text-right text-xl font-semibold tabular-nums",
            improving ? "text-mint-600" : flat ? "text-ink-700" : "text-coral-500"
          )}
        >
          {flat ? "—" : `${improving ? "↓" : "↑"} ${Math.abs(deltaPct).toFixed(0)}%`}
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
