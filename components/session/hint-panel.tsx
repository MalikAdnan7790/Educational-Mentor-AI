import clsx from "clsx";
import { Lightbulb } from "lucide-react";

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
    <div className="rounded-2xl border-2 border-ink-100 bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15 text-amber-500">
            <Lightbulb className="h-5 w-5" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
            Progressive Hints ({hints.length}/6)
          </span>
        </div>
        <button onClick={onRequest} disabled={loading || locked} className="btn-amber">
          {loading ? "Loading…" : locked ? "Locked" : "Ask for a hint"}
        </button>
      </div>

      {locked && lockReason && (
        <p className="mt-3 rounded-xl border-2 border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-medium text-amber-700">
          {lockReason}
        </p>
      )}

      {hints.length === 0 ? (
        <p className="mt-3 text-sm font-medium text-ink-500">
          No hints requested yet. Try to solve the problem on your own first.
        </p>
      ) : (
        <ol className="mt-4 space-y-3">
          {hints.map((h, i) => (
            <li
              key={i}
              className={clsx(
                "rounded-xl border-2 border-ink-100 bg-ink-50/50 p-3 text-sm",
                "transition",
                i === hints.length - 1 && "border-amber-400/40 bg-amber-400/5"
              )}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-ink-700">
                  Level {h.level}
                </span>
                <span className="font-medium text-ink-500">
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
