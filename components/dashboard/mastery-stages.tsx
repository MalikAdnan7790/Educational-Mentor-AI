"use client";

import clsx from "clsx";
import { BookOpen, Pencil, Trophy } from "lucide-react";

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

const STAGE_META: Record<Stage, { label: string; icon: typeof BookOpen; badge: string; bar: string; bg: string }> = {
  I_KNOW: {
    label: "I KNOW",
    icon: BookOpen,
    badge: "bg-mint-400/15 text-mint-600",
    bar: "bg-mint-500",
    bg: "bg-mint-400/10",
  },
  I_CAN: {
    label: "I CAN",
    icon: Pencil,
    badge: "bg-sky-400/15 text-sky-500",
    bar: "bg-sky-400",
    bg: "bg-sky-400/10",
  },
  I_MASTER: {
    label: "I MASTER",
    icon: Trophy,
    badge: "bg-purple-400/15 text-purple-500",
    bar: "bg-purple-500",
    bg: "bg-purple-400/10",
  },
};

function evidenceLine(e: MasteryItem["evidence"]): string {
  const parts: string[] = [];
  if (e.problemsAttempted > 0) {
    parts.push(`${e.problemsCorrect}/${e.problemsAttempted} solved`);
    if (e.hintsUsed > 0) parts.push(`${e.hintsUsed} hint${e.hintsUsed === 1 ? "" : "s"}`);
  }
  if (e.aiFreeCorrect > 0) parts.push("AI-free");
  if (e.explainBacks > 0) {
    const score = e.bestExplainScore !== null ? ` (${Math.round(e.bestExplainScore)}%)` : "";
    parts.push(`explained back${score}`);
  }
  return parts.length > 0 ? parts.join(" · ") : "Just started";
}

export function MasteryStages({ items, counts }: MasteryStagesProps) {
  const total = items.length;

  return (
    <div className="rounded-2xl border-2 border-ink-100 bg-white p-5">
      <div className="mb-3">
        <h3 className="text-sm font-extrabold text-ink-900">My Mastery Journey</h3>
        <p className="text-xs text-ink-400">
          Every topic moves from <span className="font-bold">I KNOW</span> {"\u2192"}{" "}
          <span className="font-bold">I CAN</span> {"\u2192"}{" "}
          <span className="font-bold">I MASTER</span> based on what you actually show.
        </p>
      </div>

      {total === 0 ? (
        <p className="text-sm text-ink-400">
          Solve problems, complete challenges, or explain a topic back — your journey appears here.
        </p>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-3 gap-2">
            {(Object.keys(STAGE_META) as Stage[]).map((stage) => {
              const meta = STAGE_META[stage];
              const Icon = meta.icon;
              const count = stage === "I_KNOW" ? counts.iKnow : stage === "I_CAN" ? counts.iCan : counts.iMaster;
              return (
                <div
                  key={stage}
                  className={clsx(
                    "rounded-xl px-3 py-2.5 text-center",
                    meta.bg
                  )}
                >
                  <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 mb-1">
                    <Icon className={clsx("h-4 w-4", stage === "I_KNOW" ? "text-mint-500" : stage === "I_CAN" ? "text-sky-500" : "text-purple-500")} />
                  </div>
                  <div className={clsx("text-lg font-extrabold", stage === "I_KNOW" ? "text-mint-600" : stage === "I_CAN" ? "text-sky-600" : "text-purple-600")}>{count}</div>
                  <span className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-ink-500">{meta.label}</span>
                </div>
              );
            })}
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {items.map((item) => {
              const meta = STAGE_META[item.stage];
              const Icon = meta.icon;
              return (
                <div key={`${item.subjectKey}:${item.topic}`} className="rounded-xl border-2 border-ink-100 p-3">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-ink-800 truncate block">{item.topic}</span>
                      {item.subjectKey && (
                        <span className="text-[11px] text-ink-400 font-medium uppercase tracking-wide">{item.subjectKey}</span>
                      )}
                    </div>
                    <span className={clsx("shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold", meta.badge)}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-ink-100 overflow-hidden mb-1.5">
                    <div
                      className={clsx("h-full rounded-full", meta.bar)}
                      style={{ width: `${Math.max(3, Math.min(100, item.progressPct))}%` }}
                    />
                  </div>
                  <p className="text-[11px] font-medium text-ink-400">{evidenceLine(item.evidence)}</p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
