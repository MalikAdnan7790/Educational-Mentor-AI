"use client";

import { useState } from "react";
import { GraduationCap, ChevronDown, ChevronUp, X, AlertTriangle, Lightbulb } from "lucide-react";
import { ImageUpload } from "./image-upload";
import { TEACHER_ACTIONS, DEFAULT_ACTION, type TeacherActionId } from "@/lib/teacher-actions";

export interface QuestionAnalysis {
  subject: string;
  topic: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  questionDetected: string;
  studentAttempt: string | null;
  studentMistake: string | null;
  stuckAt: string | null;
  watchOuts: string[];
  suggestedFirstStep: string;
  aiPowered: boolean;
}

interface AskMyTeacherProps {
  onStart: (payload: {
    action: TeacherActionId;
    content: string;
    imageBase64?: string;
  }) => void;
  disabled?: boolean;
}

export function AskMyTeacher({ onStart, disabled }: AskMyTeacherProps) {
  const [open, setOpen] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [stuckOn, setStuckOn] = useState("");
  const [analysis, setAnalysis] = useState<QuestionAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAnalyze = !loading && !disabled && (!!imageBase64 || question.trim().length > 0);

  async function handleAnalyze() {
    setError(null);
    setLoading(true);
    setAnalysis(null);
    try {
      const resp = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imageBase64 ?? undefined,
          content: question.trim() || undefined,
          stuckOn: stuckOn.trim() || undefined,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(friendlyError(data.error));
        return;
      }
      setAnalysis(data.analysis as QuestionAnalysis);
    } catch {
      setError("Could not analyze right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleAction(actionId: TeacherActionId) {
    if (!analysis) return;
    const lines = [
      "[I uploaded a question for you to help me with]",
      `Question: ${analysis.questionDetected}`,
      `Subject: ${analysis.subject} \u00b7 Topic: ${analysis.topic} \u00b7 Difficulty: ${analysis.difficulty}`,
    ];
    if (analysis.studentAttempt) lines.push(`My attempt: ${analysis.studentAttempt}`);
    if (analysis.stuckAt) lines.push(`Where I'm stuck: ${analysis.stuckAt}`);
    if (stuckOn.trim()) lines.push(`In my own words: ${stuckOn.trim()}`);
    lines.push(analysis.suggestedFirstStep ? `I was suggested to start with: ${analysis.suggestedFirstStep}` : "Please help me with this.");

    onStart({
      action: actionId,
      content: lines.join("\n"),
      imageBase64: imageBase64 ?? undefined,
    });
  }

  function reset() {
    setImageBase64(null);
    setQuestion("");
    setStuckOn("");
    setAnalysis(null);
    setError(null);
  }

  return (
    <div className="rounded-2xl border-2 border-ink-100 bg-white p-4 sm:p-5 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/15 text-sky-500">
            <GraduationCap className="h-5 w-5 text-sky-600" />
          </span>
          <div>
            <h2 className="text-sm font-extrabold text-ink-900">Ask My Teacher</h2>
            <p className="text-xs text-ink-500">
              Upload your homework, a math problem, or your attempted solution \u2014 the teacher will read it first.
            </p>
          </div>
        </div>
        <span className="text-ink-400">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-3 fade-in">
          {/* Upload + inputs */}
          <div className="flex flex-wrap items-center gap-3">
            {imageBase64 && (
              <div className="relative group">
                <img
                  src={imageBase64}
                  alt="Your question"
                  className="h-16 w-16 rounded-xl object-cover border-2 border-ink-200"
                />
                <button
                  type="button"
                  onClick={() => setImageBase64(null)}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-coral-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <ImageUpload onImage={setImageBase64} disabled={disabled || loading} />
          </div>

          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Or type your question here (optional if you uploaded an image)..."
            rows={2}
            disabled={disabled || loading}
            className="w-full resize-none rounded-xl border-2 border-ink-200 px-4 py-3 text-sm text-ink-800 placeholder:text-ink-400 focus:border-sky-500 focus:outline-none"
          />
          <input
            value={stuckOn}
            onChange={(e) => setStuckOn(e.target.value)}
            placeholder="What are you stuck on? (optional)"
            disabled={disabled || loading}
            className="w-full rounded-xl border-2 border-ink-200 px-4 py-3 text-sm text-ink-800 placeholder:text-ink-400 focus:border-sky-500 focus:outline-none"
          />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className="btn-primary px-4 py-2 text-sm rounded-xl"
            >
              {loading ? "Reading your question..." : "Analyze my question"}
            </button>
            {(imageBase64 || question || analysis) && (
              <button
                type="button"
                onClick={reset}
                disabled={loading}
                className="text-xs font-medium text-ink-400 hover:text-ink-600 underline"
              >
                Clear
              </button>
            )}
          </div>

          {error && <p className="text-xs text-coral-500">{error}</p>}

          {/* Analysis card */}
          {analysis && (
            <div className="fade-in rounded-2xl border-2 border-ink-200 bg-ink-50/60 p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-xs font-bold uppercase tracking-wide text-ink-500">
                  What the teacher sees
                </h3>
                <div className="flex gap-1.5 text-[10px] font-bold">
                  <span className="rounded-full bg-mint-400 px-2 py-0.5 text-white">{analysis.subject}</span>
                  <span className="rounded-full bg-white border-2 border-ink-200 px-2 py-0.5 text-ink-600">{analysis.topic}</span>
                  <span className="rounded-full bg-white border-2 border-ink-200 px-2 py-0.5 text-ink-600">{analysis.difficulty}</span>
                </div>
              </div>

              <div className="text-sm text-ink-800 leading-relaxed">
                <span className="font-bold">Question: </span>
                {analysis.questionDetected}
              </div>

              {analysis.studentAttempt && (
                <div className="text-sm text-ink-700">
                  <span className="font-bold">Your attempt: </span>
                  {analysis.studentAttempt}
                </div>
              )}
              {analysis.studentMistake && (
                <div className="text-sm text-ink-700">
                  <span className="font-bold">I can see a possible slip: </span>
                  {analysis.studentMistake}
                </div>
              )}
              {analysis.stuckAt && (
                <div className="text-sm text-ink-700">
                  <span className="font-bold">Where you&apos;re stuck: </span>
                  {analysis.stuckAt}
                </div>
              )}

              {analysis.watchOuts.length > 0 && (
                <div className="rounded-xl bg-amber-50 border-2 border-amber-200 px-3 py-2">
                  <p className="text-xs font-bold text-amber-700 mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Watch out
                  </p>
                  <ul className="list-disc list-inside text-xs text-amber-800 space-y-0.5">
                    {analysis.watchOuts.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.suggestedFirstStep && (
                <div className="rounded-xl bg-white border-2 border-ink-200 px-3 py-2 text-xs text-ink-600">
                  <span className="font-bold text-ink-700 flex items-center gap-1 mb-0.5">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                    Suggested first step:
                  </span>
                  {analysis.suggestedFirstStep}
                </div>
              )}

              {!analysis.aiPowered && (
                <p className="text-[10px] text-ink-400">
                  Basic analysis (AI not configured). The chat teacher will still guide you.
                </p>
              )}

              {/* Teacher assistance modes */}
              <div className="pt-2 border-t-2 border-ink-200">
                <p className="text-xs font-bold text-ink-700 mb-2">
                  How would you like the teacher to help?
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TEACHER_ACTIONS.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => handleAction(a.id)}
                      disabled={disabled}
                      title={a.description}
                      className={
                        "flex flex-col items-start gap-0.5 rounded-xl border-2 px-3 py-2 text-left transition-colors disabled:opacity-50 " +
                        (a.id === DEFAULT_ACTION
                          ? "border-mint-500 bg-mint-400 text-white hover:bg-mint-500"
                          : "border-ink-200 bg-white text-ink-700 hover:border-ink-400 hover:bg-ink-50")
                      }
                    >
                      <span className="text-sm font-bold">
                        {a.label}
                        {a.id === DEFAULT_ACTION && (
                          <span className={"ml-1 text-[9px] font-normal " + (a.id === DEFAULT_ACTION ? "text-white/70" : "text-ink-400")}>
                            \u00b7 default
                          </span>
                        )}
                      </span>
                      <span className={"text-[10px] leading-snug " + (a.id === DEFAULT_ACTION ? "text-white/70" : "text-ink-500")}>
                        {a.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function friendlyError(code: string): string {
  switch (code) {
    case "invalid_input":
      return "Please upload an image or type your question first.";
    default:
      return "Could not analyze right now. Please try again.";
  }
}
