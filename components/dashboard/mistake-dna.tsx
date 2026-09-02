"use client";

import clsx from "clsx";

interface MistakeType {
  type: string;
  count: number;
  pct: number;
}

interface MistakeDNAProps {
  total: number;
  byType: MistakeType[];
}

const TYPE_COLORS: Record<string, string> = {
  CONCEPT_GAP: "bg-coral-400",
  COMPUTATION: "bg-amber-400",
  MISREAD: "bg-blue-400",
  LOGIC_ERROR: "bg-purple-400",
  INCOMPLETE: "bg-ink-300",
};

const TYPE_LABELS: Record<string, string> = {
  CONCEPT_GAP: "Concept Gap",
  COMPUTATION: "Computation",
  MISREAD: "Misread",
  LOGIC_ERROR: "Logic Error",
  INCOMPLETE: "Incomplete",
};

export function MistakeDNA({ total, byType }: MistakeDNAProps) {
  if (total === 0) {
    return (
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-ink-800 mb-3">Mistake DNA</h3>
        <p className="text-sm text-ink-400">No mistakes recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-ink-800">Mistake DNA</h3>
        <span className="text-xs text-ink-500">{total} total</span>
      </div>

      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden mb-3">
        {byType.map((t) => (
          <div
            key={t.type}
            className={clsx(TYPE_COLORS[t.type] ?? "bg-ink-200")}
            style={{ width: `${t.pct}%` }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {byType.map((t) => (
          <div key={t.type} className="flex items-center gap-1.5 text-xs text-ink-600">
            <span className={clsx("h-2.5 w-2.5 rounded-sm", TYPE_COLORS[t.type] ?? "bg-ink-200")} />
            {TYPE_LABELS[t.type] ?? t.type}
            <span className="text-ink-400">({Math.round(t.pct)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
