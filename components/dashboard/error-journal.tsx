"use client";

import clsx from "clsx";
import { BookX } from "lucide-react";

interface Mistake {
  id: string;
  mistakeType: string;
  description: string;
  subjectKey: string | null;
  topic: string | null;
  occurrences: number;
  lastSeenAt: string;
}

interface ErrorJournalProps {
  mistakes: Mistake[];
}

const TYPE_LABELS: Record<string, string> = {
  CONCEPT_GAP: "Concept Gap",
  COMPUTATION: "Computation",
  MISREAD: "Misread",
  LOGIC_ERROR: "Logic Error",
  INCOMPLETE: "Incomplete",
};

export function ErrorJournal({ mistakes }: ErrorJournalProps) {
  if (mistakes.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-ink-100 bg-white p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-coral-500/15">
            <BookX className="h-5 w-5 text-coral-500" />
          </div>
          <h3 className="text-sm font-extrabold text-ink-900">Error Journal</h3>
        </div>
        <p className="text-sm text-ink-400">No mistakes recorded yet. Keep practicing!</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-ink-100 bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-coral-500/15">
            <BookX className="h-5 w-5 text-coral-500" />
          </div>
          <h3 className="text-sm font-extrabold text-ink-900">Error Journal</h3>
        </div>
        <span className="text-xs font-bold text-ink-500">{mistakes.length} entries</span>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {mistakes.map((m) => (
          <div
            key={m.id}
            className="flex items-start gap-3 rounded-xl border-2 border-ink-100 bg-ink-50/50 p-3"
          >
            <span
              className={clsx(
                "shrink-0 text-[10px] font-bold px-2.5 py-0.5 rounded-full",
                m.mistakeType === "CONCEPT_GAP" && "bg-coral-400/15 text-coral-500",
                m.mistakeType === "COMPUTATION" && "bg-amber-400/15 text-amber-500",
                m.mistakeType === "MISREAD" && "bg-blue-400/15 text-blue-500",
                m.mistakeType === "LOGIC_ERROR" && "bg-purple-400/15 text-purple-500",
                !["CONCEPT_GAP", "COMPUTATION", "MISREAD", "LOGIC_ERROR"].includes(m.mistakeType) &&
                  "bg-ink-200/50 text-ink-600",
              )}
            >
              {TYPE_LABELS[m.mistakeType] ?? m.mistakeType}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-ink-700 truncate">{m.description}</p>
              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-ink-400">
                {m.topic && <span>{m.topic}</span>}
                {m.occurrences > 1 && <span className="font-bold">{m.occurrences}x</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
