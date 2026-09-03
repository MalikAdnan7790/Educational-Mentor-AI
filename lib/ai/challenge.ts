import { z } from "zod";
import { chatCompletion, getOpenAI, getModel, getFastModel } from "./client";
import {
  challengeGenResponseSchema,
  challengeGenJsonSchema,
  challengeGradeResponseSchema,
  challengeGradeJsonSchema,
} from "./schemas";
import type { Difficulty } from "@/types/prisma-enums";

export interface ChallengeGenResult {
  problemText: string;
  solution: string;
  difficulty: Difficulty;
}

export interface ChallengeGradeResult {
  isCorrect: boolean;
  score: number;
  analysis: string;
}

// Adaptive ladder: Easy → Medium → Hard → Real-world. Solving well moves up,
// struggling moves down, partial stays put.
export function nextAdaptiveDifficulty(current: Difficulty, score: number): Difficulty {
  const up: Record<Difficulty, Difficulty> = {
    EASY: "MEDIUM",
    MEDIUM: "HARD",
    HARD: "REAL_WORLD",
    REAL_WORLD: "REAL_WORLD",
  };
  const down: Record<Difficulty, Difficulty> = {
    EASY: "EASY",
    MEDIUM: "EASY",
    HARD: "MEDIUM",
    REAL_WORLD: "HARD",
  };
  if (score >= 60) return up[current];
  if (score < 40) return down[current];
  return current;
}

export async function generateChallenge(
  subjectKey: string | null,
  topic: string | null,
  difficulty: Difficulty,
  studentLevel: string,
  hint?: string,
): Promise<ChallengeGenResult | null> {
  if (!getOpenAI()) return null;

  try {
    const resp = await chatCompletion<{ choices?: { message?: { content?: string } }[] }>({
      model: getModel(),
      messages: [
        {
          role: "system",
          content: `Generate a practice challenge for a ${studentLevel} student.
- Problem must be solvable, self-contained, and have a clear, verifiable answer. Use clean numbers that work out exactly.
- Include enough detail for the student to work through it.
- Before responding, solve the problem yourself step by step and verify every arithmetic step. The solution must be correct — it is never shown to the student but IS used to grade them.
- The solution field must contain the full worked solution, ending with the final answer clearly stated (with units). Never a bare number.
- Difficulty: ${difficulty}${difficulty === "REAL_WORLD" ? " — top of the ladder: frame the problem as a realistic scenario from daily life, work, or engineering where the topic is genuinely applied. Hard, but concrete and self-contained" : ""}`,
        },
        {
          role: "user",
          content: `Subject: ${subjectKey || "General"}\nTopic: ${topic || "General problem-solving"}${hint ? `\nPersonalization: ${hint}` : ""}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "challenge_gen", schema: challengeGenJsonSchema, strict: true },
      },
      temperature: 0.7,
      max_tokens: 4000,
    });

    const raw = resp.choices?.[0]?.message?.content;
    if (!raw) return null;
    const parsed = challengeGenResponseSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;

    return {
      problemText: parsed.data.problemText,
      solution: parsed.data.solution,
      difficulty: parsed.data.difficulty as Difficulty,
    };
  } catch {
    return null;
  }
}

export async function gradeChallenge(
  problemText: string,
  canonicalSolution: string,
  studentAnswer: string,
): Promise<ChallengeGradeResult> {
  if (!getOpenAI()) {
    // Deterministic fallback: exact match
    const correct = studentAnswer.trim().toLowerCase() === canonicalSolution.trim().toLowerCase();
    return { isCorrect: correct, score: correct ? 100 : 0, analysis: correct ? "Correct!" : "Not quite. Try reviewing the problem." };
  }

  try {
    const resp = await chatCompletion<{ choices?: { message?: { content?: string } }[] }>({
      model: getFastModel(),
      messages: [
        {
          role: "system",
          content: `Grade a student's answer to a challenge problem. Grade honestly but fairly:
- First identify the student's final answer exactly as they stated it — quote their value, never invent one.
- isCorrect=true only if the final answer is essentially correct (minor rounding or wording differences are fine; wrong values or wrong units are not).
- score 0-100: essentially correct = 80-100, partially right = 40-70, wrong or off-target = 0-35.
- If the student's final answer differs from the canonical solution, solve the problem yourself step by step before penalizing: if the student's working is verifiably correct, score 80+ and say the answer is correct; if the canonical solution itself appears wrong, say so plainly. Never mark a verifiably correct answer wrong.
- analysis: 1-3 sentences pointing at the exact step that went right or wrong. Base it strictly on the text provided; never claim the student wrote something they did not.
- Never reveal or restate the canonical solution in the analysis.`,
        },
        {
          role: "user",
          content: `Problem: ${problemText}\n\nCanonical solution: ${canonicalSolution}\n\nStudent's answer: ${studentAnswer}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "challenge_grade", schema: challengeGradeJsonSchema, strict: true },
      },
      temperature: 0.1,
      max_tokens: 3000,
    });

    const raw = resp.choices?.[0]?.message?.content;
    if (!raw) throw new Error("Empty response");
    const parsed = challengeGradeResponseSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) throw new Error("Parse failed");

    return parsed.data;
  } catch {
    const correct = studentAnswer.trim().toLowerCase() === canonicalSolution.trim().toLowerCase();
    return { isCorrect: correct, score: correct ? 100 : 0, analysis: correct ? "Correct!" : "Not quite." };
  }
}
