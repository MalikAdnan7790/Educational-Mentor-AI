"use client";

import clsx from "clsx";

interface DnaTrait {
  label: string;
  icon: string;
  evidence: string;
}

interface DnaStats {
  totalProblems: number;
  totalAttempts: number;
  firstAttemptAccuracy: number;
  avgHintsPerProblem: number;
  retrySuccessRate: number;
  aiFreeSuccessRate: number;
  explainBackCount: number;
  explainBackAvg: number | null;
  chatConversations: number;
  activeDays: number;
  topSubjects: { subject: string; count: number }[];
}

interface LearningDnaProps {
  hasData: boolean;
  traits: DnaTrait[];
  stats: DnaStats;
  topMistakes: { type: string; count: number }[];
  summaryLine: string | null;
}

const MISTAKE_LABELS: Record<string, string> = {
  CONCEPT_GAP: "Concept gap",
  CALCULATION_ERROR: "Calculation error",
  CARELESS_MISTAKE: "Careless mistake",
  WRONG_FORMULA: "Wrong formula",
  WRONG_METHOD: "Wrong method",
  QUESTION_MISUNDERSTANDING: "Misread question",
  INCOMPLETE_REASONING: "Incomplete reasoning",
  SYNTAX_ERROR: "Syntax error",
  LOGICAL_ERROR: "Logical error",
  NONE: "Other",
};

const SUBJECT_LABELS: Record<string, string> = {
  MATH: "Math",
  PHYSICS: "Physics",
  CHEMISTRY: "Chemistry",
  BIOLOGY: "Biology",
  CS: "Computer Science",
  PROGRAMMING: "Programming",
  LANGUAGE: "Language",
  HISTORY: "History",
  OTHER: "Other",
};

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-ink-50 px-3 py-2 text-center">
      <div className="text-sm font-semibold text-ink-800">{value}</div>
      <div className="text-[11px] text-ink-400">{label}</div>
    </div>
  );
}

export function LearningDna({ hasData, traits, stats, topMistakes, summaryLine }: LearningDnaProps) {
  return (
    <div className="card p-5">
      <div className="mb-1">
        <h3 className="text-sm font-semibold text-ink-800">Learning DNA</h3>
        <p className="text-xs text-ink-400">
          {hasData ? summaryLine ?? "Based on your activity so far." : "Built only from what you actually do — no labels, no guesswork."}
        </p>
      </div>

      {!hasData ? (
        <p className="mt-3 text-sm text-ink-400">
          Start solving problems or asking questions and your Learning DNA will appear here.
        </p>
      ) : (
        <>
          {traits.length > 0 ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {traits.map((t) => (
                <div key={t.label} className="rounded-lg border border-ink-100 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{t.icon}</span>
                    <span className="text-sm font-medium text-ink-800">{t.label}</span>
                  </div>
                  <p className="text-xs text-ink-500 leading-relaxed">{t.evidence}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink-400">
              Keep practicing — once we see a pattern in how you work, it will show up here.
            </p>
          )}

          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
            <StatChip label="Problems" value={String(stats.totalProblems)} />
            <StatChip label="First try" value={`${Math.round(stats.firstAttemptAccuracy)}%`} />
            <StatChip label="Avg hints" value={stats.totalProblems > 0 ? stats.avgHintsPerProblem.toFixed(1) : "—"} />
            <StatChip label="Explain-backs" value={String(stats.explainBackCount)} />
            <StatChip label="Active days" value={String(stats.activeDays)} />
          </div>

          {topMistakes.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-ink-600 mb-1.5">Most frequent mistakes</p>
              <div className="flex flex-wrap gap-1.5">
                {topMistakes.map((m) => (
                  <span
                    key={m.type}
                    className="rounded-full bg-coral-500/10 px-2.5 py-1 text-xs text-coral-500"
                  >
                    {MISTAKE_LABELS[m.type] ?? m.type} ×{m.count}
                  </span>
                ))}
              </div>
            </div>
          )}

          {stats.topSubjects.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-ink-600 mb-1.5">Most practiced</p>
              <div className="flex flex-wrap gap-1.5">
                {stats.topSubjects.map((s) => (
                  <span
                    key={s.subject}
                    className={clsx("rounded-full px-2.5 py-1 text-xs text-ink-600 bg-ink-50")}
                  >
                    {SUBJECT_LABELS[s.subject] ?? s.subject} ×{s.count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
