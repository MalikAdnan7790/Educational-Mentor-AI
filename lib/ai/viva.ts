import { chatCompletion, getFastModel } from "./client";
import { extractJson } from "./json";
import {
  vivaQuestionResponseSchema,
  vivaQuestionJsonSchema,
  vivaGradeResponseSchema,
  vivaGradeJsonSchema,
  vivaSummaryResponseSchema,
  vivaSummaryJsonSchema,
} from "./schemas";
import type { Difficulty } from "@/types/prisma-enums";

const LANGUAGE_NAME: Record<string, string> = {
  EN: "English",
  UR: "Urdu (اردو)",
  ROMAN_UR: "Roman Urdu",
};

export interface VivaQuestionGen {
  question: string;
  concept: string;
}

export async function generateVivaQuestion(input: {
  topic: string;
  difficulty: Difficulty;
  language: string;
  order: number;
  previousQA: { question: string; answer: string | null; concept: string | null }[];
  studentLevel?: string;
}): Promise<VivaQuestionGen | null> {
  const qa =
    input.previousQA.length > 0
      ? "\n\nQuestions already asked (do NOT repeat them):\n" +
        input.previousQA.map((q, i) => `${i + 1}. ${q.question}`).join("\n")
      : "";

  const resp = await chatCompletion<{ choices?: { message?: { content?: string } }[] }>({
    model: getFastModel(),
    messages: [
      {
        role: "system",
        content:
          "You are an examiner conducting an oral viva. Ask ONE open-ended question that tests understanding, not memorization — the student must explain in their own words. The question must be answerable verbally in 1-3 sentences. Respond only with the question and the concept it tests.",
      },
      {
        role: "user",
        content: `Topic: ${input.topic}\nDifficulty: ${input.difficulty}\nQuestion number: ${input.order}\nStudent level: ${input.studentLevel ?? "school"}\nLanguage: ${LANGUAGE_NAME[input.language] ?? "English"}${qa}`,
      },
    ],
    response_format: { type: "json_schema", json_schema: { name: "viva_question", schema: vivaQuestionJsonSchema, strict: true } },
    temperature: 0.8,
    max_tokens: 3000,
  });

  const raw = resp.choices?.[0]?.message?.content;
  if (!raw) return null;
  const parsed = vivaQuestionResponseSchema.safeParse(extractJson(raw));
  return parsed.success ? parsed.data : null;
}

export interface VivaGrade {
  isCorrect: boolean;
  understanding: number;
  feedback: string;
  followUp: string;
}

export async function gradeVivaAnswer(input: {
  question: string;
  concept: string | null;
  studentAnswer: string;
  difficulty: Difficulty;
  language: string;
}): Promise<VivaGrade | null> {
  const resp = await chatCompletion<{ choices?: { message?: { content?: string } }[] }>({
    model: getFastModel(),
    messages: [
      {
        role: "system",
        content:
          "You are an examiner grading an oral viva answer. Grade the depth of understanding shown (0-100), whether the core idea is correct, and give short encouraging feedback. followUp is a tiny extra probe in the same reply (one sentence) that deepens thinking — or an empty string if the answer was excellent.",
      },
      {
        role: "user",
        content: `Question: ${input.question}\nConcept tested: ${input.concept ?? "general understanding"}\nDifficulty: ${input.difficulty}\nStudent's spoken answer: ${input.studentAnswer}`,
      },
    ],
    response_format: { type: "json_schema", json_schema: { name: "viva_grade", schema: vivaGradeJsonSchema, strict: true } },
    temperature: 0.2,
    max_tokens: 3000,
  });

  const raw = resp.choices?.[0]?.message?.content;
  if (!raw) return null;
  const parsed = vivaGradeResponseSchema.safeParse(extractJson(raw));
  return parsed.success ? parsed.data : null;
}

export interface VivaSummary {
  strongAreas: string[];
  weakAreas: string[];
  practiceTopics: string[];
  feedback: string;
}

export async function summarizeViva(
  topic: string,
  qa: { question: string; concept: string | null; answer: string | null; understanding: number | null; isCorrect: boolean | null }[],
): Promise<VivaSummary | null> {
  const transcript = qa
    .map(
      (q, i) =>
        `Q${i + 1}: ${q.question}\nA: ${q.answer ?? "(no answer)"}\nGrade: ${q.isCorrect ? "correct" : "incorrect"} (understanding ${q.understanding ?? "-"}/100)`,
    )
    .join("\n\n");

  const resp = await chatCompletion<{ choices?: { message?: { content?: string } }[] }>({
    model: getFastModel(),
    messages: [
      {
        role: "system",
        content:
          "You are an examiner writing the final viva report. Be specific: name the exact concepts the student handled well or struggled with. feedback is 2-4 encouraging sentences addressed directly to the student.",
      },
      { role: "user", content: `Viva topic: ${topic}\n\nTranscript:\n${transcript}` },
    ],
    response_format: { type: "json_schema", json_schema: { name: "viva_summary", schema: vivaSummaryJsonSchema, strict: true } },
    temperature: 0.3,
    max_tokens: 3000,
  });

  const raw = resp.choices?.[0]?.message?.content;
  if (!raw) return null;
  const parsed = vivaSummaryResponseSchema.safeParse(extractJson(raw));
  return parsed.success ? parsed.data : null;
}
