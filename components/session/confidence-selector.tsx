import { useState } from "react";
import clsx from "clsx";

const OPTIONS = [
  { value: 25, label: "Not confident", tone: "bg-coral-500/15 text-coral-700 ring-coral-500/30" },
  { value: 50, label: "Somewhat confident", tone: "bg-amber-400/15 text-amber-700 ring-amber-500/30" },
  { value: 75, label: "Confident", tone: "bg-mint-500/10 text-mint-700 ring-mint-500/30" },
  { value: 95, label: "Very confident", tone: "bg-mint-500/15 text-mint-700 ring-mint-500/40" },
];

export function ConfidenceSelector({
  onSubmit,
  existing,
  actualCorrect,
}: {
  onSubmit: (value: number) => void;
  existing?: number | null;
  actualCorrect?: boolean;
}) {
  const [value, setValue] = useState<number | null>(existing ?? null);
  const [submitted, setSubmitted] = useState(existing !== null && existing !== undefined);

  if (submitted) {
    const mismatch =
      value !== null && actualCorrect !== undefined && (value >= 75) !== actualCorrect;
    return (
      <div className="rounded-2xl border-2 border-ink-100 bg-white p-5">
        <div className="text-xs font-bold uppercase tracking-wider text-ink-500">
          Confidence Check
        </div>
        <p className="mt-2 text-sm text-ink-700">
          You rated your confidence at <strong className="font-bold">{value}%</strong>
          {actualCorrect !== undefined && (
            <>
              {" "}— your answer was{" "}
              <strong className={clsx("font-bold", actualCorrect ? "text-mint-600" : "text-coral-500")}>
                {actualCorrect ? "correct" : "incorrect"}
              </strong>
              .
            </>
          )}
        </p>
        {mismatch && (
          <p className="mt-2 rounded-xl border-2 border-amber-400/30 bg-amber-400/10 p-3 text-xs font-medium text-amber-700">
            {(value ?? 0) >= 75 && !actualCorrect
              ? "Heads up — overconfidence detected. Slow down and check your assumptions next time."
              : "Your confidence is lower than your results suggest. Trust your reasoning more."}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-ink-100 bg-white p-5">
      <div className="text-xs font-bold uppercase tracking-wider text-ink-500">
        Before we reveal the result — how confident are you?
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {OPTIONS.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => setValue(o.value)}
              className={clsx(
                "rounded-xl px-3 py-2 text-sm font-bold ring-2 transition",
                active ? o.tone : "bg-white text-ink-700 ring-ink-200 hover:bg-ink-50"
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        disabled={value === null}
        onClick={() => {
          if (value === null) return;
          setSubmitted(true);
          onSubmit(value);
        }}
        className="btn-primary mt-4 w-full"
      >
        Record confidence
      </button>
    </div>
  );
}
