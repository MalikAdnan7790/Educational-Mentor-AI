"use client";

interface NextActionCardProps {
  id: string;
  title: string;
  description: string;
  why: string;
  estMinutes: number;
  actionType: string;
  onComplete: () => void;
}

export function NextActionCard({
  title,
  description,
  why,
  estMinutes,
  actionType,
  onComplete,
}: NextActionCardProps) {
  const typeLabel: Record<string, string> = {
    REVIEW_MISTAKE: "Review",
    PRACTICE: "Practice",
    EXPLAIN_BACK: "Explain",
    CHALLENGE: "Challenge",
    READ: "Read",
  };

  return (
    <div className="card p-5 border-l-4 border-l-mint-500">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-mint-600 bg-mint-500/10 px-2 py-0.5 rounded-full">
              {typeLabel[actionType] ?? actionType}
            </span>
            <span className="text-[10px] text-ink-400">{estMinutes} min</span>
          </div>
          <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
          <p className="text-xs text-ink-500 mt-1">{description}</p>
          <p className="text-xs text-ink-400 mt-1 italic">{why}</p>
        </div>
        <button onClick={onComplete} className="btn-mint px-3 py-1.5 text-xs shrink-0">
          Start
        </button>
      </div>
    </div>
  );
}
