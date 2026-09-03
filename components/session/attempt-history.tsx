import clsx from "clsx";
import type { Attempt } from "@prisma/client";

export function AttemptHistory({ attempts }: { attempts: Attempt[] }) {
  if (attempts.length === 0) return null;

  return (
    <div className="rounded-2xl border-2 border-ink-100 bg-white p-5">
      <div className="text-xs font-bold uppercase tracking-wider text-ink-500">
        Attempt History
      </div>
      <ul className="mt-3 divide-y divide-ink-100">
        {attempts.map((a) => (
          <li key={a.id} className="flex items-start gap-3 py-3">
            <div
              className={clsx(
                "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                a.isCorrect
                  ? "bg-mint-500/15 text-mint-700"
                  : "bg-coral-500/15 text-coral-700"
              )}
            >
              {a.attemptNumber}
            </div>
            <div className="min-w-0 flex-1">
              <p className="whitespace-pre-wrap text-sm text-ink-800">{a.answer}</p>
              <div className="mt-1.5 flex flex-wrap gap-2 text-xs">
                <span
                  className={clsx(
                    "rounded-xl px-2 py-0.5 font-semibold",
                    a.isCorrect ? "bg-mint-500/10 text-mint-700" : "bg-coral-500/10 text-coral-700"
                  )}
                >
                  {a.isCorrect ? "Correct" : "Incorrect"}
                </span>
                <span className="rounded-xl bg-ink-100 px-2 py-0.5 font-semibold text-ink-700">
                  Reasoning: {a.reasoning.toLowerCase()}
                </span>
                {a.mistakeType !== "NONE" && (
                  <span className="rounded-xl bg-amber-400/15 px-2 py-0.5 font-semibold text-amber-700">
                    {a.mistakeType.toLowerCase().replace(/_/g, " ")}
                  </span>
                )}
                <span className="font-medium text-ink-500">hint lvl {a.hintLevelUsed}</span>
                {a.timeTakenSec !== null && (
                  <span className="font-medium text-ink-500">{a.timeTakenSec}s</span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
