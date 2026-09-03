/**
 * Independent Mode engine — the core learning loop.
 *
 * This mock engine implements the full Independent Mode workflow:
 *   Present → Attempt → Analyze → Feedback → Hint (progressive, 6 levels)
 *   → Retry → Reveal (if necessary) → Confidence → Reflection.
 *
 * Replace `evaluateAttempt` and `generateHintContent` with calls to a real
 * LLM when you're ready. Keep the shape of the returned `AnalysisResult`
 * and `HintContent` identical so the UI and scoring layer remain untouched.
 */

import type {
  Attempt,
  Problem,
} from "@prisma/client";
import type {
  Difficulty,
  LearningMode,
  MistakeType,
  ReasoningQuality,
} from "@/types/prisma-enums";

export const HINT_LEVELS = {
  NONE: 0,
  QUESTION: 1,
  CONCEPT: 2,
  METHOD: 3,
  STEP_GUIDE: 4,
  PARTIAL_SOLUTION: 5,
  FULL_SOLUTION: 6,
} as const;

export type NextAction =
  | "accept"
  | "retry"
  | "reveal"
  | "escalate_difficulty";

export interface AnalysisResult {
  isCorrect: boolean;
  reasoning: ReasoningQuality;
  mistakeType: MistakeType;
  feedback: string;
  nextAction: NextAction;
  nextHintLevel: number;
  reasoningScore: number; // 0..100 for UI display
}

export interface HintContent {
  level: number;
  content: string;
  kind:
    | "question"
    | "concept"
    | "method"
    | "step-guide"
    | "partial-solution"
    | "full-solution";
}

export interface SessionInput {
  session: {
    id: string;
    mode: LearningMode;
    isAiFree: boolean;
    currentHintLevel: number;
  };
  problem: Problem;
  previousAttempts: Attempt[];
  newAnswer: string;
  timeTakenSec?: number;
}

const MAX_RETRIES_BEFORE_REVEAL = 4;

export function analyzeAttempt(input: SessionInput): AnalysisResult {
  const { problem, previousAttempts, newAnswer } = input;
  const attemptNumber = previousAttempts.length + 1;

  const isCorrect = checkAnswer(newAnswer, problem);
  const reasoning = evaluateReasoning(newAnswer, isCorrect);
  const mistakeType = isCorrect ? "NONE" : classifyMistake(newAnswer, problem);

  const strongAnswer = isCorrect && reasoning !== "INCORRECT";

  let feedback: string;
  let nextAction: NextAction;
  let nextHintLevel = input.session.currentHintLevel;

  if (strongAnswer) {
    feedback = buildFeedback(problem, true, reasoning, newAnswer);
    nextAction =
      attemptNumber === 1 && input.session.mode === "INDEPENDENT"
        ? "escalate_difficulty"
        : "accept";
  } else if (isCorrect && reasoning === "INCORRECT") {
    feedback =
      "Your final answer is correct, but the reasoning looks shaky — " +
      "this might be a lucky guess. Before we move on, can you explain " +
      "the key step that got you here?";
    nextAction = "retry";
    nextHintLevel = Math.max(nextHintLevel, HINT_LEVELS.QUESTION);
  } else {
    const attemptsLeft = MAX_RETRIES_BEFORE_REVEAL - attemptNumber;
    if (attemptsLeft <= 0 && input.session.currentHintLevel >= HINT_LEVELS.PARTIAL_SOLUTION) {
      feedback =
        "You've given this a solid effort. Let's walk through the " +
        "complete solution together so the concept clicks for next time.";
      nextAction = "reveal";
      nextHintLevel = HINT_LEVELS.FULL_SOLUTION;
    } else {
      feedback = buildFeedback(problem, false, reasoning, newAnswer, mistakeType);
      nextAction = "retry";
      nextHintLevel = Math.min(
        HINT_LEVELS.PARTIAL_SOLUTION,
        Math.max(input.session.currentHintLevel + 1, HINT_LEVELS.QUESTION)
      );
    }
  }

  const reasoningScore =
    reasoning === "STRONG"
      ? 90
      : reasoning === "ADEQUATE"
      ? 70
      : reasoning === "WEAK"
      ? 45
      : 25;

  return {
    isCorrect,
    reasoning,
    mistakeType,
    feedback,
    nextAction,
    nextHintLevel,
    reasoningScore,
  };
}

