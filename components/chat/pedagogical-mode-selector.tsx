"use client";

import { BookOpen, PenTool, Lightbulb, HelpCircle, FileText, Hash, MessageCircle, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  EXPLAIN: BookOpen,
  PRACTICE: PenTool,
  HINT: Lightbulb,
  QUIZ: HelpCircle,
  EXAM: FileText,
  STEP_SOLVER: Hash,
  TEACHER_CHAT: MessageCircle,
  REVISION: RefreshCw,
};

const PEDAGOGICAL_MODES = [
  { value: "EXPLAIN", label: "Explain", desc: "Concept explanation with analogies" },
  { value: "PRACTICE", label: "Practice", desc: "Solve problems with feedback" },
  { value: "HINT", label: "Hints", desc: "Progressive hints only" },
  { value: "QUIZ", label: "Quiz", desc: "Rapid-fire assessment" },
  { value: "EXAM", label: "Exam", desc: "Timed assessment simulation" },
  { value: "STEP_SOLVER", label: "Step-by-Step", desc: "Guided problem solving" },
  { value: "TEACHER_CHAT", label: "Chat", desc: "Free-form Socratic dialogue" },
  { value: "REVISION", label: "Revision", desc: "Spaced-repetition review" },
] as const;

export type PedagogicalModeValue = (typeof PEDAGOGICAL_MODES)[number]["value"];

interface PedagogicalModeSelectorProps {
  value: PedagogicalModeValue | null;
  onChange: (mode: PedagogicalModeValue | null) => void;
  disabled?: boolean;
}

export function PedagogicalModeSelector({
  value,
  onChange,
  disabled,
}: PedagogicalModeSelectorProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-xs font-bold text-ink-400 mr-0.5">Task:</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(null)}
        className={
          "rounded-full px-2.5 py-1 text-xs font-bold transition-colors border-2 " +
          (value === null
            ? "bg-mint-400 text-white border-mint-500"
            : "border-ink-200 bg-white text-ink-500 hover:bg-ink-50 hover:border-ink-300 disabled:opacity-50")
        }
        title="Auto-detect from your message"
      >
        Auto
      </button>
      {PEDAGOGICAL_MODES.map((m) => {
        const Icon = ICON_MAP[m.value];
        return (
          <button
            key={m.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(m.value)}
            className={
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-colors border-2 " +
              (value === m.value
                ? "bg-mint-400 text-white border-mint-500"
                : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50 hover:border-ink-300 disabled:opacity-50")
            }
            title={m.desc}
          >
            {Icon && <Icon className="h-3 w-3" />}
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
