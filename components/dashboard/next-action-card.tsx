"use client";

import { Sparkles, Clock } from "lucide-react";

interface NextActionCardProps {
  id: string;
  title: string;
  description: string;
  why: string;
  estMinutes: number;
  actionType: string;
  onComplete: () => void;
}

export function NextActionCard({
  title,
  description,
  why,
  estMinutes,
  actionType,
  onComplete,
}: NextActionCardProps) {
  const typeLabel: Record<string, string> = {
    REVIEW_MISTAKE: "Review",
    PRACTICE: "Practice",
    EXPLAIN_BACK: "Explain",
    CHALLENGE: "Challenge",
    READ: "Read",
  };

  return (
    <div className="rounded-2xl border-2 border-mint-400/30 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint-400/15">
              <Sparkles className="h-5 w-5 text-mint-500" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-mint-600 bg-mint-400/15 px-2.5 py-0.5 rounded-full">
                {typeLabel[actionType] ?? actionType}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3 text-ink-400" />
                <span className="text-[10px] font-medium text-ink-400">{estMinutes} min</span>
              </div>
            </div>
          </div>
          <h3 className="text-base font-bold text-ink-900">{title}</h3>
          <p className="text-xs text-ink-500 mt-1">{description}</p>
          <p className="text-xs text-ink-400 mt-1 italic">{why}</p>
        </div>
        <button
          onClick={onComplete}
          className="btn-primary shrink-0 rounded-xl px-5 py-2 text-sm font-bold shadow-[0_4px_0_0_#368a00]"
        >
          Start
        </button>
      </div>
    </div>
  );
}
