import type { Problem } from "@prisma/client";
import clsx from "clsx";
import {
  Calculator,
  Atom,
  FlaskConical,
  Dna,
  Monitor,
  Code,
  Languages,
  Landmark,
  CircleDot,
} from "lucide-react";

const DIFFICULTY_TONE: Record<Problem["difficulty"], string> = {
  EASY: "bg-mint-400/15 text-mint-600 border-mint-400/30",
  MEDIUM: "bg-amber-400/15 text-amber-600 border-amber-400/30",
  HARD: "bg-coral-500/15 text-coral-600 border-coral-500/30",
  REAL_WORLD: "bg-purple-500/15 text-purple-600 border-purple-500/30",
};

const SUBJECT_ICON: Record<string, React.ReactNode> = {
  MATH: <Calculator className="h-3.5 w-3.5" />,
  PHYSICS: <Atom className="h-3.5 w-3.5" />,
  CHEMISTRY: <FlaskConical className="h-3.5 w-3.5" />,
  BIOLOGY: <Dna className="h-3.5 w-3.5" />,
  CS: <Monitor className="h-3.5 w-3.5" />,
  PROGRAMMING: <Code className="h-3.5 w-3.5" />,
  LANGUAGE: <Languages className="h-3.5 w-3.5" />,
  HISTORY: <Landmark className="h-3.5 w-3.5" />,
  OTHER: <CircleDot className="h-3.5 w-3.5" />,
};

const SUBJECT_BADGE_BG: Record<string, string> = {
  MATH: "bg-sky-500/15 text-sky-600",
  PHYSICS: "bg-purple-500/15 text-purple-600",
  CHEMISTRY: "bg-mint-400/15 text-mint-600",
  BIOLOGY: "bg-mint-400/15 text-mint-600",
  CS: "bg-sky-500/15 text-sky-600",
  PROGRAMMING: "bg-sky-500/15 text-sky-600",
  LANGUAGE: "bg-amber-400/15 text-amber-600",
  HISTORY: "bg-amber-400/15 text-amber-600",
  OTHER: "bg-ink-100 text-ink-600",
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
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-ink-100 bg-white p-5 transition hover:border-ink-300 hover:shadow-md">
      <div className="flex items-center justify-between">
        <span
          className={clsx(
            "inline-flex items-center gap-1 rounded-full border-2 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide",
            DIFFICULTY_TONE[problem.difficulty]
          )}
        >
          {problem.difficulty}
        </span>
        <span
          className={clsx(
            "inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold",
            SUBJECT_BADGE_BG[problem.subject] ?? "bg-ink-100 text-ink-600"
          )}
        >
          {SUBJECT_ICON[problem.subject] ?? <CircleDot className="h-3.5 w-3.5" />}
          {problem.subject}
        </span>
      </div>

      <div>
        <h3 className="text-base font-bold text-ink-900">{problem.title}</h3>
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
