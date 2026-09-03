"use client";

import clsx from "clsx";
import { Brain } from "lucide-react";

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
      <div className="rounded-2xl border-2 border-ink-100 bg-white p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15">
            <Brain className="h-5 w-5 text-purple-500" />
          </div>
          <h3 className="text-sm font-bold text-ink-800">Knowledge vs Confidence</h3>
        </div>
        <p className="text-sm text-ink-400">Not enough data yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-ink-100 bg-white p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15">
          <Brain className="h-5 w-5 text-purple-500" />
        </div>
        <h3 className="text-sm font-bold text-ink-800">Knowledge vs Confidence</h3>
      </div>

      <div className="space-y-3 max-h-[260px] overflow-y-auto">
        {items.slice(0, 10).map((item) => (
          <div key={item.topic} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-700 font-bold truncate max-w-[180px]">{item.topic}</span>
              <span
                className={clsx(
                  "text-[10px] px-2 py-0.5 rounded-full font-bold",
                  item.classification === "balanced" && "bg-mint-400/15 text-mint-500",
                  item.classification === "under-confident" && "bg-blue-400/15 text-blue-500",
                  item.classification === "over-confident" && "bg-amber-400/15 text-amber-500",
                )}
              >
                {item.classification}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-ink-100 overflow-hidden relative">
                <div
                  className="absolute h-full rounded-full bg-mint-400 transition-all"
                  style={{ width: `${Math.round(item.masteryPct)}%` }}
                />
              </div>
              <div className="flex-1 h-2 rounded-full bg-ink-100 overflow-hidden relative">
                <div
                  className="absolute h-full rounded-full bg-blue-400 transition-all"
                  style={{ width: `${Math.round(item.confidencePct)}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-ink-400 font-medium">
              <span>Knowledge {Math.round(item.masteryPct)}%</span>
              <span>Confidence {Math.round(item.confidencePct)}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-4 text-xs text-ink-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-mint-400" /> <span className="font-medium">Mastery</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-400" /> <span className="font-medium">Confidence</span>
        </span>
      </div>
    </div>
  );
}
