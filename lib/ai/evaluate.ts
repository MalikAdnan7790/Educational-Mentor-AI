import { z } from "zod";
import { getOpenAI, getFastModel } from "./client";
import { evaluateResponseSchema, evaluateJsonSchema } from "./schemas";
import { toAIError } from "./errors";
import {
  type AnalysisResult,
  type NextAction,
  type SessionInput,
  HINT_LEVELS,
  analyzeAttempt as mockAnalyze,
  generateHint as mockGenerateHint,
} from "@/lib/independent-engine";
import type { MistakeType, ReasoningQuality } from "@/types/prisma-enums";

const MAX_RETRIES_BEFORE_REVEAL = 4;

interface LLMClassification {
  isCorrect: boolean;
  mistakeType: MistakeType;
  reasoning: ReasoningQuality;
  feedback: string;
  conceptGap: string | null;
}

export async function evaluateAttempt(input: SessionInput): Promise<AnalysisResult & { conceptGap?: string }> {
  const client = getOpenAI();

  if (!client) {
    return mockAnalyze(input);
  }

  try {
    const classification = await classifyWithLLM(client, input);
    return buildAnalysisResult(classification, input);
  } catch (err) {
    // Fallback to mock on any AI failure
    return mockAnalyze(input);
  }
}

async function classifyWithLLM(
  client: ReturnType<typeof getOpenAI> & {},
  input: SessionInput,
): Promise<LLMClassification> {
  const { problem, previousAttempts, newAnswer } = input;

  const prompt = `Analyze this student's attempt.

Problem: ${problem.title}
Subject: ${problem.subject} — Topic: ${problem.topic}
Problem statement: ${problem.content}
Canonical solution: ${problem.solution}

Student's answer: ${newAnswer}
Attempt number: ${previousAttempts.length + 1}
Previous attempts: ${previousAttempts.length > 0 ? previousAttempts.map((a, i) => `#${i + 1}: ${a.answer} (${a.isCorrect ? "correct" : "wrong"})`).join("; ") : "none"}

Determine:
1. isCorrect: Is the student's answer correct?
2. mistakeType: What type of mistake (if wrong)?
3. reasoning: How strong is the reasoning shown?
4. feedback: Brief, encouraging feedback (2-3 sentences)
5. conceptGap: If wrong, what concept does the student need to review? (or null)`;

  const resp = await client.chat.completions.create({
    model: getFastModel(),
    messages: [
      { role: "system", content: "You are an expert educational evaluator. Analyze student attempts with precision." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_schema", json_schema: { name: "evaluate", schema: evaluateJsonSchema, strict: true } },
    temperature: 0.1,
    max_tokens: 400,
  });

  const raw = resp.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty response");

  const parsed = evaluateResponseSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) throw new Error("Parse failed");

  return parsed.data;
}

function buildAnalysisResult(
  c: LLMClassification,
  input: SessionInput,
): AnalysisResult & { conceptGap?: string } {
  const attemptNumber = input.previousAttempts.length + 1;
  const strongAnswer = c.isCorrect && c.reasoning !== "INCORRECT";

  let nextAction: NextAction;
  let nextHintLevel = input.session.currentHintLevel;

  if (strongAnswer) {
    nextAction =
      attemptNumber === 1 && input.session.mode === "INDEPENDENT"
        ? "escalate_difficulty"
        : "accept";
  } else if (c.isCorrect && c.reasoning === "INCORRECT") {
    nextAction = "retry";
    nextHintLevel = Math.max(nextHintLevel, HINT_LEVELS.QUESTION);
  } else {
    const attemptsLeft = MAX_RETRIES_BEFORE_REVEAL - attemptNumber;
    if (attemptsLeft <= 0 && input.session.currentHintLevel >= HINT_LEVELS.PARTIAL_SOLUTION) {
      nextAction = "reveal";
      nextHintLevel = HINT_LEVELS.FULL_SOLUTION;
    } else {
      nextAction = "retry";
      nextHintLevel = Math.min(
        HINT_LEVELS.PARTIAL_SOLUTION,
        Math.max(input.session.currentHintLevel + 1, HINT_LEVELS.QUESTION),
      );
    }
  }

  const reasoningScore =
    c.reasoning === "STRONG" ? 90
    : c.reasoning === "ADEQUATE" ? 70
    : c.reasoning === "WEAK" ? 45
    : 25;

  return {
    isCorrect: c.isCorrect,
    reasoning: c.reasoning,
    mistakeType: c.mistakeType,
    feedback: c.feedback,
    nextAction,
    nextHintLevel,
    reasoningScore,
    conceptGap: c.conceptGap ?? undefined,
  };
}

export async function generateHintContent(
  problem: { title: string; topic: string; content: string; solution: string; subject: string },
  level: number,
): Promise<{ level: number; content: string; kind: string }> {
  const client = getOpenAI();

  if (!client || level === 6) {
    return mockGenerateHint(problem as any, level);
  }

  try {
    const kind = levelToKind(level);
    const prompt = `Generate a level-${level} hint for this problem.

Problem: ${problem.title}
Topic: ${problem.topic}
Statement: ${problem.content}

Hint type: ${kind}
Rules:
- Level 1 (question): Ask what the student thinks about the problem.
- Level 2 (concept): Remind the key concept without giving away the method.
- Level 3 (method): Suggest an approach/method without specific steps.
- Level 4 (step-guide): Give numbered steps without solving.
- Level 5 (partial-solution): Give a scaffold with blanks to fill.

Keep it under 100 words. Be encouraging.`;

    const resp = await client.chat.completions.create({
      model: getFastModel(),
      messages: [
        { role: "system", content: "You generate educational hints. Never give the final answer except at level 6." },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 300,
    });

    const content = resp.choices[0]?.message?.content?.trim();
    if (!content) return mockGenerateHint(problem as any, level);

    return { level, content, kind };
  } catch {
    return mockGenerateHint(problem as any, level);
  }
}

function levelToKind(level: number): string {
  switch (level) {
    case 1: return "question";
    case 2: return "concept";
    case 3: return "method";
    case 4: return "step-guide";
    case 5: return "partial-solution";
    default: return "full-solution";
  }
}
