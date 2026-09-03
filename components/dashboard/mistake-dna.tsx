"use client";

import clsx from "clsx";
import { Dna } from "lucide-react";

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
      <div className="rounded-2xl border-2 border-ink-100 bg-white p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-coral-500/15">
            <Dna className="h-5 w-5 text-coral-500" />
          </div>
          <h3 className="text-sm font-bold text-ink-800">Mistake DNA</h3>
        </div>
        <p className="text-sm text-ink-400">No mistakes recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-ink-100 bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-coral-500/15">
            <Dna className="h-5 w-5 text-coral-500" />
          </div>
          <h3 className="text-sm font-bold text-ink-800">Mistake DNA</h3>
        </div>
        <span className="text-xs font-bold text-ink-500">{total} total</span>
      </div>

      {/* Stacked bar */}
      <div className="flex h-4 rounded-full overflow-hidden mb-3">
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
            <span className={clsx("h-3 w-3 rounded-md", TYPE_COLORS[t.type] ?? "bg-ink-200")} />
            <span className="font-medium">{TYPE_LABELS[t.type] ?? t.type}</span>
            <span className="text-ink-400">({Math.round(t.pct)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
