import { chatCompletion, getFastModel } from "./client";
import { extractJson } from "./json";
import {
  examGenResponseSchema,
  examGenJsonSchema,
  examShortGradeResponseSchema,
  examShortGradeJsonSchema,
  examSummaryResponseSchema,
  examSummaryJsonSchema,
} from "./schemas";
import type { Difficulty } from "@/types/prisma-enums";

export interface GeneratedExamQuestion {
  type: "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER" | "CONCEPT" | "SCENARIO" | "CODING";
  question: string;
  options: string[] | null;
  answer: string;
  points: number;
}

export interface GeneratedExam {
  title: string;
  questions: GeneratedExamQuestion[];
}

export async function generateExam(input: {
  subjectKey?: string;
  topic?: string;
  difficulty: Difficulty;
  questionCount: number;
  sourceText?: string;
}): Promise<GeneratedExam | null> {
  const subject = input.subjectKey ? `Subject: ${input.subjectKey}` : "";
  const topic = input.topic ? `Topic: ${input.topic}` : "";
  const source = input.sourceText
    ? `\n\nIMPORTANT: Generate ALL questions strictly from this study material the student uploaded. Test understanding of its content, not outside knowledge:\n"""${input.sourceText}"""`
    : "";

  const resp = await chatCompletion<{ choices?: { message?: { content?: string } }[] }>({
    model: getFastModel(),
    messages: [
      {
        role: "system",
        content:
          "You are an exam setter. Create a balanced practice exam. Use a mix of question types: ~40% MCQ (4 options, one correct), ~15% TRUE_FALSE, ~15% SHORT_ANSWER, ~10% CONCEPT (explain a concept or relationship), ~10% SCENARIO (apply knowledge to a real-world situation), ~10% CODING (write or debug code if subject is programming, otherwise skip CODING). Shuffle types so they interleave. For MCQ, options has exactly 4 entries and answer must match one option EXACTLY — make distractors plausible but clearly wrong. For TRUE_FALSE, options is [\"True\", \"False\"] and answer is \"True\" or \"False\". For SHORT_ANSWER/CONCEPT/SCENARIO/CODING, options is null and answer is a concise canonical answer. Questions must be answerable from the material given, unambiguous, and clearly worded.",
      },
      {
        role: "user",
        content: `${subject}\n${topic}\nDifficulty: ${input.difficulty}\nNumber of questions: exactly ${input.questionCount}${source}`,
      },
    ],
    response_format: { type: "json_schema", json_schema: { name: "exam_gen", schema: examGenJsonSchema, strict: true } },
    temperature: 0.6,
    max_tokens: 3000,
  });

  const raw = resp.choices?.[0]?.message?.content;
  if (!raw) return null;
  const parsed = examGenResponseSchema.safeParse(extractJson(raw));
  if (!parsed.success) return null;

  const questions = parsed.data.questions.slice(0, input.questionCount);
  if (questions.length === 0) return null;
  return { title: parsed.data.title, questions };
}

export interface ShortAnswerGrade {
  isCorrect: boolean;
  analysis: string;
}

export async function gradeShortAnswer(
  question: string,
  canonicalAnswer: string,
  studentAnswer: string,
): Promise<ShortAnswerGrade | null> {
  const resp = await chatCompletion<{ choices?: { message?: { content?: string } }[] }>({
    model: getFastModel(),
    messages: [
      {
        role: "system",
        content:
          "You are a fair exam grader. Grade the short answer leniently but honestly: isCorrect only if the core idea is right, even if wording differs. analysis is 1-2 sentences telling the student what was right or missing.",
      },
      {
        role: "user",
        content: `Question: ${question}\nCanonical answer: ${canonicalAnswer}\nStudent's answer: ${studentAnswer}`,
      },
    ],
    response_format: { type: "json_schema", json_schema: { name: "exam_short_grade", schema: examShortGradeJsonSchema, strict: true } },
    temperature: 0.2,
    max_tokens: 3000,
  });

  const raw = resp.choices?.[0]?.message?.content;
  if (!raw) return null;
  const parsed = examShortGradeResponseSchema.safeParse(extractJson(raw));
  return parsed.success ? parsed.data : null;
}

export interface ExamSummaryResult {
  weakTopics: string[];
  revision: string[];
  mistakeAnalysis: string[];
  feedback: string;
}

export async function summarizeExam(
  title: string,
  results: {
    question: string;
    type: string;
    studentAnswer: string | null;
    answer: string;
    isCorrect: boolean | null;
    analysis: string | null;
  }[],
  scorePct: number,
): Promise<ExamSummaryResult | null> {
  const transcript = results
    .map(
      (q, i) =>
        `Q${i + 1} (${q.type}): ${q.question}\nStudent: ${q.studentAnswer ?? "(blank)"}\nCorrect answer: ${q.answer}\nResult: ${q.isCorrect ? "correct" : "wrong"}${q.analysis ? ` — ${q.analysis}` : ""}`,
    )
    .join("\n\n");

  const resp = await chatCompletion<{ choices?: { message?: { content?: string } }[] }>({
    model: getFastModel(),
    messages: [
      {
        role: "system",
        content:
          "You are a teacher reviewing a completed exam with the student. weakTopics: exact topics/concepts to re-study (empty if none). revision: 2-4 concrete revision actions. mistakeAnalysis: one line per wrong question naming the specific error (e.g. 'Q3: confused mitosis with meiosis'), empty if all correct. feedback: 2-3 encouraging sentences mentioning the score.",
      },
      { role: "user", content: `Exam: ${title}\nScore: ${Math.round(scorePct)}%\n\n${transcript}` },
    ],
    response_format: { type: "json_schema", json_schema: { name: "exam_summary", schema: examSummaryJsonSchema, strict: true } },
    temperature: 0.3,
    max_tokens: 3000,
  });

  const raw = resp.choices?.[0]?.message?.content;
  if (!raw) return null;
  const parsed = examSummaryResponseSchema.safeParse(extractJson(raw));
  return parsed.success ? parsed.data : null;
}
