"use client";

const PEDAGOGICAL_MODES = [
  { value: "EXPLAIN", label: "Explain", icon: "📖", desc: "Concept explanation with analogies" },
  { value: "PRACTICE", label: "Practice", icon: "✏️", desc: "Solve problems with feedback" },
  { value: "HINT", label: "Hints", icon: "💡", desc: "Progressive hints only" },
  { value: "QUIZ", label: "Quiz", icon: "❓", desc: "Rapid-fire assessment" },
  { value: "EXAM", label: "Exam", icon: "📝", desc: "Timed assessment simulation" },
  { value: "STEP_SOLVER", label: "Step-by-Step", icon: "🔢", desc: "Guided problem solving" },
  { value: "TEACHER_CHAT", label: "Chat", icon: "💬", desc: "Free-form Socratic dialogue" },
  { value: "REVISION", label: "Revision", icon: "🔄", desc: "Spaced-repetition review" },
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
      <span className="text-xs text-ink-400 mr-0.5">Task:</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(null)}
        className={
          "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors " +
          (value === null
            ? "bg-teal-600 text-white"
            : "border border-ink-200 bg-white text-ink-500 hover:bg-ink-50 disabled:opacity-50")
        }
        title="Auto-detect from your message"
      >
        Auto
      </button>
      {PEDAGOGICAL_MODES.map((m) => (
        <button
          key={m.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(m.value)}
          className={
            "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors " +
            (value === m.value
              ? "bg-teal-600 text-white"
              : "border border-ink-200 bg-white text-ink-600 hover:bg-ink-50 disabled:opacity-50")
          }
          title={m.desc}
        >
          <span className="mr-0.5">{m.icon}</span>
          {m.label}
        </button>
      ))}
    </div>
  );
}
