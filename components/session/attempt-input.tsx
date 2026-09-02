import clsx from "clsx";

export function AttemptInput({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder,
  submitLabel = "Submit attempt",
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
  submitLabel?: string;
}) {
  const canSubmit = !disabled && value.trim().length > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit();
      }}
      className="space-y-3"
    >
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="textarea"
        rows={4}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            if (canSubmit) onSubmit();
          }
        }}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-ink-500">
          Tip: show your reasoning — it's evaluated, not just the final answer.
        </span>
        <button type="submit" disabled={!canSubmit} className={clsx("btn-primary", disabled && "opacity-50")}>
          {submitLabel} <kbd className="ml-1 rounded bg-white/10 px-1 text-[10px]">⌘↵</kbd>
        </button>
      </div>
    </form>
  );
}
