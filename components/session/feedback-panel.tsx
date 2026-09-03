"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/lib/independent-engine";
import clsx from "clsx";
import { CheckCircle, XCircle, AlertCircle, Volume2, VolumeX } from "lucide-react";

const TONE = {
  STRONG: { bg: "bg-mint-500/10", ring: "ring-mint-500/30", label: "Reasoning: Strong", icon: CheckCircle, iconColor: "text-mint-500" },
  ADEQUATE: { bg: "bg-amber-400/10", ring: "ring-amber-500/30", label: "Reasoning: Adequate", icon: AlertCircle, iconColor: "text-amber-500" },
  WEAK: { bg: "bg-amber-400/10", ring: "ring-amber-500/30", label: "Reasoning: Weak", icon: AlertCircle, iconColor: "text-amber-500" },
  INCORRECT: { bg: "bg-coral-500/10", ring: "ring-coral-500/30", label: "Reasoning: Incorrect", icon: XCircle, iconColor: "text-coral-500" },
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
  const ToneIcon = tone.icon;
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
        "rounded-2xl border-2 p-5 ring-1",
        tone.bg,
        tone.ring,
        analysis.isCorrect ? "border-mint-400/40" : "border-coral-500/40"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className={clsx(
              "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              analysis.isCorrect
                ? "bg-mint-400/15 text-mint-500"
                : "bg-coral-500/15 text-coral-500"
            )}
          >
            {analysis.isCorrect ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
          </span>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-ink-600">
              Attempt #{attemptNumber} — Analysis
            </div>
            <h3 className="mt-1 text-lg font-extrabold text-ink-900">
              {analysis.isCorrect ? "Final answer correct" : "Not quite there"}
            </h3>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-medium text-ink-500">Reasoning score</div>
          <div className="text-lg font-extrabold tabular-nums text-ink-900">{analysis.reasoningScore}</div>
        </div>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-800">
        {analysis.feedback}
      </p>

      <button
        onClick={readAloud}
        className="mt-2 inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-medium text-ink-500 transition hover:bg-ink-100 hover:text-ink-700"
        title={speaking ? "Stop reading" : "Read feedback aloud"}
      >
        {speaking ? (
          <VolumeX className="h-3.5 w-3.5" />
        ) : (
          <Volume2 className="h-3.5 w-3.5" />
        )}
        {speaking ? "Stop" : "Read aloud"}
      </button>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span
          className={clsx(
            "inline-flex items-center gap-1 rounded-xl px-2.5 py-1 font-semibold",
            tone.bg,
            "ring-1",
            tone.ring
          )}
        >
          <ToneIcon className={clsx("h-3.5 w-3.5", tone.iconColor)} />
          {tone.label}
        </span>
        {!analysis.isCorrect && analysis.mistakeType !== "NONE" && (
          <span className="rounded-xl bg-coral-500/10 px-2.5 py-1 font-semibold text-coral-700 ring-1 ring-coral-500/30">
            {MISTAKE_LABEL[analysis.mistakeType] ?? analysis.mistakeType}
          </span>
        )}
        <span className="rounded-xl bg-ink-100 px-2.5 py-1 font-semibold text-ink-700">
          Next: {analysis.nextAction}
        </span>
      </div>
    </div>
  );
}
