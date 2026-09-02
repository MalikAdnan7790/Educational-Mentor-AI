"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/lib/independent-engine";
import clsx from "clsx";

const TONE = {
  STRONG: { bg: "bg-mint-500/10", ring: "ring-mint-500/30", label: "Reasoning: Strong", icon: "✓" },
  ADEQUATE: { bg: "bg-amber-400/10", ring: "ring-amber-500/30", label: "Reasoning: Adequate", icon: "~" },
  WEAK: { bg: "bg-amber-400/10", ring: "ring-amber-500/30", label: "Reasoning: Weak", icon: "!" },
  INCORRECT: { bg: "bg-coral-500/10", ring: "ring-coral-500/30", label: "Reasoning: Incorrect", icon: "×" },
} as const;

const MISTAKE_LABEL: Record<string, string> = {
  NONE: "",
  CONCEPT_GAP: "Concept Gap",
  CALCULATION_ERROR: "Calculation Error",
  CARELESS_MISTAKE: "Careless Mistake",
  WRONG_FORMULA: "Wrong Formula",
  WRONG_METHOD: "Wrong Method",
  QUESTION_MISUNDERSTANDING: "Question Misunderstanding",
  INCOMPLETE_REASONING: "Incomplete Reasoning",
  SYNTAX_ERROR: "Syntax Error",
  LOGICAL_ERROR: "Logical Error",
};

export function FeedbackPanel({
  analysis,
  attemptNumber,
}: {
  analysis: AnalysisResult;
  attemptNumber: number;
}) {
  const tone = TONE[analysis.reasoning];
  const [speaking, setSpeaking] = useState(false);

  const readAloud = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(analysis.feedback);
    utterance.rate = 1;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  return (
    <div
      className={clsx(
        "rounded-2xl p-5 ring-1",
        tone.bg,
        tone.ring,
        analysis.isCorrect ? "" : "border-l-4 border-coral-500"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-ink-600">
            Attempt #{attemptNumber} — Analysis
          </div>
          <h3 className="mt-1 text-lg font-semibold text-ink-900">
            {analysis.isCorrect ? "Final answer correct" : "Not quite there"}
            <span className="ml-2 text-base">
              {analysis.isCorrect ? "✓" : "×"}
            </span>
          </h3>
        </div>
        <div className="text-right">
          <div className="text-xs text-ink-500">Reasoning score</div>
          <div className="text-lg font-semibold tabular-nums">{analysis.reasoningScore}</div>
        </div>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-800">
        {analysis.feedback}
      </p>

      <button
        onClick={readAloud}
        className="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-ink-500 transition hover:bg-ink-100 hover:text-ink-700"
        title={speaking ? "Stop reading" : "Read feedback aloud"}
      >
        {speaking ? (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
          </svg>
        )}
        {speaking ? "Stop" : "Read aloud"}
      </button>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span
          className={clsx(
            "rounded-full px-2.5 py-1 font-medium",
            tone.bg,
            "ring-1",
            tone.ring
          )}
        >
          {tone.icon} {tone.label}
        </span>
        {!analysis.isCorrect && analysis.mistakeType !== "NONE" && (
          <span className="rounded-full bg-coral-500/10 px-2.5 py-1 font-medium text-coral-700 ring-1 ring-coral-500/30">
            {MISTAKE_LABEL[analysis.mistakeType] ?? analysis.mistakeType}
          </span>
        )}
        <span className="rounded-full bg-ink-100 px-2.5 py-1 font-medium text-ink-700">
          Next: {analysis.nextAction}
        </span>
      </div>
    </div>
  );
}
