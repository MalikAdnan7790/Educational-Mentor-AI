import type { Problem } from "@prisma/client";
import clsx from "clsx";

const DIFFICULTY_TONE: Record<Problem["difficulty"], string> = {
  EASY: "bg-mint-500/10 text-mint-700 border-mint-500/30",
  MEDIUM: "bg-amber-400/15 text-amber-700 border-amber-500/30",
  HARD: "bg-coral-500/10 text-coral-700 border-coral-500/30",
  REAL_WORLD: "bg-ink-900/10 text-ink-900 border-ink-900/30",
};

const SUBJECT_EMOJI: Record<string, string> = {
  MATH: "∑",
  PHYSICS: "⚛",
  CHEMISTRY: "⚗",
  BIOLOGY: "🧬",
  CS: "⌘",
  PROGRAMMING: "{ }",
  LANGUAGE: "Aa",
  HISTORY: "⌛",
  OTHER: "•",
};

export function ProblemCard({
  problem,
  onStart,
  onStartAiFree,
}: {
  problem: Problem;
  onStart: () => void;
  onStartAiFree: () => void;
}) {
  return (
    <div className="card flex flex-col gap-3 p-5 transition hover:border-ink-300 hover:shadow-md">
      <div className="flex items-center justify-between">
        <span
          className={clsx(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
            DIFFICULTY_TONE[problem.difficulty]
          )}
        >
          {problem.difficulty}
        </span>
        <span className="chip">
          <span className="font-mono text-[10px]">{SUBJECT_EMOJI[problem.subject] ?? "•"}</span>
          {problem.subject}
        </span>
      </div>

      <div>
        <h3 className="text-base font-semibold text-ink-900">{problem.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-ink-600">{problem.content}</p>
      </div>

      <div className="mt-auto flex gap-2 pt-1">
        <button onClick={onStart} className="btn-primary flex-1">
          Start
        </button>
        <button onClick={onStartAiFree} className="btn-ghost flex-1">
          AI-Free
        </button>
      </div>
    </div>
  );
}
