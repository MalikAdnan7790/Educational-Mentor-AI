"use client";

const MODES = [
  { value: "DEPENDENT", label: "Dependent", desc: "Full explanations" },
  { value: "GUIDED", label: "Guided", desc: "Socratic method" },
  { value: "ADAPTIVE", label: "Adaptive", desc: "Help adjusts to progress" },
  { value: "INDEPENDENT", label: "Independent", desc: "Minimal hints" },
] as const;

interface ModeSelectorProps {
  value: string;
  onChange: (mode: string) => void;
  isAiFree: boolean;
  onAiFreeChange: (isAiFree: boolean) => void;
  disabled?: boolean;
}

export function ModeSelector({
  value,
  onChange,
  isAiFree,
  onAiFreeChange,
  disabled,
}: ModeSelectorProps) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {MODES.map((m) => (
        <button
          key={m.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(m.value)}
          className={
            "rounded-full px-3 py-1.5 text-xs font-bold transition-colors border-2 " +
            (value === m.value
              ? "bg-mint-400 text-white border-mint-500"
              : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50 hover:border-ink-300 disabled:opacity-50")
          }
          title={m.desc}
        >
          {m.label}
        </button>
      ))}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onAiFreeChange(!isAiFree)}
        aria-pressed={isAiFree}
        className={
          "rounded-full px-3 py-1.5 text-xs font-bold transition-colors border-2 " +
          (isAiFree
            ? "bg-coral-500 text-white border-coral-600"
            : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50 hover:border-ink-300 disabled:opacity-50")
        }
        title="No AI help"
      >
        AI-Free
      </button>
    </div>
  );
}
