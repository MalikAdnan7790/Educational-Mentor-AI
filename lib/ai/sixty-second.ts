import { chatCompletion, getFastModel, getModel } from "./client";
import { extractJson } from "./json";
import {
  sixtySecondResponseSchema,
  sixtySecondJsonSchema,
  missionStepEvalResponseSchema,
  missionStepEvalJsonSchema,
} from "./schemas";

export interface SixtySecondLesson {
  concept: string;
  example: string;
  check: string;
  question: string;
}

export interface SixtySecondCheck {
  passed: boolean;
  score: number;
  feedback: string;
}

export async function generateSixtySecondLesson(input: {
  subjectKey: string | null;
  topic: string;
  studentLevel: string;
}): Promise<SixtySecondLesson | null> {
  const resp = await chatCompletion<{ choices?: { message?: { content?: string } }[] }>({
    model: getModel(),
    messages: [
      {
        role: "system",
        content: `You are the 60-Second Teacher. Teach one topic in three strictly time-boxed parts, then ask one question.
- concept (the 30-second part): the core idea in max ~80 words. Active teaching — define, connect to what a student already knows. Not a summary, not trivia.
- example (the 20-second part): one concrete worked mini-example, max ~50 words.
- check (the 10-second part): one single-line quick knowledge check the student answers mentally in seconds (e.g. a tiny "which is it?" or "what would happen if…").
- question: one real question for the student to answer in 1-2 sentences after the 60 seconds, testing whether they understood the concept (not memorization of the example).
Never give the answer to the question away in the other parts.`,
      },
      {
        role: "user",
        content: `Subject: ${input.subjectKey ?? "General"}
Topic: ${input.topic}
Student level: ${input.studentLevel}`,
      },
    ],
    response_format: { type: "json_schema", json_schema: { name: "sixty_second", schema: sixtySecondJsonSchema, strict: true } },
    temperature: 0.6,
    max_tokens: 3000,
  });

  const raw = resp.choices?.[0]?.message?.content;
  if (!raw) return null;
  const parsed = sixtySecondResponseSchema.safeParse(extractJson(raw));
  return parsed.success ? parsed.data : null;
}

export async function checkSixtySecondAnswer(input: {
  topic: string;
  question: string;
  studentAnswer: string;
}): Promise<SixtySecondCheck | null> {
  const resp = await chatCompletion<{ choices?: { message?: { content?: string } }[] }>({
    model: getFastModel(),
    messages: [
      {
        role: "system",
        content: `You are grading a student's one-question check after a 60-second lesson. Grade honestly but fairly:
- passed=true only if the answer shows they understood the concept (minor wording differences are fine).
- score 0-100: understood = 80-100, partially = 40-70, wrong or off-target = 0-35.
- feedback: 1-2 sentences. If wrong, name the exact misunderstanding and connect it back to the lesson. Never insult. Never reveal the canonical answer.`,
      },
      {
        role: "user",
        content: `Topic: ${input.topic}
Question: ${input.question}
Student's answer: ${input.studentAnswer}`,
      },
    ],
    response_format: { type: "json_schema", json_schema: { name: "sixty_second_check", schema: missionStepEvalJsonSchema, strict: true } },
    temperature: 0.2,
    max_tokens: 3000,
  });

  const raw = resp.choices?.[0]?.message?.content;
  if (!raw) return null;
  const parsed = missionStepEvalResponseSchema.safeParse(extractJson(raw));
  return parsed.success ? parsed.data : null;
}
