import clsx from "clsx";

interface Metric {
  label: string;
  value: string;
  sub?: string;
  tone?: "mint" | "amber" | "coral" | "ink";
  icon?: string;
}

export function MetricsGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {metrics.map((m) => (
        <div key={m.label} className="card p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-ink-500">
            {m.icon && <span>{m.icon}</span>}
            <span>{m.label}</span>
          </div>
          <div
            className={clsx(
              "mt-2 text-2xl font-semibold tabular-nums",
              m.tone === "mint" && "text-mint-600",
              m.tone === "amber" && "text-amber-500",
              m.tone === "coral" && "text-coral-500",
              m.tone === "ink" && "text-ink-900",
              !m.tone && "text-ink-900"
            )}
          >
            {m.value}
          </div>
          {m.sub && <p className="mt-1 text-xs text-ink-500">{m.sub}</p>}
        </div>
      ))}
    </div>
  );
}
