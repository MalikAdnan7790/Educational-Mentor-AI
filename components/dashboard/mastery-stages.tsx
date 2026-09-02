"use client";

import clsx from "clsx";

type Stage = "I_KNOW" | "I_CAN" | "I_MASTER";

interface MasteryItem {
  subjectKey: string;
  topic: string;
  stage: Stage;
  masteryPct: number;
  progressPct: number;
  evidence: {
    problemsAttempted: number;
    problemsCorrect: number;
    hintsUsed: number;
    explainBacks: number;
    bestExplainScore: number | null;
    aiFreeCorrect: number;
  };
}

interface MasteryStagesProps {
  items: MasteryItem[];
  counts: { iKnow: number; iCan: number; iMaster: number };
}

const STAGE_META: Record<Stage, { label: string; icon: string; badge: string; bar: string }> = {
  I_KNOW: {
    label: "I KNOW",
    icon: "📘",
    badge: "bg-ink-100 text-ink-600",
    bar: "bg-ink-300",
  },
  I_CAN: {
    label: "I CAN",
    icon: "✏️",
    badge: "bg-amber-400/15 text-amber-500",
    bar: "bg-amber-400",
  },
  I_MASTER: {
    label: "I MASTER",
    icon: "🏆",
    badge: "bg-mint-400/15 text-mint-600",
    bar: "bg-mint-500",
  },
};

function evidenceLine(e: MasteryItem["evidence"]): string {
  const parts: string[] = [];
  if (e.problemsAttempted > 0) {
    parts.push(`${e.problemsCorrect}/${e.problemsAttempted} solved`);
    if (e.hintsUsed > 0) parts.push(`${e.hintsUsed} hint${e.hintsUsed === 1 ? "" : "s"}`);
  }
  if (e.aiFreeCorrect > 0) parts.push("AI-free ✓");
  if (e.explainBacks > 0) {
    const score = e.bestExplainScore !== null ? ` (${Math.round(e.bestExplainScore)}%)` : "";
    parts.push(`explained back${score}`);
  }
  return parts.length > 0 ? parts.join(" · ") : "Just started";
}

export function MasteryStages({ items, counts }: MasteryStagesProps) {
  const total = items.length;

  return (
    <div className="card p-5">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-ink-800">My Mastery Journey</h3>
        <p className="text-xs text-ink-400">
          Every topic moves from <span className="font-medium">I KNOW</span> →{" "}
          <span className="font-medium">I CAN</span> →{" "}
          <span className="font-medium">I MASTER</span> based on what you actually show.
        </p>
      </div>

      {total === 0 ? (
        <p className="text-sm text-ink-400">
          Solve problems, complete challenges, or explain a topic back — your journey appears here.
        </p>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-3 gap-2">
            {(Object.keys(STAGE_META) as Stage[]).map((stage) => (
              <div
                key={stage}
                className={clsx(
                  "rounded-lg px-3 py-2 text-center",
                  stage === "I_KNOW" && "bg-ink-50",
                  stage === "I_CAN" && "bg-amber-400/10",
                  stage === "I_MASTER" && "bg-mint-400/10",
                )}
              >
                <div className="text-lg font-semibold text-ink-800">
                  {stage === "I_KNOW" ? counts.iKnow : stage === "I_CAN" ? counts.iCan : counts.iMaster}
                </div>
                <div className="text-[11px] text-ink-500">
                  {STAGE_META[stage].icon} {STAGE_META[stage].label}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {items.map((item) => {
              const meta = STAGE_META[item.stage];
              return (
                <div key={`${item.subjectKey}:${item.topic}`} className="rounded-lg border border-ink-100 p-3">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-ink-800 truncate block">{item.topic}</span>
                      {item.subjectKey && (
                        <span className="text-[11px] text-ink-400 uppercase tracking-wide">{item.subjectKey}</span>
                      )}
                    </div>
                    <span className={clsx("shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold", meta.badge)}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-ink-100 overflow-hidden mb-1.5">
                    <div
                      className={clsx("h-full rounded-full", meta.bar)}
                      style={{ width: `${Math.max(3, Math.min(100, item.progressPct))}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-ink-400">{evidenceLine(item.evidence)}</p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