export function generateHint(
  problem: Problem,
  level: number
): HintContent {
  const clamped = Math.max(1, Math.min(6, level));
  const topic = problem.topic || "this topic";
  const title = problem.title || "this problem";

  switch (clamped) {
    case 1:
      return {
        level: 1,
        kind: "question",
        content:
          `Before we go further — what's your first instinct about ${title}? ` +
          `Which part of ${topic} feels most relevant here?`,
      };
    case 2:
      return {
        level: 2,
        kind: "concept",
        content:
          `Concept reminder: the core idea at play is ${topic}. ` +
          `Re-read the problem statement and underline the piece that connects to ${topic}.`,
      };
    case 3:
      return {
        level: 3,
        kind: "method",
        content:
          `Method hint: a reliable approach is to (1) identify the knowns, ` +
          `(2) write down the relationship from ${topic} that ties them together, ` +
          `and (3) solve for the unknown. Which relationship fits?`,
      };
    case 4:
      return {
        level: 4,
        kind: "step-guide",
        content:
          `Let's walk through it step by step.\n` +
          `Step 1 — Write down what you know.\n` +
          `Step 2 — Identify the formula or rule for ${topic}.\n` +
          `Step 3 — Substitute and simplify.\n` +
          `Step 4 — Check units / edge cases.\n` +
          `Try Step 1 now and tell me what you have.`,
      };
    case 5:
      return {
        level: 5,
        kind: "partial-solution",
        content:
          `Here's a partial scaffold:\n` +
          `• The relevant relationship is based on ${topic}.\n` +
          `• The final answer has the form "______ [units]".\n` +
          `Fill in the blank by plugging in the given numbers.`,
      };
    case 6:
    default:
      return {
        level: 6,
        kind: "full-solution",
        content:
          `Full solution:\n${problem.solution}\n\n` +
          `Study each step carefully — the goal is to be able to reproduce ` +
          `this reasoning on a similar problem next time.`,
      };
  }
}

function checkAnswer(student: string, problem: Problem): boolean {
  const s = student.trim();
  const canonical = problem.solution.trim();
  if (!s) return false;

  // Exact (case-insensitive) match
  if (canonical.toLowerCase() === s.toLowerCase()) return true;

  // Numeric with tolerance (handles "20", "20 m/s", "20.0")
  const canonNum = extractLeadingNumber(canonical);
  const studentNum = extractLeadingNumber(s);
  if (canonNum !== null && studentNum !== null) {
    const tol = Math.max(0.01, Math.abs(canonNum) * 0.02);
    if (Math.abs(canonNum - studentNum) <= tol) return true;
  }

  // Short canonical word answer — accept if student contains it
  if (canonical.length <= 30) {
    const rx = new RegExp(`\\b${escapeRegex(canonical)}\\b`, "i");
    if (rx.test(s)) return true;
  }

  return false;
}

function extractLeadingNumber(s: string): number | null {
  const m = s.match(/^-?\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[0]);
  return Number.isFinite(n) ? n : null;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function classifyMistake(answer: string, _problem: Problem): MistakeType {
  const a = answer.toLowerCase();
  if (/\b(unit|units|cm|m\/s|kg)\b/.test(a) && a.length < 40) return "CARELESS_MISTAKE";
  if (/\b(formula|equation|wrong formula)\b/.test(a)) return "WRONG_FORMULA";
  if (/\b(guess|no idea|idk|don'?t know)\b/.test(a)) return "CONCEPT_GAP";
  if (/\b(method|approach|wrong way)\b/.test(a)) return "WRONG_METHOD";
  if (/\b(misread|misunderstood|thought it was)\b/.test(a)) return "QUESTION_MISUNDERSTANDING";
  if (/\b(if|then|because|therefore|so)\b/.test(a) && a.length > 80) return "LOGICAL_ERROR";
  if (/\b(=|\+|-|\*|\/)\b/.test(a) && /\d/.test(a)) return "CALCULATION_ERROR";
  return a.length < 25 ? "INCOMPLETE_REASONING" : "CONCEPT_GAP";
}

function evaluateReasoning(answer: string, isCorrect: boolean): ReasoningQuality {
  const a = answer.trim();
  const words = a.split(/\s+/).filter(Boolean).length;
  const showsWork =
    /=|step|because|therefore|since|so|thus|implies|substituting/.test(a.toLowerCase());

  if (words < 5 && !showsWork) {
    return isCorrect ? "WEAK" : "INCORRECT";
  }
  if (showsWork && words >= 15) return isCorrect ? "STRONG" : "WEAK";
  if (showsWork) return "ADEQUATE";
  return isCorrect ? "ADEQUATE" : "WEAK";
}

function buildFeedback(
  problem: Problem,
  correct: boolean,
  reasoning: ReasoningQuality,
  _answer: string,
  mistakeType?: MistakeType
): string {
  const topic = problem.topic || "this topic";

  if (correct) {
    switch (reasoning) {
      case "STRONG":
        return (
          `Correct — and your reasoning is solid. ` +
          `You clearly understand ${topic}. Ready for a harder one?`
        );
      case "ADEQUATE":
        return (
          `Correct. Your reasoning mostly holds; tightening the explanation ` +
          `of the key step would make it airtight.`
        );
      case "WEAK":
        return (
          `The answer is right, but you didn't show much work. ` +
          `Can you explain the main step so I know it wasn't a guess?`
        );
      default:
        return "Correct on the surface — let's check the reasoning.";
    }
  }

  const label = humanize(mistakeType ?? "CONCEPT_GAP");
  return (
    `Good attempt — not quite there. I'm flagging this as a ${label}. ` +
    `Re-read the problem, think about ${topic}, and try again. ` +
    `If you want a hint, tap "Ask for a hint".`
  );
}

function humanize(m: MistakeType): string {
  return m
    .toLowerCase()
    .split("_")
    .join(" ");
}
