import clsx from "clsx";

interface Hint {
  level: number;
  content: string;
  kind: string;
}

export function HintPanel({
  hints,
  onRequest,
  loading,
  locked,
  lockReason,
}: {
  hints: Hint[];
  onRequest: () => void;
  loading: boolean;
  locked: boolean;
  lockReason?: string;
}) {
  const KIND_LABEL: Record<string, string> = {
    question: "Question-based hint",
    concept: "Concept reminder",
    method: "Method hint",
    "step-guide": "Step-by-step guidance",
    "partial-solution": "Partial solution",
    "full-solution": "Complete explanation",
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-ink-500">
          Progressive Hints ({hints.length}/6)
        </div>
        <button onClick={onRequest} disabled={loading || locked} className="btn-amber">
          {loading ? "Loading…" : locked ? "Locked" : "Ask for a hint"}
        </button>
      </div>

      {locked && lockReason && (
        <p className="mt-2 rounded-lg bg-amber-400/10 px-3 py-2 text-xs text-amber-700">
          {lockReason}
        </p>
      )}

      {hints.length === 0 ? (
        <p className="mt-3 text-sm text-ink-500">
          No hints requested yet. Try to solve the problem on your own first.
        </p>
      ) : (
        <ol className="mt-4 space-y-3">
          {hints.map((h, i) => (
            <li
              key={i}
              className={clsx(
                "rounded-xl border border-ink-100 bg-ink-50/50 p-3 text-sm",
                "transition",
                i === hints.length - 1 && "border-amber-400/40 bg-amber-400/5"
              )}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-ink-700">
                  Level {h.level}
                </span>
                <span className="text-ink-500">
                  {KIND_LABEL[h.kind] ?? h.kind}
                </span>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-ink-800">{h.content}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
