"use client";

import clsx from "clsx";

interface KCItem {
  topic: string;
  masteryPct: number;
  confidencePct: number;
  classification: "under-confident" | "over-confident" | "balanced";
}

interface KnowledgeConfidenceProps {
  items: KCItem[];
  summary: { underConfident: number; overConfident: number; balanced: number };
}

export function KnowledgeConfidence({ items, summary }: KnowledgeConfidenceProps) {
  if (items.length === 0) {
    return (
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-ink-800 mb-3">Knowledge vs Confidence</h3>
        <p className="text-sm text-ink-400">Not enough data yet.</p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-ink-800 mb-4">Knowledge vs Confidence</h3>

      <div className="space-y-3 max-h-[260px] overflow-y-auto">
        {items.slice(0, 10).map((item) => (
          <div key={item.topic} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-700 font-medium truncate max-w-[180px]">{item.topic}</span>
              <span
                className={clsx(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                  item.classification === "balanced" && "bg-mint-500/10 text-mint-600",
                  item.classification === "under-confident" && "bg-blue-400/10 text-blue-600",
                  item.classification === "over-confident" && "bg-amber-400/10 text-amber-500",
                )}
              >
                {item.classification}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-ink-100 overflow-hidden relative">
                <div
                  className="absolute h-full rounded-full bg-mint-500 transition-all"
                  style={{ width: `${Math.round(item.masteryPct)}%` }}
                />
              </div>
              <div className="flex-1 h-1.5 rounded-full bg-ink-100 overflow-hidden relative">
                <div
                  className="absolute h-full rounded-full bg-blue-400 transition-all"
                  style={{ width: `${Math.round(item.confidencePct)}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-ink-400">
              <span>Knowledge {Math.round(item.masteryPct)}%</span>
              <span>Confidence {Math.round(item.confidencePct)}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-3 text-xs text-ink-500">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-mint-500" /> Mastery
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-400" /> Confidence
        </span>
      </div>
    </div>
  );
}
