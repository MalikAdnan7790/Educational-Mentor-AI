import { chatCompletion, getFastModel, getModel } from "./client";
import { extractJson } from "./json";
import {
  missionGenResponseSchema,
  missionGenJsonSchema,
  missionStepEvalResponseSchema,
  missionStepEvalJsonSchema,
} from "./schemas";

export interface MissionGen {
  title: string;
  description: string;
  miniLesson: string;
  practice1: { question: string; answer: string };
  practice2: { question: string; answer: string };
  challenge: { question: string; answer: string };
  reTest: { question: string; answer: string };
}

export interface MissionStepEval {
  passed: boolean;
  score: number;
  feedback: string;
}

export interface MissionSource {
  mistakeType: string;
  description: string;
  why?: string | null;
  topic: string | null;
  subjectKey?: string | null;
  occurrences: number;
}

export async function generateMission(
  source: MissionSource,
  studentLevel?: string,
): Promise<MissionGen | null> {
  const resp = await chatCompletion<{ choices?: { message?: { content?: string } }[] }>({
    model: getModel(),
    messages: [
      {
        role: "system",
        content: `You are a master teacher designing a targeted recovery mission for one specific recurring weakness.
The mission has exactly 5 steps, each small enough to finish in one sitting:
1. miniLesson — a short, friendly explanation (max ~150 words) of the concept the student keeps getting wrong. Address the root cause, not symptoms.
2. practice1 — an easy practice question directly targeting the weakness.
3. practice2 — a slightly harder question on the same weakness.
4. challenge — a question that mixes the weak concept with one other concept, so the student must recognize WHEN it applies.
5. reTest — a final check question that would have been failed before the mission.
Rules for questions: answerable in 1-3 sentences or a short calculation; "answer" is the canonical correct answer in the simplest correct form; never reuse the same question twice; questions must be about the weak concept itself, not adjacent trivia.
The tone is encouraging — the student is capable, they just have one specific gap.`,
      },
      {
        role: "user",
        content: `Mistake type: ${source.mistakeType}
What went wrong: ${source.description}
${source.why ? `Root cause noted earlier: ${source.why}` : ""}
Topic: ${source.topic ?? "general"}
Subject: ${source.subjectKey ?? "general"}
Seen ${source.occurrences} times.
Student level: ${studentLevel ?? "school"}`,
      },
    ],
    response_format: { type: "json_schema", json_schema: { name: "mission_gen", schema: missionGenJsonSchema, strict: true } },
    temperature: 0.7,
    max_tokens: 4000,
  });

  const raw = resp.choices?.[0]?.message?.content;
  if (!raw) return null;
  const parsed = missionGenResponseSchema.safeParse(extractJson(raw));
  return parsed.success ? parsed.data : null;
}

export async function evaluateMissionStep(input: {
  kind: string;
  topic: string | null;
  question: string;
  expectedAnswer: string;
  studentAnswer: string;
  attempts: number;
}): Promise<MissionStepEval | null> {
  const resp = await chatCompletion<{ choices?: { message?: { content?: string } }[] }>({
    model: getFastModel(),
    messages: [
      {
        role: "system",
        content: `You are grading one step of a student's recovery mission. Grade honestly but fairly:
- passed=true only if the answer is essentially correct (minor wording differences are fine; wrong values, missing steps, or wrong concepts are not).
- score is 0-100: essentially correct = 80-100, partially right = 40-70, wrong or off-target = 0-35.
- feedback: 1-3 sentences. If wrong, point at the exact misunderstanding and connect it back to the mini lesson. Never insult the student. If this is their 3rd attempt, be extra concrete about what to do differently.
Never reveal or restate the canonical answer in feedback.`,
      },
      {
        role: "user",
        content: `Mission step type: ${input.kind}
Topic: ${input.topic ?? "general"}
Question: ${input.question}
Canonical answer: ${input.expectedAnswer}
Student's answer (attempt #${input.attempts}): ${input.studentAnswer}`,
      },
    ],
    response_format: { type: "json_schema", json_schema: { name: "mission_step_eval", schema: missionStepEvalJsonSchema, strict: true } },
    temperature: 0.2,
    max_tokens: 3000,
  });

  const raw = resp.choices?.[0]?.message?.content;
  if (!raw) return null;
  const parsed = missionStepEvalResponseSchema.safeParse(extractJson(raw));
  return parsed.success ? parsed.data : null;
}
